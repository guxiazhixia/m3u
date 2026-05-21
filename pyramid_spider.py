"""
FullEroticMovies - TVBox/OK影视 标准爬虫接口 v2
支持所有清晰度: 360P / 480P / 720P / 1080P
兼容 CatVodSpider / OpenBox / TVBox 等多平台
"""
# -*- coding: utf-8 -*-
import re
import json
import requests
from urllib.parse import quote, unquote
from bs4 import BeautifulSoup
SITE_URL = 'https://www.fulleroticmovies.net'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': SITE_URL + '/',
}
_session = None
def get_session():
    global _session
    if _session is None:
        _session = requests.Session()
        _session.headers.update(HEADERS)
    return _session
def _parse_video_list(html):
    """解析HTML中的视频列表"""
    soup = BeautifulSoup(html, 'html.parser')
    videos = []
    seen = set()
    for a in soup.find_all('a', href=re.compile(r'/video/')):
        href = a.get('href', '')
        m = re.search(r'/video/([^/]+)/', href)
        if not m:
            continue
        slug = m.group(1)
        if slug in seen:
            continue
        seen.add(slug)
        title = a.get('title', '') or a.get_text(strip=True)
        if not title:
            continue
        img = a.find('img')
        thumb = ''
        if img:
            thumb = img.get('src', '')
            if thumb and not thumb.startswith('http'):
                thumb = SITE_URL + thumb
        videos.append({'vod_id': slug, 'vod_name': title, 'vod_pic': thumb})
    return videos
def _get_classes():
    return [
        {'type_id': 'videos', 'type_name': 'Newest'},
        {'type_id': 'trending', 'type_name': 'Trending'},
        {'type_id': 'most-viewed', 'type_name': 'Most Viewed'},
        {'type_id': 'top-rated', 'type_name': 'Top Rated'},
    ]
def _extract_videos_from_flashvars(text):
    """从 flashvars 中提取所有视频URL，支持 360P/480P/720P/1080P"""
    result = {}
    fv_match = re.search(r'var\s+flashvars\s*=\s*(\{[^;]+\});', text, re.DOTALL)
    if not fv_match:
        return result
    fv = fv_match.group(1)
    # 按清晰度顺序提取: video_url=360, video_alt_url=480, video_alt_url2=720, video_alt_url3=1080
    quality_map = [
        ('video_url', 'video_url_text'),
        ('video_alt_url', 'video_alt_url_text'),
        ('video_alt_url2', 'video_alt_url2_text'),
        ('video_alt_url3', 'video_alt_url3_text'),
    ]
    for url_key, text_key in quality_map:
        m = re.search(rf"{url_key}\s*:\s*'([^']*)'", fv)
        url = m.group(1) if m else ''
        if not url:
            continue
        # 从 URL 中提取清晰度数字
        qm = re.search(r'/get_stream/\d+-(\d+)\.mp4', url)
        quality = qm.group(1) + 'P' if qm else '360P'
        result[quality] = url
    return result
# ==================== TVBox 标准接口函数 ====================
def homeContent():
    """首页内容"""
    s = get_session()
    r = s.get(SITE_URL + '/', timeout=30)
    r.encoding = 'utf-8'
    videos = _parse_video_list(r.text)
    return {'class': _get_classes(), 'filters': {}, 'list': videos[:20]}
def categoryContent(tid, pg, filter_dict, extend):
    """分类内容"""
    s = get_session()
    tid = str(tid)
    pg = int(pg) if isinstance(pg, str) else pg
    if pg == 1:
        url = f"{SITE_URL}/{tid}/"
    else:
        url = f"{SITE_URL}/{tid}/{pg}/"
    r = s.get(url, timeout=30)
    r.encoding = 'utf-8'
    videos = _parse_video_list(r.text)
    page_count = pg
    if re.search(rf'/{tid}/{pg + 1}/', r.text):
        page_count = pg + 1
    return {
        'class': _get_classes(),
        'page': pg,
        'pagecount': page_count,
        'limit': len(videos),
        'total': page_count * 20,
        'list': videos,
    }
def detailContent(ids):
    """详情内容 - 支持所有清晰度"""
    s = get_session()
    video_slug = ids[0] if isinstance(ids, list) else ids
    url = f"{SITE_URL}/video/{video_slug}/"
    r = s.get(url, timeout=30)
    r.encoding = 'utf-8'
    soup = BeautifulSoup(r.text, 'html.parser')
    # 从 flashvars 提取所有视频URL
    video_urls = _extract_videos_from_flashvars(r.text)
    # 标题
    fv_match = re.search(r'var\s+flashvars\s*=\s*(\{[^;]+\});', r.text, re.DOTALL)
    video_title = ''
    preview_url = ''
    if fv_match:
        fv = fv_match.group(1)
        m = re.search(r"video_title\s*:\s*'([^']*)'", fv)
        video_title = m.group(1) if m else ''
        m2 = re.search(r"preview_url\s*:\s*'([^']*)'", fv)
        preview_url = m2.group(1) if m2 else ''
    if not video_title:
        h1 = soup.find('h1')
        video_title = h1.get_text(strip=True) if h1 else ''
    vod_pic = preview_url if preview_url.startswith('http') else (SITE_URL + preview_url if preview_url else '')
    # 描述
    desc_meta = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', property='og:description')
    vod_content = desc_meta.get('content', '')[:500] if desc_meta else ''
    # 分类和演员
    cats = [a.get_text(strip=True) for a in soup.find_all('a', href=re.compile(r'/category/')) if a.get_text(strip=True)]
    actors = [a.get_text(strip=True) for a in soup.find_all('a', href=re.compile(r'/pornstar/')) if a.get_text(strip=True)]
    # 构建播放列表 - 按清晰度排序
    quality_order = ['1080P', '720P', '480P', '360P']
    play_list = []
    for q in quality_order:
        if q in video_urls:
            play_list.append(f"{q}${video_urls[q]}")
    # 兜底：如果有URL但没匹配到
    for q, u in video_urls.items():
        if q not in quality_order:
            play_list.append(f"{q}${u}")
    return {
        'list': [{
            'vod_id': video_slug,
            'vod_name': video_title,
            'vod_pic': vod_pic,
            'type_name': ','.join(cats[:5]),
            'vod_year': '',
            'vod_area': '',
            'vod_remarks': '',
            'vod_actor': ','.join(actors[:10]),
            'vod_director': '',
            'vod_content': vod_content,
            'vod_play_from': 'FullEroticMovies',
            'vod_play_url': '#'.join(play_list),
        }]
    }
def searchContent(key, quick=False):
    """搜索内容"""
    s = get_session()
    if isinstance(key, list):
        key = key[0]
    key = str(key)
    url = f"{SITE_URL}/search/{quote(key)}/"
    r = s.get(url, timeout=30)
    r.encoding = 'utf-8'
    videos = _parse_video_list(r.text)
    return {'list': videos}
def playerContent(flag, id, vipFlags):
    """播放内容"""
    return {
        'parse': 0,
        'url': id,
        'header': json.dumps(HEADERS),
    }
# ==================== Pyramid/CatVod 兼容入口 ====================
def home():
    result = homeContent()
    print(json.dumps(result, ensure_ascii=False))
def category(tid, pg=1, filter_dict=None, extend=None):
    result = categoryContent(tid, pg, filter_dict or {}, extend)
    print(json.dumps(result, ensure_ascii=False))
def detail(ids):
    result = detailContent(ids if isinstance(ids, list) else [ids])
    print(json.dumps(result, ensure_ascii=False))
def search(key, quick=False):
    result = searchContent(key, quick)
    print(json.dumps(result, ensure_ascii=False))
def player(flag, id, vipFlags=None):
    result = playerContent(flag, id, vipFlags or [])
    print(json.dumps(result, ensure_ascii=False))
if __name__ == '__main__':
    import sys
    action = sys.argv[1] if len(sys.argv) > 1 else 'home'
    if action == 'home':
        home()
    elif action == 'category':
        tid = sys.argv[2] if len(sys.argv) > 2 else 'videos'
        pg = sys.argv[3] if len(sys.argv) > 3 else '1'
        category(tid, pg)
    elif action == 'detail':
        ids = sys.argv[2:] if len(sys.argv) > 2 else ['fantasies-8']
        detail(ids)
    elif action == 'search':
        key = sys.argv[2] if len(sys.argv) > 2 else 'amateur'
        search(key)
    elif action == 'player':
        id = sys.argv[2] if len(sys.argv) > 2 else ''
        player('FullEroticMovies', id)
    else:
        home()