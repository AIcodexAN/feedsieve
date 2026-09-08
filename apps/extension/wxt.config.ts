import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: (env) => ({
    name: 'FeedSieve',
    short_name: 'FeedSieve',
    description: 'X 赛博清洁工：黄框标注垃圾账号，一键批量真拉黑。标注永不隐藏内容。',
    // Firefox MV3 必须显式声明扩展 ID，否则无法安装；Chrome 不识别该字段，
    // 因此只在 firefox 目标下注入。
    // strict_min_version 取 140（不是 128）：`content_scripts.world`（MAIN world
    // 的 XHR bridge 依赖它）自 128 起支持，但 `data_collection_permissions`
    // 自 140 才支持，取下限会触发 AMO linter 的 min-version 警告。
    ...(env.browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'feedsieve@feedsieve.local',
              strict_min_version: '140.0',
              // Firefox 2025-11-03 起要求新扩展声明数据采集类型，缺失则按"采集一切"
              // 向用户弹同意框。FeedSieve 不采集使用者本人的数据（社区上报是用户
              // 显式触发、且只含 handle / 分类 / 指纹哈希），故声明 none。
              data_collection_permissions: { required: ['none'] },
            },
            // Firefox for Android 到 142 才支持该字段，需单独声明，否则 linter
            // 会按 gecko 的 140 去校验 Android 并告警。
            gecko_android: { strict_min_version: '142.0' },
          },
        }
      : {}),
    permissions: ['storage'],
    host_permissions: [
      'https://x.com/*',
      // dev 模式放行本地社区 API（wrangler dev）；生产构建不包含 localhost。
      ...(env.mode === 'development' ? ['http://localhost/*'] : []),
      // 社区名单下载 + 用户黑白名单同步（Cloudflare Worker，自部署见 apps/community-api）
      'https://feedsieve-api.chendahuang.com/*',
    ],
    icons: {
      16: '/icon-16.png',
      32: '/icon-32.png',
      48: '/icon-48.png',
      64: '/icon.png',
      128: '/icon-128.png',
    },
  }),
  vite: (env) => ({
    define: {
      // dev/本地测试 API 覆盖：只在 development 构建生效（FEEDSIEVE_API_BASE=http://localhost:8787 pnpm dev）。
      // 生产构建恒为空字符串回退官方线上实例——pack-store 的 manifest 审计查不到
      // 代码内嵌地址，任何环境变量泄漏进生产 zip 都会静默指向错误 API，故此处必须按 mode 隔离。
      __FEEDSIEVE_API_BASE__: JSON.stringify(
        env.mode === 'development' ? (process.env.FEEDSIEVE_API_BASE ?? '') : '',
      ),
    },
  }),
  zip: {
    name: 'feedsieve',
  },
});
