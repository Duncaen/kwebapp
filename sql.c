/*	$Id$ */
/*
 * Copyright (c) 2017 Kristaps Dzonsons <kristaps@bsd.lv>
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
#include "config.h"

#include <sys/queue.h>

#if HAVE_ERR
# include <err.h>
#endif
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "extern.h"

static	const char *const ftypes[FTYPE__MAX] = {
	"INTEGER",
	"TEXT",
	NULL,
};

static void
gen_fkeys(const struct field *f, int *first)
{

	if (FTYPE_STRUCT == f->type || NULL == f->ref)
		return;

	printf("%s\n\tFOREIGN KEY(%s) REFERENCES %s(%s)",
		*first ? "" : ",",
		f->ref->source->name,
		f->ref->target->parent->name,
		f->ref->target->name);
	*first = 0;
}

static void
gen_field(const struct field *f, int *first)
{

	if (FTYPE_STRUCT == f->type)
		return;

	printf("%s\n", *first ? "" : ",");

	gen_comment(f->doc, 1, NULL, "-- ", NULL);

	switch (f->type) {
	case (FTYPE_INT):
		printf("\t%s %s", f->name, ftypes[FTYPE_INT]);
		if (FIELD_ROWID & f->flags)
			printf(" PRIMARY KEY");
		break;
	case (FTYPE_TEXT):
		printf("\t%s %s", f->name, ftypes[FTYPE_TEXT]);
		break;
	default:
		break;
	}

	*first = 0;
}

static void
gen_struct(const struct strct *p)
{
	const struct field *f;
	int	 first = 1;

	gen_comment(p->doc, 0, NULL, "-- ", NULL);

	printf("CREATE TABLE %s (", p->name);
	TAILQ_FOREACH(f, &p->fq, entries)
		gen_field(f, &first);
	TAILQ_FOREACH(f, &p->fq, entries)
		gen_fkeys(f, &first);
	puts("\n);\n"
	     "");
}

void
gen_sql(const struct strctq *q)
{
	const struct strct *p;

	puts("PRAGMA foreign_keys=ON;\n"
	     "");

	TAILQ_FOREACH(p, q, entries)
		gen_struct(p);
}

/*
 * Perform a variety of checks: the fields must have the
 * same type, flags (rowid, etc.), and references.
 * Returns zero on difference, non-zero on equality.
*/
static int
gen_diff_field(const struct field *f, const struct field *df)
{
	int	 rc = 1;

	if (f->type != df->type) {
		warnx("%s.%s: type change from %s to %s",
			f->parent->name, f->name,
			ftypes[df->type],
			ftypes[f->type]);
		rc = 0;
	} 

	if (f->flags != df->flags) {
		warnx("%s.%s: attribute change",
			f->parent->name, f->name);
		rc = 0;
	}

	if ((NULL != f->ref && NULL == df->ref) ||
	    (NULL == f->ref && NULL != df->ref)) {
		warnx("%s.%s: reference change",
			f->parent->name, f->name);
		rc = 0;
	}

	if (NULL != f->ref && NULL != df->ref &&
	    (strcasecmp(f->ref->source->parent->name,
			df->ref->source->parent->name))) {
		warnx("%s.%s: reference source change from %s to %s",
			f->parent->name, f->name,
			f->ref->source->parent->name,
			df->ref->source->parent->name);
		rc = 0;
	}

	return(rc);
}

static int
gen_diff_fields_old(const struct strct *s, const struct strct *ds)
{
	const struct field *f, *df;
	size_t	 errors = 0;

	TAILQ_FOREACH(df, &ds->fq, entries) {
		TAILQ_FOREACH(f, &s->fq, entries)
			if (0 == strcasecmp(f->name, df->name))
				break;

		if (NULL == f && FTYPE_STRUCT == df->type) {
			warnx("%s.%s: old inner joined field",
				df->parent->name, df->name);
		} else if (NULL == f) {
			warnx("%s.%s: column was dropped",
				df->parent->name, df->name);
			errors++;
		} else if ( ! gen_diff_field(df, f))
			errors++;
	}

	return(errors ? 0 : 1);
}

static int
gen_diff_fields_new(const struct strct *s, const struct strct *ds)
{
	const struct field *f, *df;
	size_t	 count = 0, errors = 0;

	/*
	 * Structure in both new and old queues.
	 * Go through all fields in the new queue.
	 * If they're not found in the old queue, modify and add.
	 * Otherwise, make sure they're the same type and have the same
	 * references.
	 */

	TAILQ_FOREACH(f, &s->fq, entries) {
		TAILQ_FOREACH(df, &ds->fq, entries)
			if (0 == strcasecmp(f->name, df->name))
				break;

		/* 
		 * New "struct" fields are a no-op.
		 * Otherwise, have an ALTER TABLE clause.
		 */

		if (NULL == df && FTYPE_STRUCT == f->type) {
			warnx("%s.%s: new inner joined field",
				f->parent->name, f->name);
		} else if (NULL == df) {
			printf("ALTER TABLE %s ADD COLUMN %s %s",
				f->parent->name, f->name, 
				ftypes[f->type]);
			if (FIELD_ROWID & f->flags)
				printf(" PRIMARY KEY");
			if (NULL != f->ref)
				printf(" REFERENCES %s(%s)",
					f->ref->target->parent->name,
					f->ref->target->name);
			puts(";");
			count++;
		} else if ( ! gen_diff_field(f, df))
			errors++;
	}

	return(errors ? -1 : count ? 1 : 0);
}

int
gen_diff(const struct strctq *sq, const struct strctq *dsq)
{
	const struct strct *s, *ds;
	size_t	 errors = 0;
	int	 rc;

	puts("PRAGMA foreign_keys=ON;\n"
	     "");

	/*
	 * Start by looking through all structures in the new queue and
	 * see if they exist in the old queue.
	 * If they don't exist in the old queue, we put out a CREATE
	 * TABLE for them.
	 * We do this first to handle ADD COLUMN dependencies.
	 */

	TAILQ_FOREACH(s, sq, entries) {
		TAILQ_FOREACH(ds, dsq, entries)
			if (0 == strcasecmp(s->name, ds->name))
				break;
		if (NULL == ds)
			gen_struct(s);
	}

	/* 
	 * Now generate table differences.
	 * Do this afterward because we might reference the new tables
	 * that we've created.
	 * If the old configuration has different fields, exit with
	 * error.
	 */

	TAILQ_FOREACH(s, sq, entries) {
		TAILQ_FOREACH(ds, dsq, entries)
			if (0 == strcasecmp(s->name, ds->name))
				break;
		if (NULL == ds)
			continue;
		if ((rc = gen_diff_fields_new(s, ds)) < 0)
			errors++;
		else if (rc)
			puts("");
	}

	/*
	 * Now reverse and see if we should drop tables.
	 * Don't do this---just tell the user and return an error.
	 * Also see if there are old fields that are different.
	 */

	TAILQ_FOREACH(ds, dsq, entries) {
		TAILQ_FOREACH(s, sq, entries)
			if (0 == strcasecmp(s->name, ds->name))
				break;
		if (NULL == s) {
			warnx("%s: table was dropped", ds->name);
			errors++;
		} else if ( ! gen_diff_fields_old(s, ds))
			errors++;
	}
	
	return(errors ? 0 : 1);
}