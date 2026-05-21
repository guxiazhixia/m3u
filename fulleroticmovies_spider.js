// OK影视专用版 - 完全符合CatVodTV规范
// 网站: https://www.fulleroticmovies.net/
// 保存为: fulleroticmovies_spider.js

var HOST = "https://www.fulleroticmovies.net";

function home() {
    var classes = [
        {type_id:"1", type_name:"最新"},
        {type_id:"2", type_name:"热门"},
        {type_id:"3", type_name:"最受好评"},
        {type_id:"4", type_name:"浏览最多"},
        {type_id:"5", type_name:"搜索"},
        {type_id:"/category/60s/", type_name:"60年代"},
        {type_id:"/category/70s/", type_name:"70年代"},
        {type_id:"/category/80s/", type_name:"80年代"},
        {type_id:"/category/90s/", type_name:"90年代"},
        {type_id:"/category/2000-2021-avn-award-winning-movies/", type_name:"2000+"},
        {type_id:"/category/classic/", type_name:"经典"},
        {type_id:"/category/classics/", type_name:"经典合集"},
        {type_id:"/category/plot-oriented/", type_name:"剧情"},
        {type_id:"/category/softcore/", type_name:"软调"},
        {type_id:"/category/4k-ultra-hd/", type_name:"4K超清"},
        {type_id:"/category/animation/", type_name:"动画"},
        {type_id:"/category/documentary/", type_name:"纪录片"},
        {type_id:"/category/homemade-movies/", type_name:"自制"},
        {type_id:"/category/vintage-porn/", type_name:"复古"}
    ];
    return JSON.stringify({class:classes});
}

function homeVod() {
    var html = fetch(HOST + "/videos/1/", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    }).text();
    
    var list = [];
    var start = 0;
    
    while (list.length < 20) {
        var itemStart = html.indexOf('<div class="item ">', start);
        if (itemStart === -1) break;
        
        var nextItem = html.indexOf('<div class="item "', itemStart + 1);
        var pagination = html.indexOf('<div class="pagination"');
        var itemEnd = html.length;
        
        if (nextItem !== -1 && (pagination === -1 || nextItem < pagination)) {
            itemEnd = nextItem;
        } else if (pagination !== -1 && pagination > itemStart && pagination < itemEnd) {
            itemEnd = pagination;
        }
        
        var itemHtml = html.substring(itemStart, itemEnd);
        
        // 提取视频链接 - 完整URL格式
        var linkIdx = itemHtml.indexOf('class="item-video');
        if (linkIdx === -1) { start = itemEnd; continue; }
        var hrefStart = itemHtml.indexOf('href="', linkIdx);
        if (hrefStart === -1) { start = itemEnd; continue; }
        hrefStart += 6;
        var hrefEnd = itemHtml.indexOf('"', hrefStart);
        var fullUrl = itemHtml.substring(hrefStart, hrefEnd);
        
        // 提取slug用于构建vod_id
        var slugStart = fullUrl.indexOf('/video/') + 7;
        var slugEnd = fullUrl.indexOf('/', slugStart);
        var slug = fullUrl.substring(slugStart, slugEnd);
        
        // 提取标题
        var titleIdx = itemHtml.indexOf('class="item-title"');
        var title = "";
        if (titleIdx === -1) { start = itemEnd; continue; }
        var t1 = itemHtml.indexOf('>', titleIdx);
        var t2 = itemHtml.indexOf('</', t1 + 1);
        if (t1 >= 0 && t2 >= 0) {
            title = itemHtml.substring(t1 + 1, t2).trim();
        }
        
        // 提取图片 - 优先data-original
        var img = "";
        var imgIdx = itemHtml.indexOf('data-original="', titleIdx);
        if (imgIdx === -1 || imgIdx > titleIdx + 200) {
            imgIdx = itemHtml.indexOf('src="', titleIdx - 200);
            if (imgIdx >= 0) {
                imgIdx += 5;
                var imgEnd = itemHtml.indexOf('"', imgIdx);
                img = itemHtml.substring(imgIdx, imgEnd);
                if (img.indexOf('/') === 0) img = HOST + img;
            }
        } else {
            imgIdx += 13;
            var imgEnd = itemHtml.indexOf('"', imgIdx);
            img = itemHtml.substring(imgIdx, imgEnd);
            if (img.indexOf('/') === 0) img = HOST + img;
        }
        
        list.push({
            vod_id: HOST + "/video/" + slug + "/",
            vod_name: title,
            vod_pic: img,
            vod_remarks: ""
        });
        
        start = itemEnd;
    }
    
    return JSON.stringify({list:list});
}

function category(obj) {
    var page = obj.page || 1;
    var tid = obj.id;
    
    var fullUrl;
    if (tid === "1") {
        fullUrl = HOST + "/videos/" + page + "/";
    } else if (tid === "2") {
        fullUrl = HOST + "/trending/" + page + "/";
    } else if (tid === "3") {
        fullUrl = HOST + "/top-rated/" + page + "/";
    } else if (tid === "4") {
        fullUrl = HOST + "/most-viewed/" + page + "/";
    } else {
        fullUrl = HOST + tid + page + "/";
    }
    
    var html = fetch(fullUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    }).text();
    
    var list = [];
    var start = 0;
    
    while (list.length < 100) {
        var itemStart = html.indexOf('<div class="item ">', start);
        if (itemStart === -1) break;
        
        var nextItem = html.indexOf('<div class="item "', itemStart + 1);
        var pagination = html.indexOf('<div class="pagination"');
        var itemEnd = html.length;
        
        if (nextItem !== -1 && (pagination === -1 || nextItem < pagination)) {
            itemEnd = nextItem;
        } else if (pagination !== -1 && pagination > itemStart && pagination < itemEnd) {
            itemEnd = pagination;
        }
        
        var itemHtml = html.substring(itemStart, itemEnd);
        
        // 提取视频链接
        var linkIdx = itemHtml.indexOf('class="item-video');
        if (linkIdx === -1) { start = itemEnd; continue; }
        var hrefStart = itemHtml.indexOf('href="', linkIdx);
        if (hrefStart === -1) { start = itemEnd; continue; }
        hrefStart += 6;
        var hrefEnd = itemHtml.indexOf('"', hrefStart);
        var fullLink = itemHtml.substring(hrefStart, hrefEnd);
        
        var slugStart = fullLink.indexOf('/video/') + 7;
        var slugEnd = fullLink.indexOf('/', slugStart);
        var slug = fullLink.substring(slugStart, slugEnd);
        
        // 提取标题
        var titleIdx = itemHtml.indexOf('class="item-title"');
        var title = "";
        if (titleIdx === -1) { start = itemEnd; continue; }
        var t1 = itemHtml.indexOf('>', titleIdx);
        var t2 = itemHtml.indexOf('</', t1 + 1);
        if (t1 >= 0 && t2 >= 0) {
            title = itemHtml.substring(t1 + 1, t2).trim();
        }
        
        // 提取图片
        var img = "";
        var imgIdx = itemHtml.indexOf('data-original="', titleIdx);
        if (imgIdx === -1 || imgIdx > titleIdx + 200) {
            imgIdx = itemHtml.indexOf('src="', titleIdx - 200);
            if (imgIdx >= 0) {
                imgIdx += 5;
                var imgEnd = itemHtml.indexOf('"', imgIdx);
                img = itemHtml.substring(imgIdx, imgEnd);
                if (img.indexOf('/') === 0) img = HOST + img;
            }
        } else {
            imgIdx += 13;
            var imgEnd = itemHtml.indexOf('"', imgIdx);
            img = itemHtml.substring(imgIdx, imgEnd);
            if (img.indexOf('/') === 0) img = HOST + img;
        }
        
        // 提取评分
        var rating = "";
        var ratingIdx = itemHtml.indexOf('class="item-meta"');
        if (ratingIdx !== -1) {
            var rStart = itemHtml.indexOf('<svg', ratingIdx);
            if (rStart !== -1) {
                var rStart2 = itemHtml.indexOf('>', rStart);
                if (rStart2 !== -1) {
                    var rEnd = itemHtml.indexOf('</', rStart2 + 1);
                    if (rEnd !== -1) {
                        rating = itemHtml.substring(rStart2 + 1, rEnd).trim();
                    }
                }
            }
        }
        
        list.push({
            vod_id: HOST + "/video/" + slug + "/",
            vod_name: title,
            vod_pic: img,
            vod_remarks: rating
        });
        
        start = itemEnd;
    }
    
    return JSON.stringify({
        list: list,
        page: page,
        pagecount: 100,
        limit: list.length,
        total: 10000
    });
}

function detail(obj) {
    var url = obj.url;
    var html = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    }).text();
    
    var title = "";
    var t1 = html.indexOf('<title>');
    if (t1 !== -1) {
        t1 += 7;
        var t2 = html.indexOf('</title>', t1);
        if (t2 !== -1) {
            title = html.substring(t1, t2).trim();
        }
    }
    
    var thumb = HOST + "/theme/erotic/images/loader-16x9.png";
    var j1 = html.indexOf('"thumbnailUrl"');
    if (j1 !== -1) {
        var j2 = html.indexOf(':', j1);
        var j3 = html.indexOf('"', j2 + 1);
        var j4 = html.indexOf('"', j3 + 1);
        if (j3 !== -1 && j4 !== -1) {
            var jthumb = html.substring(j3 + 1, j4);
            if (jthumb.indexOf('/') === 0) jthumb = HOST + jthumb;
            thumb = jthumb;
        }
    }
    
    var vod = {
        vod_id: url,
        vod_name: title,
        vod_pic: thumb,
        vod_play_from: "播放",
        vod_play_url: "播放$" + url
    };
    
    return JSON.stringify({list:[vod]});
}

function play(obj) {
    var url = obj.url;
    var html = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": url
        }
    }).text();
    
    var streams = [];
    var keys = ["video_url", "video_alt_url", "video_alt_url2", "video_alt_url3"];
    
    for (var i = 0; i < keys.length; i++) {
        var searchStr = keys[i] + ":'";
        var pos = html.indexOf(searchStr);
        while (pos !== -1) {
            var urlStart = pos + searchStr.length;
            var urlEnd = html.indexOf("'", urlStart);
            if (urlEnd !== -1) {
                var src = html.substring(urlStart, urlEnd);
                if (src.indexOf("get_stream") !== -1) {
                    streams.push(src);
                }
            }
            pos = html.indexOf(searchStr, urlEnd + 1);
        }
    }
    
    if (streams.length > 0) {
        return JSON.stringify({
            url: streams[streams.length - 1],
            parse: 0,
            jx: 0
        });
    }
    
    return JSON.stringify({
        url: url,
        parse: 0,
        jx: 0
    });
}

function search(obj) {
    var wd = obj.wd;
    var searchUrl = HOST + "/search/" + wd + "/";
    var html = fetch(searchUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    }).text();
    
    var list = [];
    var start = 0;
    
    while (list.length < 100) {
        var itemStart = html.indexOf('<div class="item ">', start);
        if (itemStart === -1) break;
        
        var nextItem = html.indexOf('<div class="item "', itemStart + 1);
        var itemEnd = html.length;
        if (nextItem !== -1) itemEnd = nextItem;
        
        var itemHtml = html.substring(itemStart, itemEnd);
        
        var linkIdx = itemHtml.indexOf('class="item-video');
        if (linkIdx === -1) { start = itemEnd; continue; }
        var hrefStart = itemHtml.indexOf('href="', linkIdx);
        if (hrefStart === -1) { start = itemEnd; continue; }
        hrefStart += 6;
        var hrefEnd = itemHtml.indexOf('"', hrefStart);
        var fullLink = itemHtml.substring(hrefStart, hrefEnd);
        
        var slugStart = fullLink.indexOf('/video/') + 7;
        var slugEnd = fullLink.indexOf('/', slugStart);
        var slug = fullLink.substring(slugStart, slugEnd);
        
        var titleIdx = itemHtml.indexOf('class="item-title"');
        var title = "";
        if (titleIdx === -1) { start = itemEnd; continue; }
        var t1 = itemHtml.indexOf('>', titleIdx);
        var t2 = itemHtml.indexOf('</', t1 + 1);
        if (t1 >= 0 && t2 >= 0) {
            title = itemHtml.substring(t1 + 1, t2).trim();
        }
        
        var img = "";
        var imgIdx = itemHtml.indexOf('data-original="', titleIdx);
        if (imgIdx === -1 || imgIdx > titleIdx + 200) {
            imgIdx = itemHtml.indexOf('src="', titleIdx - 200);
            if (imgIdx >= 0) {
                imgIdx += 5;
                var imgEnd = itemHtml.indexOf('"', imgIdx);
                img = itemHtml.substring(imgIdx, imgEnd);
                if (img.indexOf('/') === 0) img = HOST + img;
            }
        } else {
            imgIdx += 13;
            var imgEnd = itemHtml.indexOf('"', imgIdx);
            img = itemHtml.substring(imgIdx, imgEnd);
            if (img.indexOf('/') === 0) img = HOST + img;
        }
        
        list.push({
            vod_id: HOST + "/video/" + slug + "/",
            vod_name: title,
            vod_pic: img,
            vod_remarks: ""
        });
        
        start = itemEnd;
    }
    
    return JSON.stringify({
        list: list,
        page: 1,
        pagecount: 2,
        limit: 30,
        total: 9999
    });
}

function test() {
    return JSON.stringify({name:"fulleroticmovies", msg:"hello"});
}
