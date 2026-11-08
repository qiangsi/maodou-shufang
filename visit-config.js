/* 毛豆书房 · 访客统计配置
 * ------------------------------------------------------------------
 * 下面三行来自 WorkBuddy 云服务的 publicConfig，属于「可放在前端」的公开配置，
 * 不是密钥：publishableKey 只标识应用，服务端还会校验请求来源。
 * 如果应用重新开通了云服务，请同步更新这三行。
 *
 * viewKey：看板打开口令（默认 maodou2026），改成自己的即可。
 * 注意：这是「轻量遮挡」，只挡随手点开的人，不是服务端鉴权 ——
 *       看板链接不要公开转发。需要真正私密请再加登录。
 *
 * 想临时关闭统计：把 enabled 改成 false（或删掉页面里的 visit-tag.js 引用）。
 * ------------------------------------------------------------------ */
window.MAODOU_VISIT_CONFIG = {
  enabled: true,
  site: 'maodou-shufang',

  endpoint: 'https://mp-api.app.workbuddy.host',
  oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
  publishableKey: 'wbpk_YTDWIYKQd1P7fPf1xk6GbA_TSc3sNZX28tWs6wjpkCBVm5SYYeo9hTN',

  sdkCdn: 'https://cdn.jsdelivr.net/npm/@tencent-ai/workbuddy-cloud-sdk@dev/lib/index.global.js',
  sdkCdnFallback: 'https://unpkg.com/@tencent-ai/workbuddy-cloud-sdk@dev/lib/index.global.js',

  viewKey: 'maodou2026'
};
