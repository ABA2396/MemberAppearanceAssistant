# tools/ — 脚本生成与维护工具链

`member-dark.user.js` 的暗色 CSS 主体是**从站点真实样式表自动生成**的(创作中心站方颜色全部写死 hex、无语义变量,故采用 ｢逐组件类名覆盖｣ 路线,生成器对站方规则做 ｢文字灰提亮 / 背景灰阶压暗 / 品牌色保留 / 浅彩底同色相压暗｣ 的声明级映射)。站点改版后按下面流程重新生成。

## 文件

| 文件 | 作用 |
| --- | --- |
| `collect-css.js` | 经 CDP 中继收集页面(主文档 + 同源 iframe + micro-app 内联)全部样式表到 `css-dump/` |
| `css-dump/` | 站方样式表快照(生成器输入,不进版本库,用 collect-css.js 重新收集) |
| `build-dark.js` | 颜色重写生成器:读 `css-dump/` 产出 `dark-generated.css` |
| `member-dark.template.js` | 脚本模板:头部元信息、开关按钮、自愈 Observer、iframe 注入、编辑器预览默认夜间模式、手写核心兜底层 |
| `assemble.js` | 把生成的 CSS 以字符串常量嵌入模板,输出 `../member-dark.user.js` |

## 重新生成流程

前提:Chrome 开着远程调试且已登录创作中心,CDP 中继跑在 `127.0.0.1:9223`。

```sh
# 1. 收集样式表:对每类页面各跑一次(参数: 会话名, 输出标签)
node collect-css.js p4 home
# 2. 生成暗色 CSS 并组装脚本
node build-dark.js && node assemble.js
# 3. 语法检查
node --check ../member-dark.user.js
```

改动映射规则只需改 `build-dark.js` 后重跑第 2 步;改动脚本行为(开关/自愈/兜底层)改 `member-dark.template.js` 后重跑第 2 步。**每次发布 `@version` 必须递增**,否则用户端不会更新。

## 手写兜底层在哪

生成器只覆盖 ｢站方样式表里写了颜色｣ 的规则。三类盲区在模板的 `CORE_CSS` 手写兜底:输入控件 UA 默认白底、滚动条/选区、html 底色。页面级特例按 ｢哪页哪个组件｣ 注释就近加在 `CORE_CSS`。
