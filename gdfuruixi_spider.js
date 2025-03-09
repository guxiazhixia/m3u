var rule = {
    title: 'GDFuruixi',
    host: 'https://www.gdfuruixi.com',
    url: '/list/fyclass.html',
    class_name: '电影&电视剧&综艺&动漫',
    class_url: '1&2&3&4',
    headers: {'User-Agent': 'Mozilla/5.0'},
    timeout: 5000,
    play_parse: true,
    lazy: `js:
        var html = request(input);
        var m3u8_match = html.match(/var now="([^"]*\\.m3u8)"/);
        var m3u8_url = m3u8_match ? m3u8_match[1] : "";
        input = {url: m3u8_url};
    `,
    一级: 'js:
        let d = [];
        let html = request(input);
        let items = html.match(/<a href="\\/gdplay\\/\\d+\\.html".*?>/g) || [];
        items.forEach(item => {
            let url_match = item.match(/href="(\\/gdplay\\/\\d+\\.html)"/);
            if (!url_match) return;
            let url = "https://www.gdfuruixi.com" + url_match[1];
            let title_match = item.match(/title="(.*?)"/);
            let title = title_match ? title_match[1] : "未知";
            let pic_match = item.match(/<img[^>]*src="(.*?)"/);
            let pic = pic_match ? pic_match[1] : "";
            if (pic && !pic.startsWith("http")) {
                pic = "https://www.gdfuruixi.com" + pic;
            }
            d.push({
                url: url,
                title: title,
                pic_url: pic
            });
        });
        setResult(d);
    ',
    二级: '*'
};