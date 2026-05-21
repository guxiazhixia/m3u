# -*- coding: utf-8 -*-
"""
FullEroticMovies - OK影视/TVBox 纯标准库爬虫
不依赖任何第三方库（不用 bs4/requests），只用 Python 内置模块
兼容 CatVodSpider / OpenBox / OK影视
"""
import re
import json
import urllib.request
import urllib.parse
from html.parser import HTMLParser
SITE_URL = 'https://www.fulleroticmovies.net'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': SITE_URL + '/',
}
def _fetch(url):
    """用 urllib 获取页面"""
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode('utf-8', errors='replace')
class _VideoListParser(HTMLParser):
    """用标准库 html.parser 解析视频列表"""
    def __init__(self):
        super().__init__()
        self.videos = []
        self.seen = set()
        self._cur = None
    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            d = dict(attrs)
            href = d.get('href', '')
            m = re.search(r'/video/([^/]+)/', href)
            if m:
                slug = m.group(1)
                if slug not in self.seen:
                    self.seen.add(slug)
                    self._cur = {'vod_id': slug, 'vod_name': d.get('title', ''), 'vod_pic': ''}
        elif tag == 'img' and self._cur:
            d = dict(attrs)
            src = d.get('src', '')
            if src:
                self._cur['vod_pic'] = src if src.startswith('http') else SITE_URL + src
    def handle_endtag(self, tag):
        if tag == 'a' and self._cur:
            if self._cur['vod_name']:
                self.videos.append(self._cur)
            self._cur = None
    def handle_data(self, data):
        if self._cur and not self._cur['vod_name']:
            t = data.strip()
            if t:
                self._cur['vod_name'] = t
def _parse_videos(html):
    parser = _VideoListParser()
    try:
        parser.feed(html)
    except:
        pass
    return parser.videos
def _get_classes():
    return [
        {'type_id': 'videos', 'type_name': 'Newest'},
        {'type_id': 'trending', 'type_name': 'Trending'},
        {'type_id': 'most-viewed', 'type_name': 'Most Viewed'},
        {'type_id': 'top-rated', 'type_name': 'Top Rated'},
    ]
# ==================== 标准接口 ====================
def homeContent():
    html = _fetch(SITE_URL + '/')
    videos = _parse_videos(html)
    return {'class': _get_classes(), 'list': videos[:20]}
def categoryContent(tid, pg, filter_dict, extend):
    tid = str(tid)
    pg = int(pg) if isinstance(pg, str) else pg
    if pg == 1:
        url = f"{SITE_URL}/{tid}/"
    else:
        url = f"{SITE_URL}/{tid}/{pg}/"
    html = _fetch(url)
    videos = _parse_videos(html)
    page_count = pg
    if re.search(rf'/{tid}/{pg + 1}/', html):
        page_count = pg + 1
    return {
        'page': pg, 'pagecount': page_count,
        'limit': len(videos), 'total': page_count * 20,
        'list': videos,
    }
def detailContent(ids):
    slug = ids[0] if isinstance(ids, list) else ids
    html = _fetch(f"{SITE_URL}/video/{slug}/")
    # flashvars
    fv_m = re.search(r'var\s+flashvars\s*=\s*(\{[^;]+\});', html, re.DOTALL)
    title = ''
    preview = ''
    vurls = {}
    if fv_m:
        fv = fv_m.group(1)
        def gv(k):
            m = re.search(rf"{k}\s*:\s*'([^']*)'", fv)
            return m.group(1) if m else ''
        title = gv('video_title')
        preview = gv('preview_url')
        for key, q in [('video_url','360P'),('video_alt_url','480P'),('video_alt_url2','720P'),('video_alt_url3','1080P')]:
            u = gv(key)
            if u:
                vurls[q] = u
    if not title:
        m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
        title = re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else ''
    vod_pic = preview if preview.startswith('http') else (SITE_URL + preview if preview else '')
    # 分类/演员
    cats = list(dict.fromkeys(re.findall(r'/category/[^"]+"[^>]*>([^<]+)<', html)))
    actors = list(dict.fromkeys(re.findall(r'/pornstar/[^"]+"[^>]*>([^<]+)<', html)))
    # 描述
    dm = re.search(r'<meta[^>]*name="description"[^>]*content="([^"]*)"', html)
    if not dm:
        dm = re.search(r'<meta[^>]*property="og:description"[^>]*content="([^"]*)"', html)
    vod_content = dm.group(1)[:500] if dm else ''
    quality_order = ['1080P', '720P', '480P', '360P']
    play_list = [f"{q}${vurls[q]}" for q in quality_order if q in vurls]
    return {
        'list': [{
            'vod_id': slug, 'vod_name': title, 'vod_pic': vod_pic,
            'type_name': ','.join(cats[:5]), 'vod_year': '', 'vod_area': '',
            'vod_remarks': '', 'vod_actor': ','.join(actors[:10]),
            'vod_director': '', 'vod_content': vod_content,
            'vod_play_from': 'FullEroticMovies',
            'vod_play_url': '#'.join(play_list),
        }]
    }
def searchContent(key, quick=False):
    key = str(key) if not isinstance(key, str) else key
    html = _fetch(f"{SITE_URL}/search/{urllib.parse.quote(key)}/")
    videos = _parse_videos(html)
    return {'list': videos}
def playerContent(flag, id, vipFlags):
    return {'parse': 0, 'url': id, 'header': json.dumps(HEADERS)}
# ==================== 兼容入口 ====================
def home():
    print(json.dumps(homeContent(), ensure_ascii=False))
def category(tid, pg=1, filter_dict=None, extend=None):
    print(json.dumps(categoryContent(tid, pg, filter_dict or {}, extend), ensure_ascii=False))
def detail(ids):
    print(json.dumps(detailContent(ids), ensure_ascii=False))
def search(key, quick=False):
    print(json.dumps(searchContent(key, quick), ensure_ascii=False))
def player(flag, id, vipFlags=None):
    print(json.dumps(playerContent(flag, id, vipFlags or []), ensure_ascii=False))
if __name__ == '__main__':
    import sys
    action = sys.argv[1] if len(sys.argv) > 1 else 'home'
    {'home': home, 'category': category, 'detail': detail, 'search': search, 'player': player}.get(action, home)()