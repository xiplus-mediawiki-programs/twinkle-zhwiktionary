// <nowiki>

(function($) {


/*
 ****************************************
 *** friendlytag.js: Tag module
 ****************************************
 * Mode of invocation:     Tab ("Tag")
 * Active on:              Existing articles;
 *                         all redirects
 * Config directives in:   FriendlyConfig
 */

Twinkle.tag = function friendlytag() {
	// redirect tagging
	if (Morebits.wiki.isPageRedirect()) {
		// Twinkle.tag.modeOriginal = 'redirect';
		// Twinkle.tag.mode = '重定向';
		// Twinkle.addPortletLink(Twinkle.tag.callback, wgULS('标记', '標記'), 'friendly-tag', wgULS('标记重定向', '標記重定向'));
	// file tagging
	} else if (mw.config.get('wgNamespaceNumber') === 6 && !document.getElementById('mw-sharedupload') && document.getElementById('mw-imagepage-section-filehistory')) {
		// Twinkle.tag.modeOriginal = 'file';
		// Twinkle.tag.mode = wgULS('文件', '檔案');
		// Twinkle.addPortletLink(Twinkle.tag.callback, wgULS('标记', '標記'), 'friendly-tag', wgULS('标记文件', '標記檔案'));
	// article/draft tagging
	} else if ((mw.config.get('wgNamespaceNumber') === 0 && mw.config.get('wgCurRevisionId')) || (Morebits.pageNameNorm === Twinkle.getPref('sandboxPage'))) {
		Twinkle.tag.modeOriginal = 'article';
		Twinkle.tag.mode = wgULS('词条', '詞條');
		// Can't remove tags when not viewing current version
		Twinkle.tag.canRemove = (mw.config.get('wgCurRevisionId') === mw.config.get('wgRevisionId')) &&
			// Disabled on latest diff because the diff slider could be used to slide
			// away from the latest diff without causing the script to reload
			!mw.config.get('wgDiffNewId');
		Twinkle.addPortletLink(Twinkle.tag.callback, wgULS('标记', '標記'), 'friendly-tag', wgULS('标记词条', '標記詞條'));
	}
};

Twinkle.tag.checkedTags = [];

Twinkle.tag.callback = function friendlytagCallback() {
	var Window = new Morebits.simpleWindow(630, Twinkle.tag.mode === '词条' || Twinkle.tag.mode === '詞條' ? 500 : 400);
	Window.setScriptName('Twinkle');
	// anyone got a good policy/guideline/info page/instructional page link??
	Window.addFooterLink(wgULS('Twinkle帮助', 'Twinkle說明'), 'WP:TW/DOC#tag');

	var form = new Morebits.quickForm(Twinkle.tag.callback.evaluate);

	if (document.getElementsByClassName('patrollink').length) {
		form.append({
			type: 'checkbox',
			list: [
				{
					label: wgULS('标记页面为已巡查', '標記頁面為已巡查'),
					value: 'patrolPage',
					name: 'patrolPage',
					checked: Twinkle.getFriendlyPref('markTaggedPagesAsPatrolled')
				}
			]
		});
	}

	switch (Twinkle.tag.mode) {
		case '詞條':
		case '词条':
			Window.setTitle(wgULS('词条维护标记', '詞條維護標記'));

			form.append({
				type: 'select',
				name: 'sortorder',
				label: wgULS('查看列表：', '檢視列表：'),
				tooltip: wgULS('您可以在Twinkle参数设置（WP:TWPREFS）中更改此项。', '您可以在Twinkle偏好設定（WP:TWPREFS）中更改此項。'),
				event: Twinkle.tag.updateSortOrder,
				list: [
					{ type: 'option', value: 'cat', label: wgULS('按类别', '按類別'), selected: Twinkle.getFriendlyPref('tagArticleSortOrder') === 'cat' },
					{ type: 'option', value: 'alpha', label: '按字母', selected: Twinkle.getFriendlyPref('tagArticleSortOrder') === 'alpha' }
				]
			});

			Twinkle.tag.quickFilter(form);

			if (!Twinkle.tag.canRemove) {
				var divElement = document.createElement('div');
				divElement.innerHTML = wgULS('要移除现有维护标记，请从当前词条版本中打开“标记”菜单', '要移除現有維護標記，請從目前詞條版本中打開「標記」選單');
				form.append({
					type: 'div',
					name: 'untagnotice',
					label: divElement
				});
			}

			form.append({
				type: 'div',
				id: 'tagWorkArea',
				className: 'morebits-scrollbox',
				style: 'max-height: 22em'
			});

			form.append({
				type: 'textarea',
				name: 'tagReason',
				label: wgULS('维护标记理由（编辑摘要）：', '維護標記理由（編輯摘要）：'),
				tooltip: wgULS('说明加入这些维护模板的原因，指出词条内容的哪些部分有问题，如果理由很长则应该发表在讨论页。',
					'說明加入這些維護模板的原因，指出詞條內容的哪些部分有問題，如果理由很長則應該發表在討論頁。')
			});

			break;

		case '重定向':
			Window.setTitle(wgULS('重定向标记', '重定向標記'));

			Twinkle.tag.quickFilter(form);

			form.append({ type: 'header', label: '常用模板' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.frequentList });

			form.append({ type: 'header', label: '偶用模板' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.lessFrequentList });

			form.append({ type: 'header', label: wgULS('鲜用模板', '鮮用模板') });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.rareList });
			break;

		case '文件':
		case '檔案':
			Window.setTitle(wgULS('文件维护标记', '檔案維護標記'));

			Twinkle.tag.quickFilter(form);

			// TODO: perhaps add custom tags TO list of checkboxes

			form.append({ type: 'header', label: wgULS('版权和来源问题标签', '版權和來源問題標籤') });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.licenseList });

			form.append({ type: 'header', label: wgULS('维基共享资源相关标签', '維基共享資源相關標籤') });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.commonsList });

			form.append({ type: 'header', label: wgULS('清理标签', '清理標籤') });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.cleanupList });

			form.append({ type: 'header', label: wgULS('档案取代标签', '檔案取代標籤') });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.replacementList });
			break;

		default:
			alert('Twinkle.tag：未知模式 ' + Twinkle.tag.mode);
			break;
	}

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// for quick filter:
	$allCheckboxDivs = $(result).find('[name$=Tags]').parent();
	$allHeaders = $(result).find('h5');
	result.quickfilter.focus();  // place cursor in the quick filter field as soon as window is opened
	result.quickfilter.autocomplete = 'off'; // disable browser suggestions
	result.quickfilter.addEventListener('keypress', function(e) {
		if (e.keyCode === 13) { // prevent enter key from accidentally submitting the form
			e.preventDefault();
			return false;
		}
	});

	if (Twinkle.tag.mode === '词条' || Twinkle.tag.mode === '詞條') {

		Twinkle.tag.alreadyPresentTags = [];

		if (Twinkle.tag.canRemove) {
			// Look for existing maintenance tags in the lead section and put them in array

			// All tags are HTML table elements that are direct children of .mw-parser-output,
			// except when they are within {{multiple issues}}
			$('.mw-parser-output').children().each(function parsehtml(i, e) {

				// break out on encountering the first heading, which means we are no
				// longer in the lead section
				if (e.tagName === 'H2') {
					return false;
				}

				// The ability to remove tags depends on the template's {{ambox}} |name=
				// parameter bearing the template's correct name (preferably) or a name that at
				// least redirects to the actual name

				// All tags have their first class name as "box-" + template name
				if (e.className.indexOf('box-') === 0) {
					if (e.classList[0] === 'box-问题词条') {
						$(e).find('.ambox').each(function(idx, e) {
							var tag = e.classList[0].slice(4).replace(/_/g, ' ');
							Twinkle.tag.alreadyPresentTags.push(tag);
						});
						return true; // continue
					}

					var tag = e.classList[0].slice(4).replace(/_/g, ' ');
					Twinkle.tag.alreadyPresentTags.push(tag);
				}
			});

			// {{Uncategorized}} and {{Improve categories}} are usually placed at the end
			if ($('.box-Uncategorized').length) {
				Twinkle.tag.alreadyPresentTags.push('Uncategorized');
			}
			if ($('.box-Improve_categories').length) {
				Twinkle.tag.alreadyPresentTags.push('Improve categories');
			}

		}

		// Add status text node after Submit button
		var statusNode = document.createElement('small');
		statusNode.id = 'tw-tag-status';
		Twinkle.tag.status = {
			// initial state; defined like this because these need to be available for reference
			// in the click event handler
			numAdded: 0,
			numRemoved: 0
		};
		$(Window.buttons[0]).after(statusNode);

		// fake a change event on the sort dropdown, to initialize the tag list
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.sortorder.dispatchEvent(evt);

	} else {
		// Redirects and files: Add a link to each template's description page
		Morebits.quickForm.getElements(result, Twinkle.tag.mode + 'Tags').forEach(generateLinks);
	}
};

// $allCheckboxDivs and $allHeaders are defined globally, rather than in
// the event function, to avoid having to recompute them on every keydown.
var $allCheckboxDivs, $allHeaders;

Twinkle.tag.quickFilter = function(form) {

	form.append({
		type: 'input',
		label: wgULS('快速筛选：', '快速篩選：'),
		name: 'quickfilter',
		size: '30px',
		event: function twinkletagquickfilter() {
			// flush the DOM of all existing underline spans
			$allCheckboxDivs.find('.search-hit').each(function(i, e) {
				var label_element = e.parentElement;
				// This would convert <label>Hello <span class=search-hit>wo</span>rld</label>
				// to <label>Hello world</label>
				label_element.innerHTML = label_element.textContent;
			});

			if (this.value) {
				$allCheckboxDivs.hide();
				$allHeaders.hide();
				var searchString = this.value;
				var searchRegex = new RegExp(mw.util.escapeRegExp(searchString), 'i');

				$allCheckboxDivs.find('label').each(function () {
					var label_text = this.textContent;
					var searchHit = searchRegex.exec(label_text);
					if (searchHit) {
						var range = document.createRange();
						var textnode = this.childNodes[0];
						range.selectNodeContents(textnode);
						range.setStart(textnode, searchHit.index);
						range.setEnd(textnode, searchHit.index + searchString.length);
						var underline_span = $('<span>').addClass('search-hit').css('text-decoration', 'underline')[0];
						range.surroundContents(underline_span);
						this.parentElement.style.display = 'block'; // show
					}
				});
			} else {
				$allCheckboxDivs.show();
				$allHeaders.show();
			}
		}
	});

};

Twinkle.tag.updateSortOrder = function(e) {
	var form = e.target.form;
	var sortorder = e.target.value;
	Twinkle.tag.checkedTags = form.getChecked('articleTags') || [];

	var container = new Morebits.quickForm.element({ type: 'fragment' });

	// function to generate a checkbox, with appropriate subgroup if needed
	var makeCheckbox = function(tag, description) {
		var checkbox = { value: tag, label: '{{' + tag + '}}: ' + description };
		if (Twinkle.tag.checkedTags.indexOf(tag) !== -1) {
			checkbox.checked = true;
		}
		switch (tag) {
			case 'History merge':
				checkbox.subgroup = [
					{
						name: 'histmergeOriginalPage',
						type: 'input',
						label: wgULS('来源页面名称（必填）：', '來源頁面名稱（必填）：')
					},
					{
						name: 'histmergeReason',
						type: 'input',
						label: wgULS('合并理由：', '合併理由：')
					},
					{
						name: 'histmergeSysopDetails',
						type: 'input',
						label: wgULS('附加讯息：', '附加訊息：')
					}
				];
				break;
			default:
				break;
		}
		return checkbox;
	};

	var makeCheckboxesForAlreadyPresentTags = function() {
		container.append({ type: 'header', id: 'tagHeader0', label: wgULS('已放置的维护标记', '已放置的維護標記') });
		var subdiv = container.append({ type: 'div', id: 'tagSubdiv0' });
		var checkboxes = [];
		var unCheckedTags = e.target.form.getUnchecked('alreadyPresentArticleTags') || [];
		Twinkle.tag.alreadyPresentTags.forEach(function(tag) {
			var description = Twinkle.tag.article.tags[tag];
			var checkbox =
				{
					value: tag,
					label: '{{' + tag + '}}' + (description ? ': ' + description : ''),
					checked: unCheckedTags.indexOf(tag) === -1
					// , subgroup: { type: 'input', name: 'removeReason', label: 'Reason', tooltip: 'Enter reason for removing this tag' }
					// TODO: add option for providing reason for removal
				};

			checkboxes.push(checkbox);
		});
		subdiv.append({
			type: 'checkbox',
			name: 'alreadyPresentArticleTags',
			list: checkboxes
		});
	};

	// categorical sort order
	if (sortorder === 'cat') {
		// function to iterate through the tags and create a checkbox for each one
		var doCategoryCheckboxes = function(subdiv, array) {
			var checkboxes = [];
			$.each(array, function(k, tag) {
				var description = Twinkle.tag.article.tags[tag];
				if (Twinkle.tag.alreadyPresentTags.indexOf(tag) === -1) {
					checkboxes.push(makeCheckbox(tag, description));
				}
			});
			subdiv.append({
				type: 'checkbox',
				name: 'articleTags',
				list: checkboxes
			});
		};

		if (Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
		}
		var i = 1;
		// go through each category and sub-category and append lists of checkboxes
		$.each(Twinkle.tag.article.tagCategories, function(title, content) {
			container.append({ type: 'header', id: 'tagHeader' + i, label: title });
			var subdiv = container.append({ type: 'div', id: 'tagSubdiv' + i++ });
			if ($.isArray(content)) {
				doCategoryCheckboxes(subdiv, content);
			} else {
				$.each(content, function(subtitle, subcontent) {
					subdiv.append({ type: 'div', label: [ Morebits.htmlNode('b', subtitle) ] });
					doCategoryCheckboxes(subdiv, subcontent);
				});
			}
		});
	} else { // alphabetical sort order
		if (Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
			container.append({ type: 'header', id: 'tagHeader1', label: wgULS('可用的维护标记', '可用的維護標記') });
		}
		var checkboxes = [];
		$.each(Twinkle.tag.article.tags, function(tag, description) {
			if (Twinkle.tag.alreadyPresentTags.indexOf(tag) === -1) {
				checkboxes.push(makeCheckbox(tag, description));
			}
		});
		container.append({
			type: 'checkbox',
			name: 'articleTags',
			list: checkboxes
		});
	}

	// append any custom tags
	if (Twinkle.getFriendlyPref('customTagList').length) {
		container.append({ type: 'header', label: wgULS('自定义模板', '自訂模板') });
		var customcheckboxes = [];
		$.each(Twinkle.getFriendlyPref('customTagList'), function(_, item) {
			customcheckboxes.push(makeCheckbox(item.value, item.label));
		});
		container.append({
			type: 'checkbox',
			name: 'articleTags',
			list: customcheckboxes
		});
	}

	var $workarea = $(form).find('#tagWorkArea');
	var rendered = container.render();
	$workarea.empty().append(rendered);

	// for quick filter:
	$allCheckboxDivs = $workarea.find('[name$=Tags]').parent();
	$allHeaders = $workarea.find('h5, .quickformDescription');
	form.quickfilter.value = ''; // clear search, because the search results are not preserved over mode change
	form.quickfilter.focus();

	// style adjustments
	$workarea.find('h5').css({ 'font-size': '110%' });
	$workarea.find('h5:not(:first-child)').css({ 'margin-top': '1em' });
	$workarea.find('div').filter(':has(span.quickformDescription)').css({ 'margin-top': '0.4em' });

	var articleTags = Morebits.quickForm.getElements(form, 'articleTags');
	if (articleTags) {
		articleTags.forEach(generateLinks);
	}
	var alreadyPresentTags = Morebits.quickForm.getElements(form, 'alreadyPresentArticleTags');
	if (alreadyPresentTags) {
		alreadyPresentTags.forEach(generateLinks);
	}

	// tally tags added/removed, update statusNode text
	var statusNode = document.getElementById('tw-tag-status');
	$('[name=articleTags], [name=alreadyPresentArticleTags]').click(function() {
		if (this.name === 'articleTags') {
			Twinkle.tag.status.numAdded += this.checked ? 1 : -1;
		} else if (this.name === 'alreadyPresentArticleTags') {
			Twinkle.tag.status.numRemoved += this.checked ? -1 : 1;
		}

		var firstPart = '加入' + Twinkle.tag.status.numAdded + wgULS('个标记', '個標記');
		var secondPart = '移除' + Twinkle.tag.status.numRemoved + wgULS('个标记', '個標記');
		statusNode.textContent =
			(Twinkle.tag.status.numAdded ? '  ' + firstPart : '') +
			(Twinkle.tag.status.numRemoved ? (Twinkle.tag.status.numAdded ? '；' : '  ') + secondPart : '');
	});
};

/**
 * Adds a link to each template's description page
 * @param {Morebits.quickForm.element} checkbox  associated with the template
 */
var generateLinks = function(checkbox) {
	var link = Morebits.htmlNode('a', '>');
	link.setAttribute('class', 'tag-template-link');
	var tagname = checkbox.values;
	link.setAttribute('href', mw.util.getUrl(
		(tagname.indexOf(':') === -1 ? 'Template:' : '') +
		(tagname.indexOf('|') === -1 ? tagname : tagname.slice(0, tagname.indexOf('|')))
	));
	link.setAttribute('target', '_blank');
	$(checkbox).parent().append(['\u00A0', link]);
};


// Tags for ARTICLES start here

Twinkle.tag.article = {};

// A list of all article tags, in alphabetical order
// To ensure tags appear in the default "categorized" view, add them to the tagCategories hash below.

Twinkle.tag.article.tags = wgULS({
	'History merge': '建议将其他页面的历史并入本页'
}, {
	'History merge': '建議將其他頁面的歷史併入本頁'
});

// A list of tags in order of category
// Tags should be in alphabetical order within the categories
// Add new categories with discretion - the list is long enough as is!

Twinkle.tag.article.tagCategories = wgULS({
	'合并': [  // these three have a subgroup with several options
		'History merge'
	]
}, {
	'合併': [  // these three have a subgroup with several options
		'History merge'
	]
});

// Tags for REDIRECTS start here

Twinkle.tag.frequentList = wgULS([
], [
]);

Twinkle.tag.lessFrequentList = wgULS([
], [
]);

Twinkle.tag.rareList = wgULS([
], [
]);

// maintenance tags for FILES start here

Twinkle.tag.file = {};

Twinkle.tag.file.licenseList = wgULS([
], [
]);

Twinkle.tag.file.commonsList = wgULS([
], [
]);

Twinkle.tag.file.cleanupList = wgULS([
], [
]);

Twinkle.tag.file.replacementList = wgULS([
], [
]);


Twinkle.tag.callbacks = {
	main: function(pageobj) {

		// Remove tags that become superfluous with this action
		var pageText = pageobj.getPageText().replace(/\{\{\s*([Nn]ew unreviewed article|[Uu]nreviewed|[Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
		var summaryText;
		var params = pageobj.getCallbackParameters();

		/**
		 * Saves the page following the removal of tags if any. The last step.
		 * Called from removeTags()
		 */
		var postRemoval = function() {

			if (params.tagsToRemove.length) {
				// Finish summary text
				summaryText += wgULS('标记', '標記');
			}

			var tagReason = params.tagReason || '';
			tagReason = tagReason.trim();
			if (tagReason !== '') {
				if (tagReason.search(/[.?!;，。？！；]$/) === -1) {
					tagReason += '。';
				}
				summaryText = tagReason + summaryText;
			}

			// avoid truncated summaries
			if (summaryText.length > (254 - Twinkle.getPref('summaryAd').length)) {
				summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
			}

			pageobj.setPageText(pageText);
			pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
			pageobj.setTags(Twinkle.getPref('revisionTags'));
			pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
			pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save(function() {
				// special functions for merge tags
				if (params.mergeReason) {
					// post the rationale on the talk page (only operates in main namespace)
					var talkpageText = '\n\n== 请求与[[' + params.nonDiscussArticle + ']]合并 ==\n\n';
					talkpageText += params.mergeReason.trim() + '--~~~~';

					var talkpage = new Morebits.wiki.page('Talk:' + params.discussArticle, wgULS('将理由贴进讨论页', '將理由貼進討論頁'));
					talkpage.setAppendText(talkpageText);
					talkpage.setEditSummary(wgULS('请求将[[' + params.nonDiscussArticle + ']]' +
						'与' + '[[' + params.discussArticle + ']]合并', '請求將[[' + params.nonDiscussArticle + ']]' +
						'與' + '[[' + params.discussArticle + ']]合併') +
						Twinkle.getPref('summaryAd'));
					talkpage.setTags(Twinkle.getPref('revisionTags'));
					talkpage.setWatchlist(Twinkle.getFriendlyPref('watchMergeDiscussions'));
					talkpage.setCreateOption('recreate');
					talkpage.append();
				}
				if (params.mergeTagOther) {
					// tag the target page if requested
					var otherTagName = 'Merge';
					if (tags.indexOf('Merge from') !== -1) {
						otherTagName = 'Merge to';
					} else if (tags.indexOf('Merge to') !== -1) {
						otherTagName = 'Merge from';
					}
					var newParams = {
						tags: [otherTagName],
						tagsToRemove: [],
						tagsToRemain: [],
						mergeTarget: Morebits.pageNameNorm,
						discussArticle: params.discussArticle,
						talkDiscussionTitle: params.talkDiscussionTitle
					};
					var otherpage = new Morebits.wiki.page(params.mergeTarget, wgULS('标记其他页面（', '標記其他頁面（') +
						params.mergeTarget + '）');
					otherpage.setCallbackParameters(newParams);
					otherpage.load(Twinkle.tag.callbacks.main);
				}
				// special functions for requested move tags
				if (params.moveReason) {
					// post the rationale on the talk page (only operates in main namespace)
					var moveTalkpageText = '\n\n{{subst:RM|' + params.moveReason.trim(); // eslint-disable-line no-redeclare
					if (params.moveTarget) {
						moveTalkpageText += '|' + params.moveTarget;
					}
					moveTalkpageText += '}}';

					var moveTalkpage = new Morebits.wiki.page('Talk:' + params.discussArticle, wgULS('将理由贴进讨论页', '將理由貼進討論頁')); // eslint-disable-line no-redeclare
					moveTalkpage.setAppendText(moveTalkpageText);
					moveTalkpage.setEditSummary(wgULS('请求移动' + (params.moveTarget ? '至[[' + params.moveTarget + ']]' : ''), '請求移動' + (params.moveTarget ? '至[[' + params.moveTarget + ']]' : '')) +
						Twinkle.getPref('summaryAd'));
					moveTalkpage.setTags(Twinkle.getPref('revisionTags'));
					moveTalkpage.setCreateOption('recreate');
					moveTalkpage.append();
				}
			});

			if (params.patrol) {
				pageobj.patrol();
			}
		};

		/**
		 * Removes the existing tags that were deselected (if any)
		 * Calls postRemoval() when done
		 */
		var removeTags = function removeTags() {

			if (params.tagsToRemove.length === 0) {
				// finish summary text from adding of tags, in this case where there are
				// no tags to be removed
				summaryText += wgULS('标记到词条', '標記到詞條');

				postRemoval();
				return;
			}

			Morebits.status.info(wgULS('信息', '資訊'), wgULS('移除取消选择的已存在标记', '移除取消選擇的已存在標記'));

			if (params.tags.length > 0) {
				summaryText += (tags.length ? wgULS('标记', '標記') : '') + '並移除';
			} else {
				summaryText = wgULS('已從词条移除', '已從詞條移除');
			}

			var getRedirectsFor = [];

			// Remove the tags from the page text, if found in its proper name,
			// otherwise moves it to `getRedirectsFor` array earmarking it for
			// later removal
			params.tagsToRemove.forEach(function removeTag(tag, tagIndex) {
				var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?');

				if (tag_re.test(pageText)) {
					pageText = pageText.replace(tag_re, '');
				} else {
					getRedirectsFor.push('Template:' + tag);
				}

				// Producing summary text for current tag removal
				if (tagIndex > 0) {
					if (tagIndex === (params.tagsToRemove.length - 1)) {
						summaryText += '和';
					} else if (tagIndex < (params.tagsToRemove.length - 1)) {
						summaryText += '、';
					}
				}
				summaryText += '{{[[Template:' + tag + '|' + tag + ']]}}';
			});

			if (!getRedirectsFor.length) {
				postRemoval();
				return;
			}

			// Remove tags which appear in page text as redirects
			var api = new Morebits.wiki.api(wgULS('获取模板重定向', '取得模板重定向'), {
				'action': 'query',
				'prop': 'linkshere',
				'titles': getRedirectsFor.join('|'),
				'redirects': 1,  // follow redirect if the class name turns out to be a redirect page
				'lhnamespace': '10',  // template namespace only
				'lhshow': 'redirect',
				'lhlimit': 'max'
			}, function removeRedirectTag(apiobj) {

				$(apiobj.responseXML).find('page').each(function(idx, page) {
					var removed = false;
					$(page).find('lh').each(function(idx, el) {
						var tag = $(el).attr('title').slice(9);
						var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?');
						if (tag_re.test(pageText)) {
							pageText = pageText.replace(tag_re, '');
							removed = true;
							return false;   // break out of $.each
						}
					});
					if (!removed) {
						Morebits.status.warn(wgULS('信息', '資訊'), wgULS('無法在页面上找到{{' + $(page).attr('title').slice(9) +
							'}}…跳过', '無法在頁面上找到{{' + $(page).attr('title').slice(9) +
							'}}…跳過'));
					}

				});

				postRemoval();

			});
			api.post();

		};

		if (!params.tags.length) {
			removeTags();
			return;
		}

		// Executes first: addition of selected tags
		summaryText = wgULS('添加', '加入');
		var tagRe, tagText = '', tags = [], groupableTags = [], totalTags;

		/**
		 * Updates `tagText` with the syntax of `tagName` template with its parameters
		 * @param {number} tagIndex
		 * @param {string} tagName
		 */
		var addTag = function articleAddTag(tagIndex, tagName) {
			var currentTag = '';
			if (tagName === 'Uncategorized' || tagName === 'Improve categories') {
				pageText += '\n\n{{' + tagName + '|time={{subst:#time:c}}}}';
			} else {
				currentTag += '{{' + tagName;
				// fill in other parameters, based on the tag
				switch (tagName) {
					case 'History merge':
						currentTag += '|1=' + params.histmergeOriginalPage;
						if (params.histmergeReason) {
							currentTag += '|reason=' + params.histmergeReason;
						}
						if (params.histmergeSysopDetails) {
							currentTag += '|details=' + params.histmergeSysopDetails;
						}
						break;
					default:
						break;
				}

				currentTag += '|time={{subst:#time:c}}}}\n';
				tagText += currentTag;
			}

			if (tagIndex > 0) {
				if (tagIndex === (totalTags - 1)) {
					summaryText += '和';
				} else if (tagIndex < (totalTags - 1)) {
					summaryText += '、';
				}
			}

			summaryText += '{{[[';
			// if it is a custom tag with a parameter
			if (tagName.indexOf('|') !== -1) {
				tagName = tagName.slice(0, tagName.indexOf('|'));
			}
			summaryText += tagName.indexOf(':') !== -1 ? tagName : 'Template:' + tagName + '|' + tagName;
			summaryText += ']]}}';

		};

		/**
		 * Adds the tags which go outside {{multiple issues}}, either because
		 * these tags aren't supported in {{multiple issues}} or because
		 * {{multiple issues}} is not being added to the page at all
		 */
		var addUngroupedTags = function() {
			totalTags = tags.length;
			$.each(tags, addTag);

			// Smartly insert the new tags after any hatnotes or
			// afd, csd, or prod templates or hatnotes. Regex is
			// extra complicated to allow for templates with
			// parameters and to handle whitespace properly.
			pageText = pageText.replace(/^\s*(?:((?:\s*\{\{\s*(?:about|correct title|dablink|distinguish|for|other\s?(?:hurricaneuses|people|persons|places|uses(?:of)?)|redirect(?:-acronym)?|see\s?(?:also|wiktionary)|selfref|the)\d*\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\})+(?:\s*\n)?)\s*)?/i,
				'$1' + tagText);

			removeTags();
		};

		// Separate tags into groupable ones (`groupableTags`) and non-groupable ones (`tags`)
		params.tags.forEach(function(tag) {
			tagRe = new RegExp('\\{\\{' + tag + '(\\||\\}\\})', 'im');
			// regex check for preexistence of tag can be skipped if in canRemove mode
			if (Twinkle.tag.canRemove || !tagRe.exec(pageText)) {
				tags.push(tag);
			} else {
				if (tag === 'History merge') {
					tags.push(tag);
				} else {
					Morebits.status.warn(wgULS('信息', '資訊'), wgULS('在页面上找到{{' + tag +
						'}}…跳过', '在頁面上找到{{' + tag +
						'}}…跳過'));
					// don't do anything else with merge tags
					if (['Merge', 'Merge to'].indexOf(tag) !== -1) {
						params.mergeTarget = params.mergeReason = params.mergeTagOther = null;
					}
				}
			}
		});

		tags = tags.concat(groupableTags);
		addUngroupedTags();

	},

	redirect: function redirect(pageobj) {
		var params = pageobj.getCallbackParameters(),
			pageText = pageobj.getPageText(),
			tagRe, tagText = '', summaryText = wgULS('添加', '加入'),
			tags = [], i;

		for (i = 0; i < params.tags.length; i++) {
			tagRe = new RegExp('(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im');
			if (!tagRe.exec(pageText)) {
				tags.push(params.tags[i]);
			} else {
				Morebits.status.warn(wgULS('信息', '資訊'), wgULS('在重定向上找到{{' + params.tags[i] +
					'}}…跳过', '在重定向上找到{{' + params.tags[i] +
					'}}…跳過'));
			}
		}

		var addTag = function redirectAddTag(tagIndex, tagName) {
			tagText += '\n{{' + tagName;
			if (tagName === 'R from alternative language') {
				if (params.altLangFrom) {
					tagText += '|from=' + params.altLangFrom;
				}
				if (params.altLangTo) {
					tagText += '|to=' + params.altLangTo;
				}
			}
			tagText += '}}';

			if (tagIndex > 0) {
				if (tagIndex === (tags.length - 1)) {
					summaryText += '和';
				} else if (tagIndex < (tags.length - 1)) {
					summaryText += '、';
				}
			}

			summaryText += '{{[[:' + (tagName.indexOf(':') !== -1 ? tagName : 'Template:' + tagName + '|' + tagName) + ']]}}';
		};

		tags.sort();
		$.each(tags, addTag);

		// Check for all Rcat shell redirects (from #433)
		if (pageText.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
			// Regex courtesy [[User:Kephir/gadgets/sagittarius.js]] at [[Special:PermaLink/831402893]]
			var oldTags = pageText.match(/(\s*{{[A-Za-z ]+\|)((?:[^|{}]*|{{[^|}]*}})+)(}})\s*/i);
			pageText = pageText.replace(oldTags[0], oldTags[1] + tagText + oldTags[2] + oldTags[3]);
		} else {
			// Fold any pre-existing Rcats into taglist and under Rcatshell
			var pageTags = pageText.match(/\n{{R(?:edirect)? .*?}}/img);
			var oldPageTags = '';
			if (pageTags) {
				pageTags.forEach(function(pageTag) {
					var pageRe = new RegExp(pageTag, 'img');
					pageText = pageText.replace(pageRe, '');
					oldPageTags += pageTag;
				});
			}
			pageText += '\n{{Redirect category shell|' + tagText + oldPageTags + '\n}}';
		}

		summaryText += (tags.length > 0 ? wgULS('标记', '標記') : '') + '到重定向';

		// avoid truncated summaries
		if (summaryText.length > (254 - Twinkle.getPref('summaryAd').length)) {
			summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
		}

		pageobj.setPageText(pageText);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setTags(Twinkle.getPref('revisionTags'));
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.patrol();
		}

	},

	file: function friendlytagCallbacksFile(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var summary = wgULS('添加', '加入');



		// Add maintenance tags
		if (params.tags.length) {

			var tagtext = '', currentTag;
			$.each(params.tags, function(k, tag) {
				// when other commons-related tags are placed, remove "move to Commons" tag
				if (['Keep local', 'subst:ncd', 'Do not move to Commons_reason', 'Do not move to Commons',
					'Now Commons'].indexOf(tag) !== -1) {
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
				}
				if (tag === 'Vector version available') {
					text = text.replace(/\{\{((convert to |convertto|should be |shouldbe|to)?svg|badpng|vectorize)[^}]*\}\}/gi, '');
				}

				currentTag = '{{' + (tag === 'Do not move to Commons_reason' ? 'Do not move to Commons' : tag);

				var input;
				switch (tag) {
					case 'subst:ncd':
						/* falls through */
					case 'Keep local':
						input = prompt('{{' + (tag === 'subst:ncd' ? 'Now Commons' : tag) +
							'}} ─ ' + wgULS('输入在共享资源的图像名称（如果不同于本地名称），不包括 File: 前缀。要跳过标记，请单击取消：', '輸入在共享資源的圖像名稱（如果不同於本地名稱），不包括 File: 字首。要跳過標記，請點擊取消：'), '');
						if (input === null) {
							return true;  // continue
						} else if (input !== '') {
							currentTag += '|1=' + input;
						}
						if (tag === 'Keep local') {
							input = prompt('{{Keep local}} ─ ' + wgULS('输入请求在本地保留文件副本的原因（可选）：', '輸入請求在本地保留檔案副本的原因（可選）：'), '');
							if (input !== null && input !== '') {
								currentTag += '|reason=' + input;
							}
						}
						break;
					case 'Rename media':
						input = prompt('{{Rename media}} ─ ' + wgULS('输入图像的新名称（可选）：', '輸入圖像的新名稱（可選）：'), '');
						if (input === null) {
							return true;  // continue
						} else if (input !== '') {
							currentTag += '|1=' + input;
						}
						input = prompt('{{Rename media}} ─ ' + wgULS('输入重命名的原因（可选）：', '輸入重命名的原因（可選）：'), '');
						if (input === null) {
							return true;  // continue
						} else if (input !== '') {
							currentTag += '|2=' + input;
						}
						break;
					case 'Vector version available':
						/* falls through */
					case 'Obsolete':
						input = prompt('{{' + tag + '}} ─ ' + wgULS('输入替换此文件的文件名称（必填）。 要跳过标记，请单击取消：', '輸入替換此檔案的檔案名稱（必填）。 要跳過標記，請點擊取消：'), '');
						if (input === null) {
							return true;  // continue
						} else if (input !== '') {
							currentTag += '|1=' + input;
						}
						break;
					case 'Do not move to Commons_reason':
						input = prompt('{{Do not move to Commons}} ─ ' + wgULS('输入不应该将该图像移动到维基共享资源的原因（必填）。 要跳过标记，请单击取消：', '輸入不應該將該圖像移動到維基共享資源的原因（必填）。 要跳過標記，請點擊取消：'), '');
						if (input === null) {
							return true;  // continue
						} else if (input !== '') {
							currentTag += '|reason=' + input;
						}
						break;
					case 'Copy to Commons':
						currentTag += '|human=' + mw.config.get('wgUserName');
						break;
					default:
						break;  // don't care
				}

				currentTag += '}}\n';

				tagtext += currentTag;
				summary += '{{' + tag + '}}, ';

				return true;  // continue
			});

			if (!tagtext) {
				pageobj.getStatusElement().warn(wgULS('用户取消操作，没什么要做的', '使用者取消操作，沒什麼要做的'));
				return;
			}

			text = tagtext + text;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summary.substring(0, summary.length - 2) + Twinkle.getPref('summaryAd'));
		pageobj.setTags(Twinkle.getPref('revisionTags'));
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.patrol();
		}
	}
};

Twinkle.tag.callback.evaluate = function friendlytagCallbackEvaluate(e) {
	var form = e.target;
	var params = {};
	if (form.patrolPage) {
		params.patrol = form.patrolPage.checked;
	}

	// Save values of input fields into params object. This works as quickform input
	// fields within subgroups of elements with name 'articleTags' (say) have their
	// name attribute as 'articleTags.' + name of the subgroup element

	var name_prefix = Twinkle.tag.modeOriginal + 'Tags.';
	$(form).find("[name^='" + name_prefix + "']:not(div)").each(function(idx, el) {
		// el are the HTMLInputElements, el.name gives the name attribute
		params[el.name.slice(name_prefix.length)] =
			el.type === 'checkbox' ? form[el.name].checked : form[el.name].value;
	});

	switch (Twinkle.tag.mode) {
		case '詞條':
		case '词条':
			params.tags = form.getChecked('articleTags') || [];
			params.tagsToRemove = form.getUnchecked('alreadyPresentArticleTags') || [];
			params.tagsToRemain = form.getChecked('alreadyPresentArticleTags') || [];

			params.tagReason = form.tagReason.value;

			if (params.tags.indexOf('History merge') !== -1 && params.histmergeOriginalPage.trim() === '') {
				alert(wgULS('您必须指定{{History merge}}的来源页面名称', '您必須指定{{History merge}}的來源頁面名稱'));
				return;
			}
			break;
		case '重定向':
			params.tags = form.getChecked('redirectTags') || [];
			break;
		case '文件':
		case '檔案':
			params.tags = form.getChecked('imageTags') || [];
			break;
		default:
			alert('Twinkle.tag：未知模式 ' + Twinkle.tag.mode);
			break;
	}

	// form validation
	if (params.tags.length === 0 && (['詞條', '词条'].indexOf(Twinkle.tag.mode) === -1 || params.tagsToRemove.length === 0)) {
		alert(wgULS('必须选择至少一个标记！', '必須選擇至少一個標記！'));
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Morebits.wiki.actionCompleted.redirect = Morebits.pageNameNorm;
	Morebits.wiki.actionCompleted.notice = wgULS('标记完成，在几秒内刷新页面', '標記完成，在幾秒內重新整理頁面');
	if (Twinkle.tag.mode === '重定向') {
		Morebits.wiki.actionCompleted.followRedirect = false;
	}

	var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, wgULS('正在标记', '正在標記') + Twinkle.tag.mode);
	wikipedia_page.setCallbackParameters(params);
	switch (Twinkle.tag.mode) {
		case '詞條':
		case '词条':
			wikipedia_page.load(Twinkle.tag.callbacks.main);
			return;
		case '重定向':
			wikipedia_page.load(Twinkle.tag.callbacks.redirect);
			return;
		case '文件':
		case '檔案':
			wikipedia_page.load(Twinkle.tag.callbacks.file);
			return;
		default:
			alert('Twinkle.tag：未知模式 ' + Twinkle.tag.mode);
			break;
	}
};
})(jQuery);


// </nowiki>
