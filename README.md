# 创作中心暗色模式助手

给 B 站创作中心([member.bilibili.com](https://member.bilibili.com))加一个可开关的暗色模式,单文件油猴脚本,无任何外部依赖。色板沿用 B 站主站 night-mode 的变量体系,观感与主站夜间模式一致。

## 覆盖范围

仅适配以下创作中心页面,未列出的页面不保证效果:

| 页面 | 路径 |
| --- | --- |
| 首页 | `/platform/home` |
| 稿件管理 | `/platform/upload-manager/ep`、`/platform/upload-manager/opus`、`/platform/upload-manager/audience-zimu` |
| 评论管理 | `/platform/comment/article` |
| 图文创作/编辑 | `/platform/upload/text/new-article`、`/platform/upload/text/new-edit` |
| 视频上传 | `/platform/upload/video/frame` |
| 数据中心 | `/platform/data-up/index`、`/platform/data-up/video/` |
| 粉丝管理 | `/platform/fans/manage` |
| 互动管理 | `/platform/inter-active/danmu`、`/platform/inter-active/filter`、`/platform/inter-active/feedback/report` |
| 收益中心 | `/platform/allowance/incomeCenter/pc` |
| 创作激励 | `/platform/allowance/excitation/pc` |
| 充电管理 | `/platform/allowance/upower-manage/home`、`/platform/allowance/upower-manage/multiple-level`、`/platform/allowance/upower-manage/v2/*` |
| UP 动画数据中心 | `/platform/allowance/upanimation/data-center` |
| 社区公约 | `/platform/convention/` |
| 创作设置 | `/platform/setting` |

图表、图片、视频内容本身不做反色处理(整页 `filter: invert` 会毁掉封面与图表)。

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展;
2. 打开脚本 raw 链接 <https://raw.githubusercontent.com/ABA2396/MemberAppearanceAssistant/main/member-dark.user.js>,确认安装即可;
3. 创作中心页面左下角出现 ｢暗｣ 悬浮按钮,点击切换亮/暗,按住可拖动位置(自动记忆),状态记在 `localStorage`,缺省开启。

## 使用提示

- 脚本会检测 [Dark Reader](https://darkreader.org/),它与本脚本同时开启会双重暗色打架,检测到时会在按钮悬停提示与控制台警告,建议对 `member.bilibili.com` 关闭 Dark Reader;
- 同源 iframe(图文编辑器、稿件列表、创作选择)由 Tampermonkey 按 `@match` 自动注入,开关状态跨 frame 同步。

## 维护与重新生成

站方颜色全部写死 hex 且无语义变量,脚本主体 CSS 由 `tools/` 的生成器对站方真实样式表做声明级颜色映射自动产出(文字灰提亮、背景灰阶压暗、品牌色保留、浅彩底同色相压暗、`b-style` 语义变量整体换肤)。站点改版后的维护流程见 [tools/README.md](./tools/README.md),页面探查结论与判别点见 [docs/probe-notes.md](./docs/probe-notes.md)。

## 已知问题与改版风险

- 本脚本按当前站点的 DOM 结构与样式编写,站点改版可能随时失效;
- 图标若为白色位图/SVG 背景(非字体),暗底下可能对比不足;
- 若某页面出现文字看不清、色块异常,欢迎提 issue 并附截图与页面路径。

## License

[AGPL-3.0](./LICENSE)。
