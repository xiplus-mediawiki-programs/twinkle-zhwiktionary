// <nowiki>
// vim: set noet sts=0 sw=8:


(function($) {


/*
 ****************************************
 *** twinklexfd.js: XFD module
 ****************************************
 * Mode of invocation:     Tab ("XFD")
 * Active on:              Existing, non-special pages, except for file pages with no local (non-Commons) file which are not redirects
 */

Twinkle.xfd = function twinklexfd() {
	// Disable on:
	// * special pages
	// * Flow pages
	// * non-existent pages
	// * files on Commons, whether there is a local page or not (unneeded local pages of files on Commons are eligible for CSD F2)
	// * file pages without actual files (these are eligible for CSD G8)
	if (mw.config.get('wgNamespaceNumber') < 0 || mw.config.get('wgPageContentModel') === 'flow-board' || !mw.config.get('wgArticleId') || (mw.config.get('wgNamespaceNumber') === 6 && (document.getElementById('mw-sharedupload') || (!document.getElementById('mw-imagepage-section-filehistory') && !Morebits.wiki.isPageRedirect())))) {
		return;
	}
	Twinkle.addPortletLink(Twinkle.xfd.callback, wgULS('提删', '提刪'), 'tw-xfd', wgULS('提交删除讨论', '提交刪除討論'));
};

Twinkle.xfd.currentRationale = null;

// error callback on Morebits.status.object
Twinkle.xfd.printRationale = function twinklexfdPrintRationale() {
	if (Twinkle.xfd.currentRationale) {
		Morebits.status.printUserText(Twinkle.xfd.currentRationale, wgULS('您的理由已在下方提供，如果您想重新提交，请将其复制到一新窗口中：', '您的理由已在下方提供，如果您想重新提交，請將其複製到一新窗口中：'));
		// only need to print the rationale once
		Twinkle.xfd.currentRationale = null;
	}
};

Twinkle.xfd.callback = function twinklexfdCallback() {
	var Window = new Morebits.simpleWindow(600, 350);
	Window.setTitle(wgULS('提交存废讨论', '提交存廢討論'));
	Window.setScriptName('Twinkle');
	Window.addFooterLink(wgULS('关于存废讨论', '關於存廢討論'), 'Wiktionary:RFD');
	Window.addFooterLink(wgULS('Twinkle帮助', 'Twinkle說明'), 'w:Help:Twinkle#提刪');

	var form = new Morebits.quickForm(Twinkle.xfd.callback.evaluate);
	var categories = form.append({
		type: 'select',
		name: 'category',
		label: wgULS('提交类型：', '提交類別：'),
		event: Twinkle.xfd.callback.change_category
	});
	categories.append({
		type: 'option',
		label: wgULS('页面存废讨论', '頁面存廢討論'),
		selected: mw.config.get('wgNamespaceNumber') === 0,  // Main namespace
		value: 'afd'
	});
	form.append({
		type: 'checkbox',
		list: [
			{
				label: wgULS('如可能，通知页面创建者', '如可能，通知頁面建立者'),
				value: 'notify',
				name: 'notify',
				tooltip: wgULS('在页面创建者对话页上放置一通知模板。', '在頁面建立者對話頁上放置一通知模板。'),
				checked: true
			}
		]
	}
	);
	form.append({
		type: 'field',
		label: '工作区',
		name: 'work_area'
	});
	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the controls
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.category.dispatchEvent(evt);
};

Twinkle.xfd.callback.change_category = function twinklexfdCallbackChangeCategory(e) {
	var value = e.target.value;
	var form = e.target.form;
	var old_area = Morebits.quickForm.getElements(e.target.form, 'work_area')[0];
	var work_area = null;

	var oldreasontextbox = form.getElementsByTagName('textarea')[0];
	var oldreason = oldreasontextbox ? oldreasontextbox.value : '';

	var appendReasonBox = function twinklexfdAppendReasonBox(xfd_cat) {
		switch (xfd_cat) {
			case 'fwdcsd':
				oldreason = decodeURIComponent($('#delete-reason').text()).replace(/\+/g, ' ');
				break;
			case 'fame':
				oldreason = Twinkle.getPref('afdFameDefaultReason');
				break;
			case 'substub':
				oldreason = Twinkle.getPref('afdSubstubDefaultReason');
				break;
			default:
				break;
		}
		work_area.append({
			type: 'textarea',
			name: 'xfdreason',
			label: wgULS('提删理由：', '提刪理由：'),
			value: oldreason,
			tooltip: wgULS('您可以使用维基格式，Twinkle将自动为您加入签名。如果您使用批量提删功能，存废讨论页只会使用第一次提交的理由，但您仍需在之后提供以用于删除通告模板的参数。', '您可以使用維基格式，Twinkle將自動為您加入簽名。如果您使用批量提刪功能，存廢討論頁只會使用第一次提交的理由，但您仍需在之後提供以用於刪除通告模板的參數。')
		});
		// TODO possible future "preview" link here
	};

	switch (value) {
		case 'afd':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: wgULS('页面存废讨论', '頁面存廢討論'),
				name: 'work_area'
			});
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: '使用&lt;noinclude&gt;包裹模板',
						value: 'noinclude',
						name: 'noinclude',
						checked: mw.config.get('wgNamespaceNumber') === 10, // Template namespace
						tooltip: wgULS('使其不会在被包含时出现。', '使其不會在被包含時出現。')
					}
				]
			});
			var afd_category = work_area.append({
				type: 'select',
				name: 'xfdcat',
				label: wgULS('选择提删类型：', '選擇提刪類別：'),
				event: Twinkle.xfd.callback.change_afd_category
			});

			var afd_cat = 'delete';
			if (Twinkle.getPref('afdDefaultCategory') === 'same') {
				if (localStorage.Twinkle_afdCategory === undefined) {
					localStorage.Twinkle_afdCategory = 'delete';
				} else {
					afd_cat = localStorage.Twinkle_afdCategory;
				}
			}
			afd_category.append({ type: 'option', label: wgULS('删除', '刪除'), value: 'delete', selected: afd_cat === 'delete' });
			afd_category.append({ type: 'option', label: wgULS('合并', '合併'), value: 'merge', selected: afd_cat === 'merge' });
			afd_category.append({ type: 'option', label: wgULS('移动到维基百科', '移動到維基百科'), value: 'vmw', selected: afd_cat === 'vmw' });
			afd_category.append({ type: 'option', label: wgULS('移动到维基文库', '移動到維基文庫'), value: 'vms', selected: afd_cat === 'vms' });
			afd_category.append({ type: 'option', label: wgULS('移动到维基教科书', '移動到維基教科書'), value: 'vmb', selected: afd_cat === 'vmb' });
			afd_category.append({ type: 'option', label: wgULS('移动到维基语录', '移動到維基語錄'), value: 'vmq', selected: afd_cat === 'vmq' });
			afd_category.append({ type: 'option', label: wgULS('移动到维基导游', '移動到維基導遊'), value: 'vmvoy', selected: afd_cat === 'vmvoy' });
			afd_category.append({ type: 'option', label: wgULS('移动到维基学院', '移動到維基學院'), value: 'vmv', selected: afd_cat === 'vmv' });
			if (Twinkle.getPref('FwdCsdToXfd')) {
				afd_category.append({ type: 'option', label: wgULS('转交自快速删除候选', '轉交自快速刪除候選'), value: 'fwdcsd', selected: afd_cat === 'fwdcsd' });
			}


			work_area.append({
				type: 'input',
				name: 'mergeinto',
				label: wgULS('合并到：', '合併到：'),
				hidden: true
			});
			appendReasonBox(afd_cat);
			work_area.append({
				type: 'textarea',
				name: 'fwdcsdreason',
				label: wgULS('转交理由：', '轉交理由：'),
				tooltip: wgULS('您可以使用维基格式，Twinkle将自动为您加入签名。', '您可以使用維基格式，Twinkle將自動為您加入簽名。'),
				hidden: true
			});

			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);

			var evt = document.createEvent('Event');
			evt.initEvent('change', true, true);
			form.xfdcat.dispatchEvent(evt);
			break;
		case 'ffd':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: wgULS('文件存废讨论', '檔案存廢討論'),
				name: 'work_area'
			});
			appendReasonBox('ffd');
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		default:
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: wgULS('未定义', '未定義'),
				name: 'work_area'
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
	}

	// Return to checked state when switching
	form.notify.checked = true;
	form.notify.disabled = false;
};

Twinkle.xfd.callback.change_afd_category = function twinklexfdCallbackChangeAfdCategory(e) {
	if (e.target.value === 'merge') {
		e.target.form.mergeinto.parentElement.removeAttribute('hidden');
		e.target.form.fwdcsdreason.parentElement.setAttribute('hidden', '');
		e.target.form.mergeinto.previousElementSibling.innerHTML = wgULS('合并到：', '合併到：');
	} else if (e.target.value === 'fwdcsd') {
		e.target.form.mergeinto.parentElement.removeAttribute('hidden');
		e.target.form.fwdcsdreason.parentElement.removeAttribute('hidden');
		e.target.form.mergeinto.previousElementSibling.innerHTML = '提交人：';
		e.target.form.xfdreason.value = decodeURIComponent($('#delete-reason').text()).replace(/\+/g, ' ');
	} else if (e.target.value === 'fame') {
		e.target.form.mergeinto.parentElement.setAttribute('hidden', '');
		e.target.form.fwdcsdreason.parentElement.setAttribute('hidden', '');
		e.target.form.xfdreason.value = Twinkle.getPref('afdFameDefaultReason');
	} else if (e.target.value === 'substub') {
		e.target.form.mergeinto.parentElement.setAttribute('hidden', '');
		e.target.form.fwdcsdreason.parentElement.setAttribute('hidden', '');
		e.target.form.xfdreason.value = Twinkle.getPref('afdSubstubDefaultReason');
	} else {
		e.target.form.mergeinto.parentElement.setAttribute('hidden', '');
		e.target.form.fwdcsdreason.parentElement.setAttribute('hidden', '');
	}
	if (Twinkle.getPref('afdDefaultCategory') === 'same') {
		localStorage.Twinkle_afdCategory = e.target.value;
	}
};

Twinkle.xfd.callbacks = {
	afd: {
		main: function(pageobj) {
			// this is coming in from lookupCreation...!
			var params = pageobj.getCallbackParameters();

			// Adding discussion
			var wikipedia_page = new Morebits.wiki.page(params.logpage, wgULS('加入讨论到当日清单', '加入討論到當日清單'));
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.afd.todaysList);

			// Notification to first contributor
			if (params.usertalk) {
				var initialContrib = pageobj.getCreator();

				// Disallow warning yourself
				if (initialContrib === mw.config.get('wgUserName')) {
					pageobj.getStatusElement().warn(wgULS('您（' + initialContrib + '）创建了该页，跳过通知', '您（' + initialContrib + '）建立了該頁，跳過通知'));
					return;
				}

				var talkPageName = 'User talk:' + initialContrib;
				Morebits.wiki.flow.check(talkPageName, function () {
					var flowpage = new Morebits.wiki.flow(talkPageName, wgULS('通知页面创建者（' + initialContrib + '）', '通知頁面建立者（' + initialContrib + '）'));
					flowpage.setTopic('页面[[:' + Morebits.pageNameNorm + ']]存废讨论通知');
					flowpage.setContent('{{subst:AFDNote|' + Morebits.pageNameNorm + '|flow=yes}}');
					flowpage.newTopic();
				}, function () {
					var usertalkpage = new Morebits.wiki.page(talkPageName, wgULS('通知页面创建者（' + initialContrib + '）', '通知頁面建立者（' + initialContrib + '）'));
					var notifytext = '\n{{subst:AFDNote|' + Morebits.pageNameNorm + '}}--~~~~';
					usertalkpage.setAppendText(notifytext);
					usertalkpage.setEditSummary('通知：页面[[' + Morebits.pageNameNorm + ']]存废讨论提名');
					usertalkpage.setChangeTags(Twinkle.changeTags);
					usertalkpage.setCreateOption('recreate');
					switch (Twinkle.getPref('xfdWatchUser')) {
						case 'yes':
							usertalkpage.setWatchlist(true);
							break;
						case 'no':
							usertalkpage.setWatchlistFromPreferences(false);
							break;
						default:
							usertalkpage.setWatchlistFromPreferences(true);
							break;
					}
					usertalkpage.setFollowRedirect(true);
					usertalkpage.append();
				});
			}
		},
		taggingArticle: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			var tag = '{{vfd|' + Morebits.string.formatReasonText(params.reason);

			switch (params.xfdcat) {
				case 'vmw':
					tag += '|wikt';
					break;
				case 'vms':
					tag += '|s';
					break;
				case 'vmb':
					tag += '|b';
					break;
				case 'vmq':
					tag += '|q';
					break;
				case 'vmvoy':
					tag += '|voy';
					break;
				case 'vmv':
					tag += '|v';
					break;
				default:
					break;
			}
			if (Morebits.wiki.isPageRedirect()) {
				tag += '|r';
			}
			tag += '|date={{subst:#time:Y/m/d}}}}';
			if (params.noinclude) {
				tag = '<noinclude>' + tag + '</noinclude>';

				// 只有表格需要单独加回车，其他情况加回车会破坏模板。
				if (text.indexOf('{|') === 0) {
					tag += '\n';
				}
			} else {
				tag += '\n';
			}

			// Then, test if there are speedy deletion-related templates on the article.
			var textNoSd = text.replace(/\{\{\s*(db(-\w*)?|d|delete|(?:hang|hold)[- ]?on)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
			if (text !== textNoSd && confirm(wgULS('在页面上找到快速删除模板，要移除吗？', '在頁面上找到快速刪除模板，要移除嗎？'))) {
				text = textNoSd;
			}

			// Mark the page as patrolled, if wanted
			if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
				pageobj.patrol();
			}

			pageobj.setPageText(tag + text);
			pageobj.setEditSummary(wgULS('页面存废讨论：[[', '頁面存廢討論：[[') + params.logpage + '#' + Morebits.pageNameNorm + ']]');
			pageobj.setChangeTags(Twinkle.changeTags);
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			// pageobj.setCreateOption('recreate');
			pageobj.save();

			if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
				pageobj.patrol();
			}
		},
		todaysList: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var type = '';
			var to = '';

			switch (params.xfdcat) {
				case 'vmw':
				case 'vms':
				case 'vmb':
				case 'vmq':
				case 'vmvoy':
				case 'vmv':
					type = 'vm';
					to = params.xfdcat;
					break;
				case 'fwdcsd':
				case 'merge':
					to = params.mergeinto;
					/* Fall through */
				default:
					type = params.xfdcat;
					break;
			}

			var append = true;
			switch (type) {
				case 'fame':
				case 'substub':
				case 'batch':
					var commentText = '<!-- Twinkle: User:' + mw.config.get('wgUserName') + ' 的 ' + type + ' 提刪插入點，請勿變更或移除此行，除非不再於此頁提刪 -->';
					var newText = '===[[' + Morebits.pageNameNorm + ']]===';
					if (type === 'fame') {
						newText += '\n{{Findsources|' + Morebits.pageNameNorm + '}}';
					}
					if (text.indexOf(commentText) !== -1) {
						text = text.replace(commentText, newText + '\n\n' + commentText);
						pageobj.setPageText(text);
						append = false;
					} else {
						var appendText = '\n{{safesubst:SafeAfdHead}}\n' +
							{
								'fame': '==30天后仍掛有{{tl|notability}}模板的條目==\n' +
									'<span style="font-size:smaller;">(已掛[[template:notability|關注度模板]]30天)</span>',
								'substub': '==到期篩選的小小作品==',
								'batch': '==批量提刪=='
							}[type] + '\n' +
							newText + '\n\n' +
							commentText + '\n' +
							'----\n' +
							'（請不要在橫線下参与讨论，以免出现错误。）\n' +
							':{{删除}}理據：' + Morebits.string.formatReasonText(params.reason) + '\n' +
							'提报以上' + {
							'fame': '<u>关注度不足</u>条目',
							'substub': '<u>小小作品</u>',
							'batch': '頁面'
						}[type] + '的維基人及時間：<br id="no-new-title" />~~~~';
						pageobj.setAppendText(appendText);
					}
					break;
				default:
					pageobj.setAppendText('\n{{subst:DRItem|Type=' + type + '|DRarticles=' + Morebits.pageNameNorm + '|Reason=' + Morebits.string.formatReasonText(params.reason) + (params.fwdcsdreason.trim() !== '' ? '<br>\n轉交理由：' + params.fwdcsdreason : '') + '|To=' + to + '}}--~~~~');
					break;
			}

			pageobj.setEditSummary('加入[[' + Morebits.pageNameNorm + ']]');
			pageobj.setChangeTags(Twinkle.changeTags);
			switch (Twinkle.getPref('xfdWatchDiscussion')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');
			if (append) {
				pageobj.append();
			} else {
				pageobj.save();
			}
			Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
		},
		tryTagging: function (pageobj) {
			var statelem = pageobj.getStatusElement();
			// defaults to /doc for lua modules, which may not exist
			if (!pageobj.exists() && mw.config.get('wgPageContentModel') !== 'Scribunto') {
				statelem.error(wgULS('页面不存在，可能已被删除', '頁面不存在，可能已被刪除'));
				return;
			}

			var text = pageobj.getPageText();

			var xfd = /(?:\{\{([rsaiftcmv]fd|md1|proposed deletion)[^{}]*?\}\})/i.exec(text);
			if (xfd && !confirm(wgULS('删除相关模板{{' + xfd[1] + '}}已被置于页面中，您是否仍想继续提报？', '刪除相關模板{{' + xfd[1] + '}}已被置於頁面中，您是否仍想繼續提報？'))) {
				statelem.error(wgULS('页面已被提交至存废讨论。', '頁面已被提交至存廢討論。'));
				return;
			}

			var copyvio = /(?:\{\{\s*(copyvio)[^{}]*?\}\})/i.exec(text);
			if (copyvio) {
				statelem.error(wgULS('页面中已有著作权验证模板。', '頁面中已有版權驗證模板。'));
				return;
			}

			Twinkle.xfd.callbacks.afd.taggingArticle(pageobj);

			// Notification to first contributor
			var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'));
			wikipedia_page.setCallbackParameters(pageobj.getCallbackParameters());
			wikipedia_page.setLookupNonRedirectCreator(true); // Look for author of first non-redirect revision
			wikipedia_page.lookupCreation(Twinkle.xfd.callbacks.afd.main);
		}
	},

	ffd: {
		main: function(pageobj) {
			// this is coming in from lookupCreation...!
			var params = pageobj.getCallbackParameters();
			var initialContrib = pageobj.getCreator();
			params.uploader = initialContrib;

			// Adding discussion
			var wikipedia_page = new Morebits.wiki.page(params.logpage, wgULS('加入讨论到当日清单', '加入討論到當日清單'));
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.ffd.todaysList);

			// Notification to first contributor
			if (params.usertalk) {
				// Disallow warning yourself
				if (initialContrib === mw.config.get('wgUserName')) {
					pageobj.getStatusElement().warn(wgULS('您（' + initialContrib + '）创建了该页，跳过通知', '您（' + initialContrib + '）建立了該頁，跳過通知'));
					return;
				}

				var talkPageName = 'User talk:' + initialContrib;

				Morebits.wiki.flow.check(talkPageName, function () {
					var flowpage = new Morebits.wiki.flow(talkPageName, wgULS('通知页面创建者（' + initialContrib + '）', '通知頁面建立者（' + initialContrib + '）'));
					flowpage.setTopic('文件[[:File:' + mw.config.get('wgTitle') + ']]存废讨论通知');
					flowpage.setContent('{{subst:idw|File:' + mw.config.get('wgTitle') + '|flow=yes}}');
					flowpage.newTopic();
				}, function () {
					var usertalkpage = new Morebits.wiki.page(talkPageName, wgULS('通知页面创建者（' + initialContrib + '）', '通知頁面建立者（' + initialContrib + '）'));
					var notifytext = '\n{{subst:idw|File:' + mw.config.get('wgTitle') + '}}--~~~~';
					usertalkpage.setAppendText(notifytext);
					usertalkpage.setEditSummary('通知：文件[[' + Morebits.pageNameNorm + ']]存废讨论提名');
					usertalkpage.setChangeTags(Twinkle.changeTags);
					usertalkpage.setCreateOption('recreate');
					switch (Twinkle.getPref('xfdWatchUser')) {
						case 'yes':
							usertalkpage.setWatchlist(true);
							break;
						case 'no':
							usertalkpage.setWatchlistFromPreferences(false);
							break;
						default:
							usertalkpage.setWatchlistFromPreferences(true);
							break;
					}
					usertalkpage.setFollowRedirect(true);
					usertalkpage.append();
				});
			}
		},
		taggingImage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText('{{ifd|' + Morebits.string.formatReasonText(params.reason) + '|date={{subst:#time:c}}}}\n' + text);
			pageobj.setEditSummary(wgULS('文件存废讨论：[[', '檔案存廢討論：[[') + params.logpage + '#' + Morebits.pageNameNorm + ']]');
			pageobj.setChangeTags(Twinkle.changeTags);
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');  // it might be possible for a file to exist without a description page
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			pageobj.setAppendText('\n{{subst:IfdItem|Filename=' + mw.config.get('wgTitle') + '|Uploader=' + params.uploader + '|Reason=' + Morebits.string.formatReasonText(params.reason) + '}}--~~~~');
			pageobj.setEditSummary('加入[[' + Morebits.pageNameNorm + ']]');
			pageobj.setChangeTags(Twinkle.changeTags);
			switch (Twinkle.getPref('xfdWatchDiscussion')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');
			pageobj.append(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		tryTagging: function (pageobj) {
			var statelem = pageobj.getStatusElement();
			if (!pageobj.exists()) {
				statelem.error(wgULS('页面不存在，可能已被删除', '頁面不存在，可能已被刪除'));
				return;
			}

			var text = pageobj.getPageText();

			var xfd = /(?:\{\{([rsaiftcmv]fd|md1|proposed deletion)[^{}]*?\}\})/i.exec(text);
			if (xfd && !confirm(wgULS('删除相关模板{{' + xfd[1] + '}}已被置于页面中，您是否仍想继续提报？', '刪除相關模板{{' + xfd[1] + '}}已被置於頁面中，您是否仍想繼續提報？'))) {
				statelem.error(wgULS('页面已被提交至存废讨论。', '頁面已被提交至存廢討論。'));
				return;
			}

			Twinkle.xfd.callbacks.ffd.taggingImage(pageobj);

			// Contributor specific edits
			var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'));
			wikipedia_page.setCallbackParameters(pageobj.getCallbackParameters());
			wikipedia_page.setLookupNonRedirectCreator(true); // Look for author of first non-redirect revision
			wikipedia_page.lookupCreation(Twinkle.xfd.callbacks.ffd.main);
		}
	}
};



Twinkle.xfd.callback.evaluate = function(e) {
	var type = e.target.category.value;
	var usertalk = e.target.notify.checked;
	var reason = e.target.xfdreason.value;
	var fwdcsdreason, xfdcat, mergeinto, noinclude;
	if (type === 'afd') {
		fwdcsdreason = e.target.fwdcsdreason.value;
		noinclude = e.target.noinclude.checked;
		xfdcat = e.target.xfdcat.value;
		mergeinto = e.target.mergeinto.value;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(e.target);

	Twinkle.xfd.currentRationale = reason;
	Morebits.status.onError(Twinkle.xfd.printRationale);

	if (!type) {
		Morebits.status.error('错误', '未定义的动作');
		return;
	}

	var wikipedia_page, logpage, params;
	switch (type) {

		case 'afd': // AFD
			logpage = 'Wiktionary:删除请求';
			params = { usertalk: usertalk, xfdcat: xfdcat, mergeinto: mergeinto, noinclude: noinclude, reason: reason, fwdcsdreason: fwdcsdreason, logpage: logpage };

			Morebits.wiki.addCheckpoint();
			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = logpage;
			Morebits.wiki.actionCompleted.notice = wgULS('提名完成，重定向到讨论页', '提名完成，重定向到討論頁');

			// Tagging page
			var isScribunto = mw.config.get('wgPageContentModel') === 'Scribunto';
			wikipedia_page = isScribunto ? new Morebits.wiki.page(mw.config.get('wgPageName') + '/doc', wgULS('加入存废讨论模板到模块文件页', '加入存廢討論模板到模組文件頁')) : new Morebits.wiki.page(mw.config.get('wgPageName'), wgULS('加入存废讨论模板到页面', '加入存廢討論模板到頁面'));
			wikipedia_page.setFollowRedirect(false);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.afd.tryTagging);

			Morebits.wiki.removeCheckpoint();
			break;

		case 'ffd': // FFD
			logpage = 'Wiktionary:删除请求';
			params = { usertalk: usertalk, reason: reason, logpage: logpage };

			Morebits.wiki.addCheckpoint();
			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = logpage;
			Morebits.wiki.actionCompleted.notice = wgULS('提名完成，重定向到讨论页', '提名完成，重定向到討論頁');

			// Tagging file
			wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), wgULS('加入存废讨论模板到文件描述页', '加入存廢討論模板到檔案描述頁'));
			wikipedia_page.setFollowRedirect(false);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.ffd.tryTagging);

			Morebits.wiki.removeCheckpoint();
			break;

		default:
			alert('twinklexfd：未定义的类别');
			break;
	}
};


})(jQuery);


// </nowiki>
