var rule = {
  title: '低端影视',
  host: 'https://ddys.pro',
  url: '/vodshow/fyclass-fyfilter/page/fypage.html',
  searchUrl: '/vodsearch/**/fyfilter/page/fypage.html',
  filterable: 1,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Referer': 'https://ddys.pro/'
  },
  timeout: 6000,

  // 分类解析（修正后的选择器）
  class_parse: '.nav-link;a&&Text;a&&href;/vodshow/([^/]+)/',

  // 列表页解析（适配新版DOM）
  list_parse: `
    let items = [];
    $('.module-item').each(function() {
      let $el = $(this);
      let title = $el.find('.module-title a').text().trim();
      let pic = $el.find('.module-pic img').attr('data-src') || $el.find('img').attr('data-src');
      let id = $el.find('a').attr('href').match(/\\/movie\\/(\\d+)\\//)[1];
      items.push({
        title: title,
        pic_url: pic,
        desc: $el.find('.module-info-text').text(),
        url: '/movie/' + id + '/'
      });
    });
    setResult(items);
  `,

  // 详情页解析（优化正则匹配）
  detail: `
    let html = request(input);
    let playerData;
    try {
      playerData = JSON.parse(html.match(/var player_\\w+\\s*=\\s*(\$$.*?\$$);/)[1]);
    } catch (e) {
      playerData = [];
    }
    let playList = [];
    playerData.forEach(source => {
      (source.urls || []).forEach(url => {
        playList.push({
          name: (source.name || '') + ' ' + (url.name || ''),
          url: url.url.replace(/quark\\.cn/, 'pan.quark.cn'),
          type: 'direct'
        });
      });
    });
    setResult({
      title: $('h1.page-title').text().trim(),
      pic: $('.detail-pic img').attr('src'),
      content: $('.detail-content').text().trim(),
      play_url: playList
    });
  `,

  // 搜索功能（适配新版搜索页）
  search: `
    let html = request(input);
    let $ = parseDOM(html);
    let items = [];
    $('.module-search-item').each(function() {
      let $el = $(this);
      items.push({
        title: $el.find('.video-info-header a').text(),
        url: $el.find('a').attr('href'),
        pic: $el.find('img').attr('data-src'),
        desc: $el.find('.video-info-header .tag').text()
      });
    });
    setResult(items);
  `
};
