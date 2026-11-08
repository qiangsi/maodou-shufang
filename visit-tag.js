/* 毛豆书房 · 访客标记（tracking tag）
 * ------------------------------------------------------------------
 * 用法：在任意页面 </body> 前加两行
 *   <script src="./visit-config.js"></script>
 *   <script src="./visit-tag.js"></script>
 *
 * 采集内容：匿名访客编号、IP 掩码 + IP 归属国家/地区/城市、
 *           浏览器与版本、操作系统、设备类型、屏幕/视口、语言、时区、
 *           来源页、当前页标题与路径、访问时间。
 * 不采集：姓名、手机号、账号、Cookie 内容、完整 IP、表单内容。
 * 写入位置：云服务 public.visits 表（append-only，只有新增权限）。
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  var cfg = window.MAODOU_VISIT_CONFIG;
  if (!cfg || cfg.enabled === false) return;
  if (window.__maodouVisitSent) return;

  /* 云服务只接受「应用发布域名」作为请求来源。GitHub Pages、本地文件、
     localhost 都不在允许列表里，直接跳过，避免每次访问都打一串 403。
     把页面发布到应用域名后，下面这些判断不会命中，标记正常写入。 */
  var host = location.hostname || '';
  if (location.protocol === 'file:' || !host ||
      /(^|\.)github\.io$/i.test(host) ||
      host === 'localhost' || host === '127.0.0.1') return;

  window.__maodouVisitSent = true;

  /* ---------- 匿名编号 ---------- */
  function read(store, key) {
    try { return store.getItem(key); } catch (e) { return null; }
  }
  function write(store, key, val) {
    try { store.setItem(key, val); } catch (e) {}
  }
  function token() {
    var s = '';
    try {
      var a = new Uint8Array(8);
      (window.crypto || window.msCrypto).getRandomValues(a);
      for (var i = 0; i < a.length; i++) s += ('0' + a[i].toString(16)).slice(-2);
    } catch (e) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    return s;
  }
  var vid = read(window.localStorage, 'md_vid');
  if (!vid) { vid = 'v_' + token(); write(window.localStorage, 'md_vid', vid); }
  var sid = read(window.sessionStorage, 'md_sid');
  if (!sid) { sid = 's_' + token(); write(window.sessionStorage, 'md_sid', sid); }

  /* ---------- 浏览环境解析 ---------- */
  function parseUA(ua) {
    var u = ua || '';
    var browser = '其他', bv = '', os = '其他', osv = '', device = '桌面';
    function m(re, name, group) {
      var r = re.exec(u);
      if (r) { browser = name; bv = r[group || 1] || ''; return true; }
      return false;
    }

    if (/MicroMessenger/i.test(u)) device = '微信内打开';
    else if (/iPad|Tablet|PlayBook|Silk/i.test(u)) device = '平板';
    else if (/iPhone|iPod|Windows Phone|HarmonyOS|Mobile/i.test(u)) device = '手机';
    else device = '桌面';

    if (/HarmonyOS/i.test(u)) { os = 'HarmonyOS'; osv = (/HarmonyOS[;\s]*([\d.]+)/i.exec(u) || [,''])[1]; }
    else if (/Android/i.test(u)) { os = 'Android'; osv = (/Android[\s/]([\d.]+)/i.exec(u) || [,''])[1]; }
    else if (/iPhone|iPad|iPod/i.test(u)) { os = 'iOS'; osv = (/OS (\d+[._\d]*)/i.exec(u) || [,''])[1].replace(/_/g, '.'); }
    else if (/Windows NT 10.0/i.test(u)) { os = 'Windows'; osv = '10 / 11'; }
    else if (/Windows NT 6.3/i.test(u)) { os = 'Windows'; osv = '8.1'; }
    else if (/Windows NT 6.1/i.test(u)) { os = 'Windows'; osv = '7'; }
    else if (/Windows/i.test(u)) { os = 'Windows'; }
    else if (/Mac OS X/i.test(u)) { os = 'macOS'; osv = (/Mac OS X (\d+[._\d]*)/i.exec(u) || [,''])[1].replace(/_/g, '.'); }
    else if (/Linux/i.test(u)) { os = 'Linux'; }
    else if (/CrOS/i.test(u)) { os = 'ChromeOS'; }

    var isWechat = m(/MicroMessenger\/([\d.]+)/i, '微信');
    if (!isWechat && !m(/QQBrowser\/([\d.]+)/i, 'QQ 浏览器') &&
        !m(/UCBrowser\/([\d.]+)/i, 'UC 浏览器') &&
        !m(/Quark\/([\d.]+)/i, '夸克') &&
        !m(/Baiduspider/i, '百度', 0) &&
        !m(/Edg\/([\d.]+)/i, 'Edge') &&
        !m(/OPR\/([\d.]+)/i, 'Opera') &&
        !m(/Firefox\/([\d.]+)/i, 'Firefox') &&
        !m(/Chrome\/([\d.]+)/i, 'Chrome') &&
        !m(/Version\/([\d.]+)[\s\S]*Safari/i, 'Safari')) {
      browser = /Safari/i.test(u) ? 'Safari' : '其他';
      bv = '';
    }
    if (browser === '百度') bv = '';

    return { browser: browser, browser_version: bv, os: os, os_version: osv, device: device };
  }

  function envInfo() {
    var ua = navigator.userAgent || '';
    var e = parseUA(ua);
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (err) {}
    var dpr = window.devicePixelRatio ? (Math.round(window.devicePixelRatio * 100) / 100) : '';
    return {
      ua: ua.slice(0, 400),
      browser: e.browser,
      browser_version: e.browser_version,
      os: e.os,
      os_version: e.os_version,
      device: e.device,
      screen: (window.screen ? window.screen.width + '×' + window.screen.height : '') + (dpr ? ' @' + dpr + 'x' : ''),
      viewport: window.innerWidth + '×' + window.innerHeight,
      lang: navigator.language || navigator.userLanguage || '',
      timezone: tz,
      referrer: (document.referrer || '').slice(0, 300),
      page: (document.title || '').slice(0, 200),
      path: (location.pathname + location.search + location.hash).slice(0, 300)
    };
  }

  /* ---------- IP 归属（多源兜底，全部失败不阻塞埋点） ---------- */
  function fetchJSON(url, ms) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return; done = true; reject(new Error('timeout'));
      }, ms);
      function finish(fn, arg) {
        if (done) return; done = true; clearTimeout(timer); fn(arg);
      }
      fetch(url, { cache: 'no-store', credentials: 'omit' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (j) { finish(resolve, j); }, function (e) { finish(reject, e); });
    });
  }

  function maskIp(ip) {
    if (!ip) return '';
    if (ip.indexOf(':') !== -1) return ip.split(':').slice(0, 3).join(':') + ':****';
    var p = ip.split('.');
    if (p.length === 4) return p[0] + '.' + p[1] + '.' + p[2] + '.***';
    return ip.slice(0, 16) + '…';
  }

  function normalize(j, kind) {
    if (!j) return null;
    var o = {};
    if (kind === 1) {
      if (j.success === false) return null;
      o = { ip: j.ip, country: j.country, country_code: j.country_code, region: j.region, city: j.city,
            isp: j.connection && j.connection.isp };
    } else if (kind === 2) {
      if (!j.ip) return null;
      o = { ip: j.ip, country: j.country_name, country_code: j.country_code, region: j.region, city: j.city, isp: j.org };
    } else {
      if (!j.ip) return null;
      o = { ip: j.ip, country: j.country, country_code: j.country_code || j.country_code3,
            region: j.region, city: j.city, isp: j.organization_name };
    }
    if (!o.ip) return null;
    return {
      ip: String(o.ip || ''),
      country: String(o.country || '未知'),
      country_code: String(o.country_code || '').toUpperCase(),
      region: String(o.region || ''),
      city: String(o.city || ''),
      isp: String(o.isp || '')
    };
  }

  function lookupGeo() {
    var sources = [
      { url: 'https://ipwho.is/', kind: 1 },
      { url: 'https://ipapi.co/json/', kind: 2 },
      { url: 'https://get.geojs.io/v1/ip/geo.json', kind: 3 }
    ];
    var i = 0;
    function next() {
      if (i >= sources.length) return Promise.resolve(null);
      var s = sources[i++];
      return fetchJSON(s.url, 2600).then(function (j) {
        var r = normalize(j, s.kind);
        return r || next();
      }, next);
    }
    return next();
  }

  /* ---------- 加载 SDK 并写入 ---------- */
  function loadSDK(cb) {
    if (window.WorkBuddyCloud && window.WorkBuddyCloud.createWorkBuddyCloud) return cb(null, window.WorkBuddyCloud);
    function inject(url, fallback) {
      var s = document.createElement('script');
      s.src = url; s.async = true;
      s.onload = function () {
        if (window.WorkBuddyCloud && window.WorkBuddyCloud.createWorkBuddyCloud) cb(null, window.WorkBuddyCloud);
        else fallback();
      };
      s.onerror = function () { if (s.parentNode) s.parentNode.removeChild(s); fallback(); };
      document.head.appendChild(s);
    }
    inject(cfg.sdkCdn, function () {
      inject(cfg.sdkCdnFallback, function () { cb(new Error('cloud SDK unavailable')); });
    });
  }

  function send(geo) {
    loadSDK(function (err, WB) {
      if (err) {
        console.warn('[毛豆访客统计] 云服务脚本未能加载，本次访问未记录。', err.message);
        return;
      }
      var cloud;
      try {
        cloud = WB.createWorkBuddyCloud({
          endpoint: cfg.endpoint,
          oauthRelayBaseUrl: cfg.oauthRelayBaseUrl,
          publishableKey: cfg.publishableKey
        });
      } catch (e) {
        console.warn('[毛豆访客统计] 云服务初始化失败：', e.message);
        return;
      }
      var ev = envInfo();
      var row = {
        visitor_id: vid,
        session_id: sid,
        ip_masked: geo ? maskIp(geo.ip) : '',
        country: geo ? geo.country : '未知',
        country_code: geo ? geo.country_code : '',
        region: geo ? geo.region : '',
        city: geo ? geo.city : '',
        isp: geo ? geo.isp : '',
        ua: ev.ua,
        browser: ev.browser,
        browser_version: ev.browser_version,
        os: ev.os,
        os_version: ev.os_version,
        device: ev.device,
        screen: ev.screen,
        viewport: ev.viewport,
        lang: ev.lang,
        timezone: ev.timezone,
        referrer: ev.referrer,
        page: ev.page,
        path: ev.path
      };
      try {
        Promise.resolve(cloud.database.from('visits').insert(row)).then(function (res) {
          if (res && res.error) {
            console.warn('[毛豆访客统计] 写入被拒绝：', res.error.message || res.error.code || res.error);
          }
        }, function (e) {
          console.warn('[毛豆访客统计] 写入失败（若页面不在应用发布域名下，多为来源校验）：', e && (e.message || e));
        });
      } catch (e) {
        console.warn('[毛豆访客统计] 写入异常：', e.message);
      }
    });
  }

  function start() {
    var geoDone = false;
    var fallback = setTimeout(function () {
      if (!geoDone) { geoDone = true; send(null); }
    }, 3200);
    lookupGeo().then(function (geo) {
      if (geoDone) return;
      geoDone = true; clearTimeout(fallback); send(geo);
    }, function () {
      if (geoDone) return;
      geoDone = true; clearTimeout(fallback); send(null);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
