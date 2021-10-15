import { BatchDeleteCore } from './core';
import { msg } from './core';

export class BatchDelete extends BatchDeleteCore {
	windowTitle = msg('batch-delete-window-title');
	portletTooltip = msg('batch-delete-portlet-tooltip');
	footerLinks = {
		[msg('twinkle-help')]: 'w:WP:TW/DOC#batchundelete',
	};

	beforeAddMenu() {
		this.portletName = msg('batch-delete-portlet-name');
	}

	getMetadata(page) {
		var metadata: string[] = [];
		if (page.redirect) {
			metadata.push(msg('redirect'));
		}

		var editProt = page.protection
			.filter((pr) => {
				return pr.type === 'edit' && pr.level === 'sysop';
			})
			.pop();
		if (editProt) {
			metadata.push(
				msg('restriction-level-sysop') +
					msg('word-separator') +
					msg(
						'parentheses',
						editProt.expiry === 'infinity'
							? msg('protect-expiry-indefinite')
							: msg('protect-expiring', new Morebits.date(editProt.expiry).calendar('utc'))
					)
			);
		}
		if (page.ns === 6) {
			metadata.push(msg('uploader', page.imageinfo[0].user));
			metadata.push(msg('last-editor', page.revisions[0].user));
		} else {
			metadata.push(msg('nbytes', mw.language.convertNumber(page.revisions[0].size)));
		}

		return metadata;
	}
}
