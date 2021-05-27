import argparse
import html
import os
import re
import json

import requests

BASEDIR = os.path.dirname(os.path.abspath(__file__))

parser = argparse.ArgumentParser()
parser.add_argument('--mode', nargs='?', type=str, choices=['hans', 'hant'], default='hans')
args = parser.parse_args()

noteTA = '''{{NoteTA
|G1=IT
|G2=MediaWiki
}}
-{H|zh-hans:帮助;zh-hant:說明}-
-{H|zh-hans:周;zh-hant:週}-
-{H|zh-hans:批复;zh-hant:批復}-
-{H|zh-hans:配置;zh-hant:配置}-
-{H|zh-hans:窗口;zh-hant:視窗}-
-{H|zh-hans:项目;zh-hant:項目}-
-{H|zh-hans:单击;zh-hant:點擊}-
-{H|zh-hans:支持;zh-hant:支援}-
-{H|zh-hans:标清;zh-hant:標清}-
-{H|zh-hans:移动设备;zh-hant:行動裝置}-
-{H|zh-hans:关联;zh-hant:關聯}-
-{H|zh-hans:保存;zh-hant:儲存}-
-{H|zh-hans:执行;zh-hant:執行}-
-{H|zh-hans:消息;zh-hant:訊息}-
-{H|zh-hans:启动;zh-hant:啟動}-
-{H|zh-hans:启用功能;zh-hant:啟用功能}-
-{H|zh-hans:启用;zh-hant:啟用}-
-{H|zh-hans:计划;zh-hant:計劃}-
-{H|zh-hans:不实资料;zh-hant:不實資料}-
-{H|zh-hans:注释;zh-hant:注釋}-
-{H|zh-hans:分辨率;zh-hant:解析度}-
-{H|zh-hans:类型;zh-hant:類別}-
-{H|zh-hans:账户;zh-hant:帳號}-
-{H|zh-hans:已在运行;zh-hant:已在執行}-
-{H|zh-hans:当前;zh-hant:目前}-
-{H|zh-hans:最近更改;zh-hant:近期變更}-
-{H|zh-hans:相关更改;zh-hant:相關變更}-
-{H|zh-hans:说明;zh-hant:說明}-
-{H|zh-hans:Twinkle帮助;zh-hant:Twinkle說明}-
-{H|zh-hans:公用IP;zh-hant:公共IP}-
-{H|zh-hans:监视;zh-hant:監視}-
-{H|zh-hans:通过;zh-hant:透過}-
-{H|zh-hans:链入;zh-hant:連入}-
-{H|zh-hans:消链;zh-hant:消連}-
'''

headers = {
    'user-agent': 'Twinkle i18n script [[User:Xiplus]]'
}


def escapeWikitextMatch(text):
    return '&#{};'.format(ord(text[0]))


def escapeWikitext(text):
    text = re.sub(r"[\[\]{}<>|\\:*'_#&\s]", escapeWikitextMatch, text)
    return text


if args.mode == 'hans':
    source_file = os.path.join(BASEDIR, '..', 'src', 'messages-zh-hant.json')
    target_file = os.path.join(BASEDIR, '..', 'src', 'messages-zh-hans.json')
elif args.mode == 'hant':
    source_file = os.path.join(BASEDIR, '..', 'src', 'messages-zh-hans.json')
    target_file = os.path.join(BASEDIR, '..', 'src', 'messages-zh-hant.json')
else:
    print('Unknown mode: {}'.format(args.mode))
    exit()

with open(source_file, 'r', encoding='utf8') as f:
    data = json.load(f)

text = noteTA

msg_keys = []
for key in data:
    text += '<div id="text{}">{}</div>'.format(len(msg_keys), escapeWikitext(data[key]))
    msg_keys.append(key)

data = {
    'action': 'parse',
    'format': 'json',
    'text': text,
    'prop': 'text',
    'contentmodel': 'wikitext',
    'utf8': 1
}
if args.mode == 'hans':
    data['uselang'] = 'zh-cn'
elif args.mode == 'hant':
    data['uselang'] = 'zh-tw'

r = requests.post('https://zh.wikipedia.org/w/api.php', data=data, headers=headers)
try:
    result = r.json()
except Exception as e:
    print(e)
    print(r.text)

result = result['parse']['text']['*']
matches = re.findall(r'<div id="text(\d+)">(.+?)</div>', result)

newdata = {}
for match in matches:
    idx = int(match[0])
    newtext = html.unescape(match[1]).replace('\\n', '\\\\n')

    newdata[msg_keys[idx]] = newtext

with open(target_file, 'w', encoding='utf8') as f:
    json.dump(newdata, f, ensure_ascii=False, indent=2)
