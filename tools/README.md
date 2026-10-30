# tools/ — 脚本维护工具

`member-dark.user.js` 的暗色主体由脚本内的**动态映射引擎**在运行时生成:遍历页面(含同源 iframe、shadow、adopted 表)全部样式表,逐声明跑 ｢文字灰提亮 / 背景灰阶压暗 / 品牌色保留 / 浅彩底同色相压暗｣ 的颜色变换并注入改写规则;MutationObserver 监听新增样式表增量处理。站方改版新增的样式天然被引擎接住,**不需要收集样式表或重新生成映射**。

## 文件

| 文件 | 作用 |
| --- | --- |
| `member-dark.template.js` | 脚本本体:颜色变换函数、动态映射引擎、开关按钮、自愈 Observer、手写核心兜底层 |
| `theme-dark.css` | 主站 night-mode 语义变量色板(382 个 `--Ga*`/`--text1` 等值的数据文件,不随站方改版变) |
| `assemble.js` | 把变量表编译成 `html:root{... !important}` 注入模板,输出 `../member-dark.user.js` |

## 维护流程

```sh
# 改模板(引擎逻辑/色板/CORE 兜底)或变量表后:
node assemble.js && node --check ../member-dark.user.js
```

**每次发布 `@version` 必须递增**,否则用户端 Tampermonkey 不会更新。

## 改什么在哪改

- **某页某个组件颜色不对**:站方规则被通用变换误判时,在模板 `CORE_CSS` 按 ｢哪页哪个组件｣ 注释就近加覆盖条目(图表 canvas 反色、Ant Design 输入框等既有先例)。
- **整体色感不对**(全部卡片太暗/太亮、文字对比不足):调 `mapColor` 一带的阈值与色板(`darkBg`/`darkText`/`darkTint`),全站生效。
- **新页面整体亮色**:通常是新域名/新路由不在 `@match` 或 `collect` 时跨域表 fetch 失败,查控制台与 `fetched` 缓存。

## 引擎的已知边界

- 跨域样式表(`s1.hdslb.com`)的 `cssRules` 读不到,引擎用 `fetch` 拉文本后借临时 `<style>` 让浏览器解析;hdslb 静态域已实测带 CORS 允许,fetch 失败的表会被跳过并记入缓存不再重试。
- `@import` 指向的跨域表无法展开(站方打包产物少用)。
- CSS 变量(站方 `var()` 引用)不做静态求值;站方语义变量的暗色换肤由 `theme-dark.css` 编译出的 `html:root` 全量变量表整体覆盖。
