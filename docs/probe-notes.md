# member.bilibili.com 暗色模式 M0 探查笔记

数据:`raw-p1..11.json`(probe 全量)、`probe2-*.json`(布局树)、`probe3/4-*.json`(样式统计)、`css-dump/`(26 张壳 CSS 1.1MB + 4 张 b-style 主题 CSS)。实验:每会话注入 `<style id=member-dark-probe>` 改变量后读 computed,用完即删,全部成功移除。

## 一、全局判别与机制

- 壳:Vue 2.6.14 + webpack(`webpackChunkcreativecenter_v3`),history 路由 SPA。**同 URL 标签页状态可不同**:p11 比 p1 多 3 张 chunk CSS,且 html 残留收益中心子应用设置的 `data-device=3`/`font-size:23.4375px`(子应用改 html 全局属性且卸载不还原)——SPA 内切页痕迹,不能当主题信号,也不能假设固定 chunk 集。
- html/body 无主题类、无主题 data 属性(body 固定 `risk-captcha-adapt-pc risk-captcha-adapt`)。无 prefers-color-scheme 规则。
- 骨架固定:`#app.app_wrap > .cc-header + #root.ct-root`;左导航 `#cc-nav_wrap.cc-nav-wrp`(simplebar 滚动);`.nav-upload-container`;内容 `#cc-body.cc-body`(`is-layout`/`income`/`cc-body-microapp-wrap` 修饰)+ `.side-utils`;弹层(`el-popover`/`#message-notice`)挂 body 直下。
- 三种载体:① 主文档壳(全部页);② micro-app 微前端 light DOM 无 shadow,scoped 隔离=选择器被改写为 `micro-app[name=video-up]`/`[name=allowance-incomeCenter]` 前缀(p5/p8、p7);③ 同源 iframe:p3/p9 `york/read-editor`(1718x877)、p6 `york/opus/management`、p10 `york/read-draft`。
- 主题痕迹(`html.night-mode` 规则,由 micro-app 动态注入,探查可见性随时机波动):
  - p7 收益中心子应用 43 条,42 条实质配色:`html.night-mode body` 背景 #0d0d0e、卡片 #242628、分割线 #303132、文字 #e6e7e9/#fff、次要 #5d6166、浮层 rgba(72,76,83,.9)、强调 #d44e7d。**加 night-mode 类即可暗收益中心主体**。
  - p5/p8 视频上传子应用 8 条 + 壳 chunk-2378 内 8 条:全是 `.dark-img` 滤镜(saturate 85%/brightness 97%),无配色。
  - 壳本身(cc-header/nav/管理页)无任何 night 配色。
- b-style 主题体系(编辑器 iframe 引入 `s1.hdslb.com/bfs/seed/jinkela/short/b-style/theme/`):`light.css`=`:root` 定义 `--Ga0..13`/`--Wh*`/`--Ba*`/`--Pi*` 全语义色板;`map.css`=`--bg1/--text1/--brand_blue` 等别名指向 Ga 变量;`light_u.css`=u 后缀副本;`dark.css` 存在(HTTP 200,选择器 `html.bili_dark`,382 个暗色变量,可下载内嵌进脚本)。**但创作中心全部 CSS 对这些 var 的消费为 0**,纯属顺带加载。
- 环境干扰:Dark Reader 活跃(注入 `--darkreader-*`),SponsorBlock(`--sb-category-*`),沉浸式翻译(html data 属性)。页面真实定义的 custom property 100% 来自这些扩展。

## 二、Token 表

| 变量 | 值/来源 | 语义 | 改值生效? |
|---|---|---|---|
| `--Ga1`/`--bg1`/`--text1`/`--primary` 等 b-style 语义变量 | 仅 light.css/dark.css 定义,创作中心 0 消费 | 主站灰阶/背景/文字 | 否(实验:11 页+iframe 注入 red,computed 确认注入成功,代表元素渲染色全部不变) |
| `--focus-ol` | 2px solid #4dab2fa6(壳 chunk-2378,组件局部) | 焦点轮廓 | 仅影响焦点 outline |
| `--disabled-op/-bg-c/-bd-c` | .5 / #f5f5f5 / #ccd0d7(同上) | 禁用态 | 仅禁用态 |
| `--circle-padding`/`--transition-t`/`--tips-width`/`--icon-c`/`--url` | 各组件局部 | 布局小变量 | 不涉色彩 |
| `--sb-*`/`--darkreader-*` | SponsorBlock/Dark Reader 注入 | 扩展自有 | 与站方无关 |

结论:站方零语义色变量,颜色全部写死。高频色:主蓝 #00a1d6(x210)/#00b5e5、品牌蓝 #00aeec、主文字 #18191c/#212121/#222、次文字 #61666d/#757575/#9499a0/#99a2aa、边框 #e3e5e7/#ccd0d7/#e5e9ef/#e7e7e7、底色 #fafafa/#f6f7f8/#f1f2f3/#f4f4f4/#fff。收益中心 night 暗值见上,可直接当映射表参考。

## 三、逐页问题清单

| 页 | 容器/载体 | 难度 | 要点 |
|---|---|---|---|
| p1/p11 稿件管理 | 壳 `.upload-manage`、`#tab-container.new-link-top-container`、bcc-pagination | 易 | 纯类名覆盖,表格/选项卡量大;p11 证明同 URL 状态可不同 |
| p2 评论管理-文章 | `.comment_wrap`(commet_header/operate_wrap/section-list_wrap/bcc-pagination) | 易 | 常规列表 |
| p3 图文编辑-已有稿 | 壳 `.upload-wrap-full-screen` + 同源 iframe `york/read-editor` | 中 | iframe 内 eva3-* 工具栏、`.publish-footer`、vui_button;需 all_frames 双文档注入;富文本内容区是用户内容勿反转 |
| p9 图文编辑-新建 | 同 p3(无 aid) | 中 | 与 p3 完全同构 |
| p4 首页 | `.home-wrap`:`#chief_recommend`/data-card/interact-bill/bill-rank/material-wrp/`open-screen` | 易-中 | 卡片多但常规 |
| p5 视频上传 | micro-app[name=video-up] `.york_videoup_wrapper`,70 张表 | 中 | 选择器带 `micro-app[name=video-up]` 前缀;night-mode 只带 dark-img 滤镜;上传进度/拖拽区特殊控件多 |
| p8 视频上传 | 与 p5 探查结果逐字段一致 | 中 | 同 p5 |
| p6 图文稿件管理 | `.opus.content > .iframe-comp-container` > 同源 iframe `/opus/management`(`.opus-management__tabs/__content/.opus-list`) | 易-中 | iframe 内独立文档 |
| p7 收益中心 | micro-app[name=allowance-incomeCenter](york/income,H5 rem 页,html font-size 被改) | 中 | **night-mode 43 条暗色规则现成**,加类即暗主体;壳不变仍需覆盖;加类副作用(持久化/重渲染)待 M1 验证 |
| p10 图文创作选择 | `.upload-wrap` + 同源 iframe `/york/read-draft`(creation-guide/new-creation/draft-list) | 易-中 | iframe 内独立文档 |

## 四、路线结论

- **变量重映射:不可行(低)**。站方无语义变量、CSS 不消费 var(实验实证改值无任何 UI 变化)。b-style 的 dark.css(`html.bili_dark`)虽是现成暗色 token,但仅可作脚本自建变量体系的原料。
- **唯一可行:逐组件类名覆盖(中高可行)**。公共壳 + `bcc-*`/`vui_button`/`eva3-*` 组件库选择器可复用,覆盖大部分界面;颜色映射表用上文高频色 + 收益中心 night 暗值。
- 捷径:p7 直接 `html.classList.add('night-mode')` 激活现成暗色(42 条配色),省一个整页;p5/p8 加同类可白得 `.dark-img` 图片滤镜。
- 需特例/注意:① micro-app 选择器前缀;② 同源 iframe 需 `@match member.bilibili.com/*` + all_frames;③ 弹层挂 body 直下,选择器不能局限 `#cc-body`;④ html 残留 font-size/data-device 不是主题信号;⑤ SPA 动态加载 chunk/子应用,需 MutationObserver 持续兜底,不能一次注入;⑥ 用户环境 Dark Reader 活跃,应检测 `--darkreader-*` 并提示对本域关闭,避免双重暗色打架;⑦ 富文本编辑内容区(p3/p9 iframe 的 `.content`)不宜盲目反转。
