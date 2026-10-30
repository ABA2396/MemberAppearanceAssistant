// ==UserScript==
// @name         创作中心暗色模式助手
// @namespace    uye.member-dark
// @author       uye
// @version      0.3.0
// @description  给 B 站创作中心(member.bilibili.com)加可开关的暗色模式:运行时对站方样式表逐声明做亮→暗映射(改版自适应,无需跟随站方重新生成),左下角 ｢暗｣ 按钮切换,状态存 localStorage;色板沿用主站 night-mode 变量体系。
// @match        https://member.bilibili.com/*
// @match        https://message.bilibili.com/pages/nav/*
// @updateURL    https://raw.githubusercontent.com/ABA2396/MemberAppearanceAssistant/main/member-dark.user.js
// @downloadURL  https://raw.githubusercontent.com/ABA2396/MemberAppearanceAssistant/main/member-dark.user.js
// @license      GNU AGPLv3
// @run-at       document-idle
// @grant        none
// ==/UserScript==
(function () {
    'use strict';

    const THEME_VARS = ''; // __THEME_VARS__(assemble 时整行替换,勿动格式)

    const STYLE_ID = 'member-dark-style';
    const BTN_ID = 'member-dark-toggle';
    const KEY = 'memberDarkOn';
    // 同源 iframe(图文编辑器/稿件管理/创作选择)与顶层共用一套样式与开关状态;
    // 信封弹层(message.bilibili.com 域 iframe)跨域不共享 localStorage,按缺省开启注入
    const IS_TOP = window.top === window.self;

    // ---------------- 亮→暗颜色变换(声明级,色板基准为主站 night-mode) ----------------
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    function hexToRgb(hex) {
        let h = hex.slice(1);
        if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
        if (h.length === 8) h = h.slice(0, 6); // alpha 另行保留
        const n = parseInt(h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const toHex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
    // 相对感知亮度(近似 Rec.601,够用于分类)与饱和度(max-min)
    const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = ([r, g, b]) => Math.max(...[r, g, b]) - Math.min(...[r, g, b]);

    // 背景亮灰阶压到 13..80 的暗层次,层距放大 1.35 保住 ｢底<卡片<边框｣ 的明暗关系
    function darkBg(rgb) {
        const L = lum(rgb);
        const newL = clamp(13 + (255 - L) * 1.35, 13, 80);
        return toHex(newL, newL, newL);
    }
    // 文字灰处理:深灰字(原在白底)提亮成暗色次文字;白/浅字保留——它们只出现在彩色或深色底上
    // (按钮/标签/选中态),压暗必误伤,且浅字留在暗底照样可读
    function darkText(rgb) {
        const L = lum(rgb);
        if (L <= 55) return toHex(231, 233, 235);            // #18191c 一类主文字 → #E7E9EB
        const t = (L - 55) / 75;                              // #61666d 一类 → 插值到次文字
        return toHex(231 - t * 56, 233 - t * 55, 235 - t * 53);
    }
    // 浅彩色底(如选中态浅蓝)→ 同色相压暗
    function darkTint(rgb) {
        const [r, g, b] = rgb;
        const L = lum(rgb);
        const k = 0.22; // 压暗比例
        return toHex(r * k + 30 * (1 - k), g * k + 33 * (1 - k), b * k + 36 * (1 - k));
    }
    function darkTintA(rgb, a) {
        const t = darkTint(rgb).slice(1).match(/../g).map(h => parseInt(h, 16));
        return a < 1 ? `rgba(${t[0]},${t[1]},${t[2]},${a})` : `rgb(${t[0]},${t[1]},${t[2]})`;
    }
    // 精确映射:未被启发式覆盖的高频杂色直接对号
    const EXACT = {
        '#00a1d6': '#00a1d6', '#00b5e5': '#23ade5', '#00aeec': '#23ade5',
    };
    // 判断声明是文字语境还是背景/边框语境
    const TEXT_PROPS = /^(color|caret-color|-webkit-text-fill-color|fill|stroke)$/;

    function mapColor(prop, val) {
        return val
            // hex(#fff/#ffffff/#ffffff80):8/4 位带 alpha,替换时必须保留
            .replace(/#[0-9a-fA-F]{3,8}\b/g, (m) => {
                let hex = m.slice(1);
                if (hex.length === 3 || hex.length === 4) hex = [...hex].map(c => c + c).join('');
                let a = 1;
                if (hex.length === 8) { a = parseInt(hex.slice(6, 8), 16) / 255; hex = hex.slice(0, 6); }
                const rgb = hexToRgb('#' + hex);
                const key = '#' + hex.toLowerCase();
                const L = lum(rgb), S = sat(rgb);
                const alphaSuffix = a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : ''; // 转两位 hex alpha 保留原透明度(如 0.85→d9),拼成合法的 #RRGGBBAA
                if (a < 0.5) {
                    // 低透明染色层:灰阶遮罩(阴影/分隔)在暗底自然,保留;彩色染色暗底上几乎不可见,提 alpha 找回存在感
                    if (S >= 30) return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Math.min(a * 3, 0.35).toFixed(2)})`;
                    return m;
                }
                if (EXACT[key]) return EXACT[key] + alphaSuffix;
                if (S < 30) { // 灰阶
                    if (TEXT_PROPS.test(prop)) {
                        if (L >= 130) return m; // 白/浅字保留(彩底/深底上的文字,压暗必误伤)
                        return darkText(rgb) + alphaSuffix;
                    }
                    if (L >= 200) {
                        // 纯白统一映射到卡片档 #17181A:hex 与 rgb() 两种写法必须同档,
                        // 否则同页同色不同写法会出现灰度差与拼接分界
                        if (L >= 253) return '#17181A' + alphaSuffix;
                        return darkBg(rgb) + alphaSuffix;
                    }
                    return m; // 中深灰的非文字语境(少见)保留
                }
                if (L > 215 && S < 60) return darkTintA(rgb, a); // 浅彩色底
                return m; // 品牌色/强调色保留
            })
            // rgba()/rgb()
            .replace(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)/g, (m) => {
                const nums = m.match(/[\d.]+/g).map(Number);
                const [r, g, b] = nums, a = nums.length > 3 ? nums[3] : 1;
                const rgb = [r, g, b], L = lum(rgb), S = sat(rgb);
                if (a < 0.5 && S >= 30) return `rgba(${r},${g},${b},${Math.min(a * 3, 0.35).toFixed(2)})`;
                if (S < 30) {
                    if (TEXT_PROPS.test(prop)) {
                        if (L >= 130) return m; // 白/浅字保留(彩底/深底上的文字,压暗必误伤)
                        return darkText(rgb);
                    }
                    if (r > 235) {
                        // 白/近白按原 alpha 分流:a≥0.95 是实心底——误减淡会在暗色下多层叠加成灰块与
                        // 拼接分界;档位与 hex 分支一致(L≥253→#17181A,其余走连续灰阶),
                        // 同一颜色 rgb() 与 hex 两种写法才不会出现灰度差。
                        // a<0.95 才是真遮罩/高光,减淡保留
                        if (a >= 0.95) return L >= 253 ? '#17181A' : darkBg(rgb);
                        return `rgba(255,255,255,${(a * 0.08).toFixed(2)})`;
                    }
                    if (L >= 200) {
                        const d = darkBg(rgb).slice(1).match(/../g).map(h => parseInt(h, 16));
                        return `rgba(${d[0]},${d[1]},${d[2]},${a})`;
                    }
                    return m;
                }
                if (L > 215 && S < 60) return darkTintA(rgb, a); // 浅彩色底
                return m;
            });
    }

    // 逐声明映射,返回 ｢发生了变化｣ 的声明(避免输出全量重复规则)
    function mapDeclarations(body) {
        const out = [];
        for (const decl of body.split(';')) {
            const i = decl.indexOf(':');
            if (i < 0) continue;
            const prop = decl.slice(0, i).trim();
            const val = decl.slice(i + 1).trim();
            if (!prop) continue;
            if (val.includes('url(')) {
                // 复合背景(颜色+base64 占位图等):整条跳过会连底色一起丢(如封面托底
                // .cover-wrp 的 #f1f3f7 url(data:...) 亮托在暗页刺眼);url 部分保留在
                // 站方原 shorthand 不动,只把颜色 token 映射成独立 background-color 声明
                if (/^background(-image)?$/.test(prop)) {
                    const toks = val.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d+[^)]*\)/g) || [];
                    for (const tok of toks) {
                        const nv = mapColor('background-color', tok);
                        if (nv !== tok) { out.push(`background-color: ${nv}`); break; }
                    }
                }
                continue;
            }
            if (val.startsWith('var(')) continue;
            if (!/[#r]/.test(val)) continue; // 快速筛:无 hex 无 rgb 的声明跳过
            const nv = mapColor(prop, val);
            if (nv && nv !== val) out.push(`${prop}: ${nv}`);
        }
        return out;
    }

    // ---------------- 动态映射引擎:遍历页面样式表,生成改写规则 ----------------
    // 站方颜色全部写死 hex、壳不消费任何 CSS 变量,故对 ｢任意样式表输入｣ 做声明级
    // 映射即可整体换肤;站方改版/换页新增的样式表由 Observer 驱动增量处理,无需重新发布
    const outputs = new Map();   // 表 → 生成的暗色规则文本(关闭开关只清空注入,不丢映射缓存)
    const sheetSig = new WeakMap(); // 表 → 内容指纹;内容没变就跳过(cssinjs 表运行时会增删规则)
    const fetched = new Map();   // 跨域表 href → 提取的规则文本(fetch 一次即够,文件名带版本 hash)
    const seenRule = new Set();  // 输出规则去重(跨表重复的组件规则常见)
    let dirty = false;

    // @media/@supports 只处理一层嵌套(与站方产物形态一致);@import 指向的同域表在
    // styleSheets 里不出现,这里展开文本;跨域 @import 读不到,忽略(站方打包产物少用)
    function extractTexts(rules) {
        const out = [];
        for (const r of rules) {
            if (r.cssRules && (r.media || r.conditionText)) {
                const inner = extractTexts(r.cssRules);
                if (inner.length) out.push('@' + (r.media ? 'media ' + r.media.text : r.conditionText) + '{' + inner.join('') + '}');
            } else if (r.type === 3 && r.styleSheet) {
                try { out.push(...extractTexts(r.styleSheet.cssRules)); } catch (e) {}
            } else if (r.selectorText && r.style) {
                out.push(r.cssText);
            }
        }
        return out;
    }

    // 跨域表 cssRules 抛 SecurityError:借 ｢临时 style 元素｣ 让浏览器原生解析文本后读回
    function parseCssRules(text) {
        const st = document.createElement('style');
        st.textContent = text;
        document.head.appendChild(st);
        try { return extractTexts(st.sheet.cssRules); } finally { st.remove(); }
    }

    // 括号配对拆顶层规则(编译期处理,最多 @media 一层嵌套)
    function* topRules(css) {
        let depth = 0, start = 0, braceStart = -1;
        for (let i = 0; i < css.length; i++) {
            const c = css[i];
            if (c === '{') { if (depth === 0) braceStart = i; depth++; }
            else if (c === '}') {
                depth--;
                if (depth === 0) {
                    yield [css.slice(start, braceStart).trim(), css.slice(braceStart + 1, i)];
                    start = i + 1;
                }
            }
        }
    }

    function mapCssText(ruleText) {
        const i = ruleText.indexOf('{');
        if (i < 0) return '';
        const head = ruleText.slice(0, i).trim();
        const body = ruleText.slice(i + 1, ruleText.lastIndexOf('}'));
        if (head.startsWith('@')) {
            if (!/^@media|^@supports/.test(head)) return '';
            let inner = '';
            for (const [, rText] of topRules(body)) inner += mapCssText(rText);
            return inner ? head + '{' + inner + '}' : '';
        }
        if (head.includes('@keyframes') || body.includes('@')) return '';
        const decls = mapDeclarations(body);
        if (!decls.length) return '';
        // 同选择器同声明的规则跨表重复常见,输出只保留一份
        const key = head + '{' + decls.join(';');
        if (seenRule.has(key)) return '';
        seenRule.add(key);
        return head + '{' + decls.join(';') + '}';
    }

    function mapRules(texts) {
        let out = '';
        for (const t of texts) out += mapCssText(t);
        return out;
    }

    async function processSheet(ss) {
        if (!ss) return;
        if (ss.href) {
            if (outputs.has(ss.href) || fetched.has(ss.href)) return;
            let texts;
            try { texts = extractTexts(ss.cssRules); } catch (e) { texts = null; }
            if (texts === null) {
                texts = [];
                try {
                    const res = await fetch(ss.href, { credentials: 'omit' });
                    if (res.ok) texts = parseCssRules(await res.text());
                } catch (e) {}
                fetched.set(ss.href, texts); // 失败也记空,避免反复拉同一张表
            }
            const out = mapRules(texts);
            if (out) { outputs.set(ss.href, out); dirty = true; }
            return;
        }
        // 内联/构造表(cssinjs、micro-app 内联):按内容指纹去重,同一张表内容变化后重映射
        let rules;
        try { rules = ss.cssRules; } catch (e) { return; }
        if (!rules || !rules.length) return;
        const texts = extractTexts(rules);
        if (!texts.length) return;
        const sig = texts.length + ':' + texts.join('').length + ':' + (texts[0] || '').slice(0, 60) + (texts[texts.length - 1] || '').slice(-60);
        if (sheetSig.get(ss) === sig && outputs.has(ss)) return;
        sheetSig.set(ss, sig);
        const out = mapRules(texts);
        if (out) { outputs.set(ss, out); dirty = true; }
    }

    function* iterSheets() {
        for (const ss of document.styleSheets) yield ss;
        for (const ss of document.adoptedStyleSheets || []) yield ss;
        // shadow 内的表(eva3 编辑器组件等)不在 document.styleSheets 里
        for (const el of document.querySelectorAll('body *')) {
            const sr = el.shadowRoot;
            if (sr) {
                for (const ss of sr.styleSheets) yield ss;
                for (const ss of sr.adoptedStyleSheets || []) yield ss;
            }
        }
    }

    let scanTimer = null, scanning = false;
    function scheduleScan() {
        if (!darkOn || scanTimer) return;
        scanTimer = setTimeout(runScan, 300);
    }
    async function runScan() {
        scanTimer = null;
        if (scanning) return;
        scanning = true;
        try {
            dirty = false;
            const jobs = [];
            for (const ss of iterSheets()) jobs.push(processSheet(ss));
            await Promise.all(jobs);
            if (dirty) replay();
        } finally { scanning = false; }
    }

    // ---------------- 手写核心层:引擎之外的通用兜底 ----------------
    const CORE_CSS = [
        // html 底色兜底,防止长页面/弹层遮罩外露白;滚动条用标准 scrollbar-color——
        // ::-webkit-scrollbar 在部分同源 iframe 的根滚动条上不生效,标准属性全文档一致
        'html { background: #0d0d0e !important; scrollbar-color: #2f3134 transparent; }',
        // 输入控件兜底:压掉 UA 默认白底即可,底色透明自适应容器亮度(实底固定值在不同
        // 亮度的容器上必然有的突兀);站方组件原生 ｢透明底+描边｣ 观感得以保留。
        // select/option 例外保实底,防原生下拉列表透叠
        'input[type="text"], input[type="search"], input[type="number"], input[type="password"],'
        + ' input[type="email"], input[type="tel"], input[type="url"], input[type="date"], textarea'
        + ' { background: transparent; color: #e7e9eb; border-color: #2f3134; }',
        'select, option { background: #1f2022; color: #e7e9eb; border-color: #2f3134; }',
        'input::placeholder, textarea::placeholder { color: #6e7278; }',
        // p3/p9 图文编辑器(read-editor iframe):画布(body)压回近黑,让正文纸张
        // .main(映射层给的 #17181A)浮出辨识度,否则纸张与画布同色一片黑
        'body:has(.eva3-web-editor) { background: #0d0d0e !important; }',
        // 充电管理页暗色统一:工具卡白底线稿、经营助手播放块等白底内容图 invert 反色
        // (hue-rotate 修正色相偏移);线稿用 92% 强度,白底反转成近卡片底的深灰
        // 而非纯黑突兀;白色渐变蒙层(honor-panel::after)直接隐藏
        '.rights.is-new__dashboard img.img { filter: invert(.92) hue-rotate(180deg); }',
        // 奖牌卡含彩色内容(金徽章/头像/红色达成章),与截图类一致降亮度而不反色;
        // 底部渐变署名条偏亮,clip-path 裁掉下方 20%
        '.honor-panel__badge { filter: brightness(.8); clip-path: inset(0 0 20% 0); }',
        '.bottom-logo { filter: invert(1) hue-rotate(180deg); }',
        '.honor-panel::after { display: none !important; }',
        // 专属动态/评论弹幕筛选/专属表情包三卡的配图是功能截图而非线稿,不可反色,降亮度弱化刺眼感
        '.rights.is-new__dashboard img.img[src*="mask_bg_3"], .rights.is-new__dashboard img.img[src*="mask_bg_4"], .rights.is-new__dashboard img.img[src*="mask_bg_6"] { filter: brightness(.8); }',
        // 充电挑战横幅:背景图本身是亮色渐变,容器 invert 反色后呈暗色渐变、闪电色相保留;
        // 映射层已把站方深字提亮成浅色,浅字经容器反转会变暗,故子元素强制深色,
        // 反转后渲染为浅色,暗底上可读
        '.set-entry_general { filter: invert(1) hue-rotate(180deg); }',
        '.set-entry_general * { color: #18191c !important; }',
        // Ant Design 输入框:亮色主题黑字黑框与白底 wrapper 特异性高,通用映射压不住,用 !important
        '.ant-input-outlined .ant-input, input.ant-input-outlined { color: #e7e9eb !important; border-color: #2f3134 !important; background: transparent !important; }',
        '.ant-input-affix-wrapper.ant-input-outlined { background: transparent !important; border-color: #2f3134 !important; }',
        '.ant-input-outlined .ant-input::placeholder { color: #6e7278 !important; }',
        // bcc 表格表头弱灰 #757575 在暗底对比仅 4.0,提到次级文本档
        'th .bcc-table__cell, th .bcc-table__cell .bcc-table__sort { color: #99a2aa; }',
        // 数据中心首页:echarts 画布内轴文字是亮色主题色,CSS 够不到 canvas,
        // 对图表容器整体反色(浅底图表变暗底,色相经 hue-rotate 大致保留)
        '.dc-section-item_body .echarts { filter: invert(1) hue-rotate(180deg); }',
        // 数据中心 data-up 页:折线图 canvas 亮色主题绘制(深灰轴文字),容器已映射为
        // 暗卡片,canvas 内容反色让轴文字变浅、折线色相经 hue-rotate 大致保留
        '.core-data canvas, .chart-main canvas { filter: invert(1) hue-rotate(180deg); }',
        // ECharts 悬停提示:无类名,白底和浅灰文字都是 JS 配置写进内联样式,
        // 按 ｢绝对定位+内联白底｣ 特征压暗;全站通用——暗色模式下任何内联白底浮层都该压暗
        'div[style*="position: absolute"][style*="background-color: rgb(255, 255, 255)"]'
        + ' { background-color: #1f2022 !important; color: #e7e9eb !important; }',
        '::selection { background: #00a1d6; color: #fff; }',
    ].join('\n');

    // 缺省开启:装脚本即为了暗色,只有手动关过才记住 ｢关｣
    let styleEl = null;
    let darkOn = localStorage.getItem(KEY) !== '0';

    // Dark Reader 活跃时会与本脚本双重暗色打架
    function darkReaderActive() {
        return !!(document.documentElement.getAttribute('data-darkreader-scheme') ||
            document.querySelector('style[data-darkreader-mode]'));
    }

    function ensureStyleEl() {
        if (styleEl && styleEl.isConnected) return;
        styleEl = document.getElementById(STYLE_ID);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            document.documentElement.appendChild(styleEl);
        }
    }

    // 挂到 documentElement 而非 head:站方(york 编辑器等)会在 head 动态插同带 !important
    // 的 :root 亮值变量表,同特异性时后插者胜;我们的 style 在 body 之后天然更晚
    function replay() {
        ensureStyleEl();
        styleEl.textContent = THEME_VARS + '\n' + CORE_CSS + '\n' + [...outputs.values()].join('\n');
    }

    function applyStyle(on) {
        ensureStyleEl();
        styleEl.textContent = on ? THEME_VARS + '\n' + CORE_CSS : '';
        // 捷径:激活站内现成暗色规则(收益中心子应用的配色规则、上传页的 .dark-img 滤镜);
        // 这些规则由 micro-app 动态加载,类挂着对无此规则的页面无副作用
        document.documentElement.classList.toggle('night-mode', on);
        if (on) scheduleScan();
    }

    // ---------------- 开关按钮(仅顶层,可拖动) ----------------
    function buildButton() {
        const b = document.createElement('div');
        b.id = BTN_ID;
        b.textContent = '暗';
        const POS_KEY = KEY + 'BtnPos';
        Object.assign(b.style, {
            position: 'fixed', left: '18px', bottom: '18px', zIndex: 2147483646,
            width: '34px', height: '34px', lineHeight: '34px', textAlign: 'center',
            borderRadius: '50%', background: 'rgba(0,0,0,.45)', color: '#fff',
            fontSize: '14px', cursor: 'pointer', userSelect: 'none', boxShadow: '0 2px 8px rgba(0,0,0,.3)',
            touchAction: 'none',
        });
        // 恢复上次拖拽位置(存视口坐标,clamp 进当前视口防跨分辨率出界)
        try {
            const p = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
            if (p && typeof p.x === 'number' && typeof p.y === 'number') {
                b.style.left = Math.max(0, Math.min(p.x, innerWidth - 36)) + 'px';
                b.style.top = Math.max(0, Math.min(p.y, innerHeight - 36)) + 'px';
                b.style.bottom = 'auto';
            }
        } catch (e) {}
        b.title = '切换创作中心暗色模式(可拖动)';
        if (darkReaderActive()) {
            b.title += '(检测到 Dark Reader,建议对本站关闭以免颜色打架)';
            console.warn('[member-dark] 检测到 Dark Reader 活跃,建议对 member.bilibili.com 关闭,避免双重暗色');
        }
        const DRAG_PX = 4;
        let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, dragging = false;
        b.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            const rect = b.getBoundingClientRect();
            sx = e.clientX; sy = e.clientY; ox = rect.left; oy = rect.top;
            moved = false; dragging = true;
            b.setPointerCapture(e.pointerId);
            e.preventDefault();
        });
        b.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - sx, dy = e.clientY - sy;
            if (!moved && Math.hypot(dx, dy) > DRAG_PX) {
                moved = true;
                b.style.bottom = 'auto';
                b.style.cursor = 'grabbing';
            }
            if (!moved) return;
            b.style.left = Math.max(0, Math.min(ox + dx, innerWidth - b.offsetWidth)) + 'px';
            b.style.top = Math.max(0, Math.min(oy + dy, innerHeight - b.offsetHeight)) + 'px';
        });
        b.addEventListener('pointerup', () => {
            if (!dragging) return;
            dragging = false;
            b.style.cursor = 'pointer';
            if (moved) {
                localStorage.setItem(POS_KEY, JSON.stringify({ x: b.offsetLeft, y: b.offsetTop }));
            } else {
                darkOn = !darkOn;
                localStorage.setItem(KEY, darkOn ? '1' : '0');
                applyStyle(darkOn);
            }
        });
        b.addEventListener('pointercancel', () => {
            dragging = false;
            b.style.cursor = 'pointer';
        });
        return b;
    }

    // ---------------- 编辑器工具栏图标:shadow 内写死灰字,外部 CSS 够不到 ----------------
    // eva3-icon 的 path fill=currentColor,但组件 :host 写死 color:#464949;
    // :host 规则会盖过 host 的普通内联样式,须用 !important 级内联才能压过
    function fixEva3Icons() {
        for (const item of document.querySelectorAll('.eva3-toolbar-item')) {
            if (!item.shadowRoot) continue;
            for (const el of item.shadowRoot.querySelectorAll('eva3-button, eva3-icon, eva3-tooltip')) {
                el.style.setProperty('color', 'inherit', 'important');
            }
        }
    }

    // ---------------- 自愈:SPA 切页/子应用卸载可能摘样式、摘类、摘按钮 ----------------
    // 防抖带 2s 强制下限:只做补缺检查,不重注入,避免高频变更下饿死;
    // 引擎增量扫描走独立的 300ms 防抖,两者互不阻塞
    let fixTimer = null;
    function scheduleFix() {
        if (fixTimer) return;
        fixTimer = setTimeout(() => {
            fixTimer = null;
            if (!styleEl || !styleEl.isConnected) applyStyle(darkOn);
            if (darkOn) {
                if (!styleEl || !styleEl.textContent) applyStyle(true);
                if (!document.documentElement.classList.contains('night-mode')) {
                    document.documentElement.classList.add('night-mode');
                }
                scheduleScan();
            }
            if (IS_TOP && !document.getElementById(BTN_ID) && document.body) {
                document.body.appendChild(buildButton());
            }
            fixEva3Icons();
        }, 2000);
    }

    // ---------------- 跨 frame 同步:顶层切换后,同源 iframe 跟随 ----------------
    window.addEventListener('storage', (e) => {
        if (e.key === KEY && e.newValue !== null) {
            darkOn = e.newValue === '1';
            applyStyle(darkOn);
        }
    });

    function mount() {
        if (IS_TOP && document.body) {
            const old = document.getElementById(BTN_ID);
            if (old) old.remove();
            document.body.appendChild(buildButton());
        }
        applyStyle(darkOn);
        fixEva3Icons(); // 首扫:注入时工具栏可能已挂载,不能只等 Observer 触发
        // subtree childList 捕获 SPA 换页/子应用挂载的新样式表;href/rel 变化捕获 link 换表;
        // 回调只做防抖登记,重活都在 runScan/scheduleFix 里
        const obs = new MutationObserver(scheduleFix);
        obs.observe(document.documentElement, {
            childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'href', 'rel', 'media'],
        });
    }

    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount, { once: true });
})();
