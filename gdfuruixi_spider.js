var rule = {
    title: 'GDFuruixi',
    host: 'https://www.gdfuruixi.com',
    url: '/list/fyclass.html',
    class_name: '电影&电视剧&综艺&动漫',
    class_url: '1&2&3&4',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    timeout: 5000,
    play_parse: true,
    lazy: `js:
        var html = request(input);
        var m3u8_match = html.match(/var now\\s*=\\s*"([^"]+\\.m3u8)"/); // 更宽松的正则
        var m3u8_url = m3u8_match ? m3u8_match[1] : "";
        input = {url: m3u8_url};
    `,
    一级: 'js:
        var d = [];
        var html = request(input);
        var items = html.match(/<a href="\\/gdplay\\/\\d+\\.html"[^>]*title="[^"]*"/g) || [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var url_match = item.match(/href="(\\/gdplay\\/\\d+\\.html)"/);
            var title_match = item.match(/title="([^"]*)"/);
            var pic_match = item.match(/<img[^>]+src="([^"]*)"/);
            var url = url_match ? "https://www.gdfuruixi.com" + url_match[1] : "";
            var title = title_match ? title_match[1] : "未知";
            var pic = pic_match ? pic_match[1] : "";
            if (pic && !pic.startsWith("http")) {
                pic = "https://www.gdfuruixi.com" + pic;
            }
            d.push({url: url, title: title, pic_url: pic});
        }
        setResult(d);
    ',
    二级: 'js:
        // 自定义详情页解析逻辑（示例）
        var html = request(input);
        var play_url = html.match(/var play_url\\s*=\\s*"([^"]+)"/)
