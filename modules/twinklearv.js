// <nowiki>
// vim: set noet sts=0 sw=8:


(function($) { // eslint-disable-line no-unused-vars


/*
 ****************************************
 *** twinklearv.js: ARV module
 ****************************************
 * Mode of invocation:     Tab ("ARV")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 */

Twinkle.arv = function twinklearv() {
	var username = Morebits.wiki.flow.relevantUserName(true);
	if (!username) {
		return;
	}

	var title = mw.util.isIPAddress(username) ? wgULS('报告IP给管理员', '報告IP給管理員') : wgULS('报告用户给管理人员', '報告使用者給管理人員');

	Twinkle.addPortletLink(function() {
		Twinkle.arv.callback(username);
	}, wgULS('告状', '告狀'), 'tw-arv', title);
};

Twinkle.arv.callback = function (uid) {
	if (uid === mw.config.get('wgUserName')) {
		alert(wgULS('你不想报告你自己，对吧？', '你不想報告你自己，對吧？'));
		return;
	}

	var Window = new Morebits.simpleWindow(600, 500);
	Window.setTitle(wgULS('报告用户给管理人员', '報告用戶給管理人員'));
	Window.setScriptName('Twinkle');
	Window.addFooterLink(wgULS('Twinkle帮助', 'Twinkle說明'), 'w:WP:TW/DOC#告狀');

	var form = new Morebits.quickForm(Twinkle.arv.callback.evaluate);
	var categories = form.append({
		type: 'select',
		name: 'category',
		label: wgULS('选择报告类型：', '選擇報告類型：'),
		event: Twinkle.arv.callback.changeCategory
	});
	categories.append({
		type: 'option',
		label: wgULS('破坏（WT:BP）', '破壞（WT:BP）'),
		value: 'aiv'
	});
	form.append({
		type: 'field',
		label: 'Work area',
		name: 'work_area'
	});
	form.append({ type: 'submit', label: '提交' });
	form.append({
		type: 'hidden',
		name: 'uid',
		value: uid
	});

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.category.dispatchEvent(evt);
};

Twinkle.arv.callback.changeCategory = function (e) {
	var value = e.target.value;
	var root = e.target.form;
	var old_area = Morebits.quickForm.getElements(root, 'work_area')[0];
	var work_area = null;

	switch (value) {
		case 'aiv':
		/* falls through */
		default:
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: wgULS('报告用户破坏', '報告用戶破壞'),
				name: 'work_area'
			});
			work_area.append({
				type: 'input',
				name: 'page',
				label: wgULS('相关页面：', '相關頁面：'),
				tooltip: wgULS('如不希望让报告链接到页面，请留空', '如不希望讓報告連結到頁面，請留空'),
				value: mw.util.getParamValue('vanarticle') || '',
				event: function(e) {
					var value = e.target.value;
					var root = e.target.form;
					if (value === '') {
						root.badid.disabled = root.goodid.disabled = true;
					} else {
						root.badid.disabled = false;
						root.goodid.disabled = root.badid.value === '';
					}
				}
			});
			work_area.append({
				type: 'input',
				name: 'badid',
				label: wgULS('受到破坏的修订版本：', '受到破壞的修訂版本：'),
				tooltip: wgULS('留空以略过差异', '留空以略過差異'),
				value: mw.util.getParamValue('vanarticlerevid') || '',
				disabled: !mw.util.getParamValue('vanarticle'),
				event: function(e) {
					var value = e.target.value;
					var root = e.target.form;
					root.goodid.disabled = value === '';
				}
			});
			work_area.append({
				type: 'input',
				name: 'goodid',
				label: wgULS('破坏前的修订版本：', '破壞前的修訂版本：'),
				tooltip: wgULS('留空以略过差异的较早版本', '留空以略過差異的較早版本'),
				value: mw.util.getParamValue('vanarticlegoodrevid') || '',
				disabled: !mw.util.getParamValue('vanarticle') || mw.util.getParamValue('vanarticlerevid')
			});
			work_area.append({
				type: 'checkbox',
				name: 'arvtype',
				list: [
					{
						label: wgULS('已发出最后（层级4或4im）警告', '已發出最後（層級4或4im）警告'),
						value: 'final'
					},
					{
						label: wgULS('封禁过期后随即破坏', '封禁過期後隨即破壞'),
						value: 'postblock'
					},
					{
						label: wgULS('显而易见的纯破坏用户', '顯而易見的純破壞用戶'),
						value: 'vandalonly',
						disabled: mw.util.isIPAddress(root.uid.value)
					},
					{
						label: wgULS('显而易见的spambot或失窃账户', '顯而易見的spambot或失竊帳戶'),
						value: 'spambot'
					},
					{
						label: wgULS('仅用来散发广告宣传的用户', '僅用來散發廣告宣傳的用戶'),
						value: 'promoonly'
					}
				]
			});
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: wgULS('评论：', '評論：')
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
	}
};

Twinkle.arv.callback.evaluate = function(e) {
	var form = e.target;
	var reason = '';
	var comment = '';
	if (form.reason) {
		comment = form.reason.value;
	}
	var uid = form.uid.value;

	var types;
	switch (form.category.value) {

		// Report user for vandalism
		case 'aiv':
			/* falls through */
		default:
			types = form.getChecked('arvtype');
			if (!types.length && comment === '') {
				alert(wgULS('您必须指定理由', '您必須指定理由'));
				return;
			}

			types = types.map(function(v) {
				switch (v) {
					case 'final':
						return '已发出最后警告';
					case 'postblock':
						return '封禁过期后随即破坏';
					case 'spambot':
						return '显而易见的spambot或失窃账户';
					case 'vandalonly':
						return '显而易见的纯破坏用户';
					case 'promoonly':
						return '仅用来散发广告宣传的用户';
					default:
						return '位置理由';
				}
			}).join('，');


			if (form.page.value !== '') {

				// add a leading : on linked page namespace to prevent transclusion
				reason = '* {{pagelinks|' + (form.page.value.indexOf('=') > -1 ? '1=' : '') + form.page.value + '}}';

				if (form.badid.value !== '') {
					reason += '（{{diff|' + form.page.value + '|' + form.badid.value + '|' + form.goodid.value + '|diff}}）';
				}
				reason += '\n';
			}

			if (types) {
				reason += '* ' + types;
			}
			if (comment !== '') {
				comment = comment.replace(/\r?\n/g, '\n*:');  // indent newlines
				reason += (types ? '。' : '* ') + comment;
			}
			reason = reason.trim();
			if (reason.search(/[.?!;。？！；]$/) === -1) {
				reason += '。';
			}
			reason += '\n* 发现人：~~~~\n* 处理：';

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			Morebits.wiki.actionCompleted.redirect = 'Wiktionary:啤酒馆';
			Morebits.wiki.actionCompleted.notice = '报告完成';

			var aivPage = new Morebits.wiki.page('Wiktionary:啤酒馆', wgULS('处理请求', '處理請求'));
			aivPage.setFollowRedirect(true);

			aivPage.load(function() {
				var text = aivPage.getPageText();
				var $aivLink = '<a target="_blank" href="/wiki/WT:BP">WT:BP</a>';

				// check if user has already been reported
				if (new RegExp('==\\s*\\{\\{\\s*(?:[Vv]andal)\\s*\\|\\s*(?:1=)?\\s*' + RegExp.escape(uid, true) + '\\s*\\}\\}\\s*==').test(text)) {
					aivPage.getStatusElement().error(wgULS('报告已存在，将不会加入新的', '報告已存在，將不會加入新的'));
					Morebits.status.printUserText(reason, wgULS('您键入的评论已在下方提供，您可以将其加入到' + $aivLink + '已存在的小节中：', '您鍵入的評論已在下方提供，您可以將其加入到' + $aivLink + '已存在的小節中：'));
					return;
				}
				aivPage.getStatusElement().status(wgULS('加入新报告…', '加入新報告…'));
				aivPage.setEditSummary(wgULS('报告', '報告') + '[[Special:Contributions/' + uid + '|' + uid + ']]。');
				aivPage.setChangeTags(Twinkle.changeTags);
				aivPage.setAppendText('\n== {{vandal|' + (/=/.test(uid) ? '1=' : '') + uid + '}} ==\n' + reason);
				aivPage.append();
			});
			break;
	}
};

})(jQuery);


// </nowiki>
