import { Twinkle, init, SiteConfig, urlParamValue } from './core';
import messagesZhHans from './messages-zh-hans.json';
import messagesZhHant from './messages-zh-hant.json';
import mwMessageList from './mw-messages';

// import modules
import { Fluff } from './fluff';
import { BatchDelete } from './batchdelete';

// no customisation; import directly from core
import { DiffCore as Diff } from './core';

// Check if account is experienced enough to use Twinkle
if (!Morebits.userIsInGroup('autoconfirmed') && !Morebits.userIsInGroup('confirmed')) {
	// throw new Error('Twinkle: forbidden!');
}

Twinkle.userAgent = `Twinkle (${mw.config.get('wgWikiID')})`;

Twinkle.summaryAd = ' ([[Project:TW|TW]])';

Twinkle.changeTags = 'Twinkle';

Twinkle.language = urlParamValue('uselang') || mw.config.get('wgUserLanguage');

Twinkle.messageOverrides = ['zh-hant', 'zh-tw', 'zh-hk', 'zh-mo'].includes(Twinkle.language)
	? messagesZhHant
	: messagesZhHans;

Twinkle.extraMwMessages = mwMessageList;

// List of module classes enabled
Twinkle.registeredModules = [Diff, Fluff, BatchDelete];

/**
 * Adjust the following configurations if necessary
 * Check the documentation for each property here:
 * https://twinkle.toolforge.org/core-docs/modules/siteconfig.html
 */

SiteConfig.permalinkSpecialPageName = 'Special:PermanentLink';

SiteConfig.botUsernameRegex = /bot\b/i;

SiteConfig.flaggedRevsNamespaces = [];

SiteConfig.redirectTagAliases = ['#REDIRECT'];

// Go!
init();
