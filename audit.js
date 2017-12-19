(function(root) {
	'use strict';

	function clr(root)
	{
		var e;
		if (null !== (e = find(root))) 
			while (e.firstChild)
				e.removeChild(e.firstChild);
		return(e);
	}

	function repl(root, text)
	{
		var e;
		if (null !== (e = clr(root))) 
			e.appendChild(document.createTextNode(text));
		return(e);
	}

	function showcl(root, name)
	{
		var list, i, sz, e;
		if (null === (e = find(root)))
			return;
		list = e.getElementsByClassName(name);
		for (i = 0, sz = list.length; i < sz; i++)
			show(list[i]);
	}

	function hidecl(root, name)
	{
		var list, i, sz, e;
		if (null === (e = find(root)))
			return;
		list = e.getElementsByClassName(name);
		for (i = 0, sz = list.length; i < sz; i++)
			hide(list[i]);
	}

	function replcl(root, name, text)
	{
		var list, i, sz, e;
		if (null === (e = find(root)))
			return;
		list = e.getElementsByClassName(name);
		for (i = 0, sz = list.length; i < sz; i++)
			repl(list[i], text);
	}

	function find(root)
	{
		return((typeof root !== 'string') ? 
			root : document.getElementById(root));
	}

	function show(root)
	{
		var e;
		if (null === (e = find(root)))
			return(null);
		if (e.classList.contains('hide'))
			e.classList.remove('hide');
		return(e);
	}

	function hide(root)
	{
		var e;
		if (null === (e = find(root)))
			return(null);
		if ( ! e.classList.contains('hide'))
			e.classList.add('hide');
		return(e);
	}

	function attr(root, key, val)
	{
		var e;
		if (null !== (e = find(root)))
			e.setAttribute(key, val);
		return(e);
	}

	function attrcl(root, name, key, val)
	{
		var list, i, sz, e;
		if (null === (e = find(root)))
			return;
		list = e.getElementsByClassName(name);
		for (i = 0, sz = list.length; i < sz; i++)
			attr(list[i], key, val);
	}

	function auditAccessfromFill(data, root)
	{
		var obj, list, i;
		if (null === (obj = auditFunctionGet(data.function)))
			return;
		replcl(root, 'audit-data-accessfrom-function', data.function);
		list = root.getElementsByClassName('audit-accessfrom-more');
		for (i = 0; i < list.length; i++)
			list[i].onclick = function(d, o) {
				return function() {
					var e = show('aside');
					hidecl(e, 'aside-types');
					fillAccessfrom(show('aside-function-accessfrom'), d, o);
				};
			}(data, obj);
		replcl(root, 'audit-data-accessfrom-path', data.paths.length);
	}

	function auditDataFill(data, root)
	{
		replcl(root, 'audit-data-field-name', data.field);
		if (data.export) {
			hidecl(root, 'audit-data-field-noexport');
			showcl(root, 'audit-data-field-export');
		} else {
			showcl(root, 'audit-data-field-noexport');
			hidecl(root, 'audit-data-field-export');
		}
	}

	function auditFunctionGet(name)
	{
		var obj;
		if ( ! (name in audit.functions) ||
		    null === (obj = audit.functions[name])) {
			console.log('cannot find function: ' + name);
			return(null);
		}
		return(obj);
	}

	function fillShowMore(root, type, name, func)
	{
		var list, i;

		list = root.getElementsByClassName('audit-' + type + '-more');
		for (i = 0; i < list.length; i++)
			list[i].onclick = function(n, t, f) {
				return function() {
					var e = show('aside');
					hidecl(e, 'aside-types');
					f(show('aside-function-' + t), n);
				};
			}(name, type, func);
	}
	function fillUpdate(root, name)
	{
		var obj;
		if (null === (obj = auditFunctionGet(name)))
			return;
		replcl(root, 'audit-update-function', name);
		if (null !== obj.doc) {
			replcl(root, 'audit-update-doc', obj.doc);
			showcl(root, 'audit-update-doc');
			hidecl(root, 'audit-update-nodoc');
		} else {
			hidecl(root, 'audit-update-doc');
			showcl(root, 'audit-update-nodoc');
		}
		fillShowMore(root, 'update', name, fillUpdate);
	}

	function fillAccessfrom(root, data, obj)
	{
		var row, col, list, i, j, k;

		replcl(root, 'audit-accessfrom-function', data.function);
		if (null !== obj.doc) {
			replcl(root, 'audit-accessfrom-doc', obj.doc);
			showcl(root, 'audit-accessfrom-doc');
			hidecl(root, 'audit-accessfrom-nodoc');
		} else {
			hidecl(root, 'audit-accessfrom-doc');
			showcl(root, 'audit-accessfrom-nodoc');
		}
		list = root.getElementsByClassName('audit-accessfrom-paths');
		for (i = 0; i < list.length; i++) {
			clr(list[i]);
			for (j = 0; j < data.paths.length; j++) {
				row = document.createElement('li');
				list[i].appendChild(row);
				for (k = 0; k < data.paths[j].length; k++) {
					col = document.createElement('span');
					row.appendChild(col);
					repl(col, data.paths[j][k]);
				}
				if (0 === data.paths[j].length) {
					col = document.createElement('span');
					row.appendChild(col);
					repl(col, '(self)');
				}
			}
		}
	}

	function fillInsert(root, name)
	{
		var obj;
		if (null === (obj = auditFunctionGet(name)))
			return;
		replcl(root, 'audit-insert-function', name);
		fillShowMore(root, 'insert', name, fillInsert);
	}

	function fillDelete(root, name)
	{
		var obj;
		if (null === (obj = auditFunctionGet(name)))
			return;
		replcl(root, 'audit-delete-function', name);
		if (null !== obj.doc) {
			replcl(root, 'audit-delete-doc', obj.doc);
			showcl(root, 'audit-delete-doc');
			hidecl(root, 'audit-delete-nodoc');
		} else {
			hidecl(root, 'audit-delete-doc');
			showcl(root, 'audit-delete-nodoc');
		}
		fillShowMore(root, 'delete', name, fillDelete);
	}

	function fillSearch(root, name)
	{
		var obj;
		if (null === (obj = auditFunctionGet(name)))
			return;
		replcl(root, 'audit-search-function', name);
		if (null !== obj.doc) {
			replcl(root, 'audit-search-doc', obj.doc);
			showcl(root, 'audit-search-doc');
			hidecl(root, 'audit-search-nodoc');
		} else {
			hidecl(root, 'audit-search-doc');
			showcl(root, 'audit-search-nodoc');
		}
		fillShowMore(root, 'search', name, fillSearch);
	}

	function fillList(root, name)
	{
		var obj;
		if (null === (obj = auditFunctionGet(name)))
			return;
		replcl(root, 'audit-list-function', name);
		if (null !== obj.doc) {
			replcl(root, 'audit-list-doc', obj.doc);
			showcl(root, 'audit-list-doc');
			hidecl(root, 'audit-list-nodoc');
		} else {
			hidecl(root, 'audit-list-doc');
			showcl(root, 'audit-list-nodoc');
		}
		fillShowMore(root, 'list', name, fillList);
	}

	function fillIterate(root, name)
	{
		var obj;
		if (null === (obj = auditFunctionGet(name)))
			return;
		replcl(root, 'audit-iterate-function', name);
		if (null !== obj.doc) {
			replcl(root, 'audit-iterate-doc', obj.doc);
			showcl(root, 'audit-iterate-doc');
			hidecl(root, 'audit-iterate-nodoc');
		} else {
			hidecl(root, 'audit-iterate-doc');
			showcl(root, 'audit-iterate-nodoc');
		}
		fillShowMore(root, 'iterate', name, fillIterate);
	}

	function fill(root, vec, name, func)
	{
		var list, i, j, sub, clone;

		vec.sort(function(a, b) {
			return(a.localeCompare(b));
		});

		if (vec.length > 0) {
			hidecl(root, 'audit-no' + name);
			showcl(root, 'audit-' + name + '-list');
			list = root.getElementsByClassName
				('audit-' + name + '-list');
			for (i = 0; i < list.length; i++) {
				sub = list[i].children[0];
				clr(list[i]);
				for (j = 0; j < vec.length; j++) {
					clone = sub.cloneNode(true);
					list[i].appendChild(clone);
					func(clone, vec[j]);
				}
			}
		} else {
			hidecl(root, 'audit-' + name + '-list');
			showcl(root, 'audit-no' + name);
		}
	}

	function fillVec(vec, name, func)
	{
		var e, sub, i, clone, list;

		vec.sort(function(a, b) {
			return(a.localeCompare(b));
		});

		list = document.getElementsByClassName
			('audit-function-' + name + '-count');
		for (i = 0; i < list.length; i++)
			repl(list[i], vec.length);

		e = find('audit-' + name + '-list');
		sub = e.children[0];
		clr(e);
		for (i = 0; i < vec.length; i++) {
			clone = sub.cloneNode(true);
			e.appendChild(clone);
			func(clone, vec[i]);
		}

		e = find('audit-byoperation-' + name);

		if (0 === vec.length) {
			if (null !== e &&
			    ! e.classList.contains('noop'))
				e.classList.add('noop');
			hide('audit-' + name + '-list');
			show('audit-no' + name);
		} else {
			if (null !== e)
				e.classList.remove('noop');
			show('audit-' + name + '-list');
			hide('audit-no' + name);
		}
	}

	function auditFill(audit, root, num)
	{
		var e, sub, i, j, clone, list, vec, 
			nvec, obj, noexport, pct, ins;

		replcl(root, 'audit-name', audit.name);
		attrcl(root, 'audit-label', 'for', audit.name);
		attrcl(root, 'audit-view', 'id', audit.name);
		attrcl(root, 'audit-view', 'checked', false);
		attrcl(root, 'audit-view', 'value', num);

		pct = ins = 0;

		/* If found, fill in data field and access members. */

		if ('data' in audit.access) {
			hidecl(root, 'audit-nodata');
			showcl(root, 'audit-data');
			showcl(root, 'audit-accessfrom');

			audit.access.data.sort(function(a, b) {
				return(a.field.localeCompare(b.field));
			});
			audit.access.accessfrom.sort(function(a, b) {
				return(a.function.localeCompare(b.function));
			});

			vec = audit.access.data;
			list = root.getElementsByClassName
				('audit-data-list');

			for (noexport = j = 0; j < vec.length; j++) 
				noexport += vec[j].export ? 0 : 1;

			for (i = 0; i < list.length; i++) {
				sub = list[i].children[0];
				clr(list[i]);
				for (j = 0; j < vec.length; j++) {
					clone = sub.cloneNode(true);
					list[i].appendChild(clone);
					auditDataFill(vec[j], clone);
				}
			}

			pct = Math.round((1.0 - 
				(noexport / vec.length)) * 100);
			vec = audit.access.accessfrom;
			nvec = [];
			for (i = 0; i < vec.length; ) {
				obj = {};
				obj.function = vec[i].function;
				obj.paths = [];
				obj.paths.push(vec[i].path);
				for (j = i + 1; j < vec.length; j++) {
					if (vec[j].function !== vec[i].function)
						break;
					obj.paths.push(vec[j].path);
				}
				nvec.push(obj);
				i = j;
			}

			list = root.getElementsByClassName
				('audit-accessfrom-list');
			for (i = 0; i < list.length; i++) {
				sub = list[i].children[0];
				clr(list[i]);
				for (j = 0; j < nvec.length; j++) {
					clone = sub.cloneNode(true);
					list[i].appendChild(clone);
					auditAccessfromFill(nvec[j], clone);
				}
			}
		} else {
			hidecl(root, 'audit-data');
			hidecl(root, 'audit-accessfrom');
			showcl(root, 'audit-nodata');
		}

		/* Fill insert function (if applicable). */

		if (null !== audit.access.insert) {
			showcl(root, 'audit-insert');
			hidecl(root, 'audit-noinsert');
			fillInsert(root, audit.access.insert);
			ins = 1;
		} else {
			hidecl(root, 'audit-insert');
			showcl(root, 'audit-noinsert');
		}
		
		replcl(root, 'audit-data-count', pct + '%');
		replcl(root, 'audit-queries-count', 
			audit.access.searches.length +
			audit.access.lists.length +
			audit.access.iterates.length);
		replcl(root, 'audit-updates-count', 
			audit.access.updates.length);
		replcl(root, 'audit-deletes-count', 
			audit.access.deletes.length);
		replcl(root, 'audit-inserts-count', ins);

		if (0 === pct + ins + 
		    audit.access.deletes.length +
		    audit.access.updates.length +
		    audit.access.searches.length +
		    audit.access.lists.length +
		    audit.access.iterates.length) {
			if ( ! root.classList.contains('noop'))
				root.classList.add('noop');
		} else
			root.classList.remove('noop');

		/* Fill other functions. */

		fill(root, audit.access.searches, 'searches', fillSearch);
		fill(root, audit.access.iterates, 'iterates', fillIterate);
		fill(root, audit.access.lists, 'lists', fillList);
		fill(root, audit.access.updates, 'updates', fillUpdate);
		fill(root, audit.access.deletes, 'deletes', fillDelete);
	}

	function init() 
	{
		var e, sub, i, j, clone, vec, list, ac;

		if (null === audit) {
			show('parseerr');
			return;
		}

		ac = audit.access;
		
		/* Initialise page view for consistency. */

		if (null !== (e = find('aside-close')))
			e.onclick = function() {
				hide('aside');
			};

		repl('audit-role', audit.role);
		list = document.getElementsByClassName
			('audit-toplevel-view');
		for (i = 0; i < list.length; i++)
			list[i].checked = true;

		/* Start with per-structure audit. */

		ac.sort(function(a, b) {
			return(a.name.localeCompare(b.name));
		});

		e = find('audit-access-list');
		sub = e.children[0];
		clr(e);
		for (i = 0; i < ac.length; i++) {
			clone = sub.cloneNode(true);
			e.appendChild(clone);
			auditFill(ac[i], clone, i + 1);
		}

		/* Now fill for collected operations. */

		for (vec = [], i = 0; i < ac.length; i++)
			if (null !== ac[i].access.insert)
				vec.push(ac[i].access.insert);
		fillVec(vec, 'inserts', fillInsert);

		for (vec = [], i = 0; i < ac.length; i++)
			for (j = 0; j < ac[i].access.deletes.length; j++)
				vec.push(ac[i].access.deletes[j]);
		fillVec(vec, 'deletes', fillDelete);

		for (vec = [], i = 0; i < ac.length; i++)
			for (j = 0; j < ac[i].access.updates.length; j++)
				vec.push(ac[i].access.updates[j]);
		fillVec(vec, 'updates', fillUpdate);

		for (vec = [], i = 0; i < ac.length; i++)
			for (j = 0; j < ac[i].access.searches.length; j++)
				vec.push(ac[i].access.searches[j]);
		fillVec(vec, 'searches', fillSearch);

		for (vec = [], i = 0; i < ac.length; i++)
			for (j = 0; j < ac[i].access.iterates.length; j++)
				vec.push(ac[i].access.iterates[j]);
		fillVec(vec, 'iterates', fillIterate);

		for (vec = [], i = 0; i < ac.length; i++)
			for (j = 0; j < ac[i].access.lists.length; j++)
				vec.push(ac[i].access.lists[j]);
		fillVec(vec, 'lists', fillList);

		show('parsed');
		hide('parsing');
	}

	root.init = init;
})(this);

window.addEventListener('load', init);