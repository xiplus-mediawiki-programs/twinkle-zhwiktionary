import { BatchDeleteCore } from './core';
import { msg, getBanana } from './core';

export class BatchDelete extends BatchDeleteCore {
	portletName = msg('batch-delete-portlet-name');
	windowTitle = msg('batch-delete-window-title');
	portletTooltip = msg('batch-delete-portlet-tooltip');
	footerLinks = {
		[msg('twinkle-help')]: 'WP:TW/DOC#batchundelete',
	};

	getMetadata(page) {
		var metadata: string[] = [];
		if (page.redirect) {
			metadata.push('redirect');
		}

		var editProt = page.protection
			.filter((pr) => {
				return pr.type === 'edit' && pr.level === 'sysop';
			})
			.pop();
		if (editProt) {
			metadata.push(
				'fully protected' +
					(editProt.expiry === 'infinity'
						? ' indefinitely'
						: ', expires ' + new Morebits.date(editProt.expiry).calendar('utc') + ' (UTC)')
			);
		}
		if (page.ns === 6) {
			metadata.push('uploader: ' + page.imageinfo[0].user);
			metadata.push('last edit from: ' + page.revisions[0].user);
		} else {
			metadata.push(mw.language.convertNumber(page.revisions[0].size) + ' bytes');
		}

		return metadata;
	}
}
