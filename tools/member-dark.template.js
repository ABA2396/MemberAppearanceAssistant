// ==UserScript==
// @name         创作中心暗色模式助手
// @namespace    uye.member-dark
// @author       uye
// @version      0.2.0
// @description  给 B 站创作中心(member.bilibili.com)加可开关的暗色模式:左下角 ｢暗｣ 按钮切换,状态存 localStorage;色板沿用主站 night-mode 变量体系。不做整页反色,图片/图表仅个别白底内容定点反色。
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

    const GENERATED_CSS = ''; // __GENERATED_CSS__(assemble 时整行替换,勿动格式)

    const STYLE_ID = 'member-dark-style';
    const BTN_ID = 'member-dark-toggle';
    const KEY = 'memberDarkOn';
    // 同源 iframe(图文编辑器/稿件管理/创作选择)与顶层共用一套样式与开关状态;
    // 信封弹层(message.bilibili.com 域 iframe)跨域不共享 localStorage,按缺省开启注入
    const IS_TOP = window.top === window.self;

    // ---------------- 手写核心层:生成层之外的通用兜底 ----------------
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
        // .main(生成层给的 #17181A)浮出辨识度,否则纸张与画布同色一片黑
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
        // 生成层已把站方深字提亮成浅色,浅字经容器反转会变暗,故子元素强制深色,
        // 反转后渲染为浅色,暗底上可读
        '.set-entry_general { filter: invert(1) hue-rotate(180deg); }',
        '.set-entry_general * { color: #18191c !important; }',
        // Ant Design 输入框:亮色主题黑字黑框与白底 wrapper 特异性高,CORE 兜底压不住,用 !important
        '.ant-input-outlined .ant-input, input.ant-input-outlined { color: #e7e9eb !important; border-color: #2f3134 !important; background: transparent !important; }',
        '.ant-input-affix-wrapper.ant-input-outlined { background: transparent !important; border-color: #2f3134 !important; }',
        '.ant-input-outlined .ant-input::placeholder { color: #6e7278 !important; }',
        // bcc 表格表头弱灰 #757575 在暗底对比仅 4.0,提到次级文本档
        'th .bcc-table__cell, th .bcc-table__cell .bcc-table__sort { color: #99a2aa; }',
        // 数据中心首页:echarts 画布内轴文字是亮色主题色,CSS 够不到 canvas,
        // 对图表容器整体反色(浅底图表变暗底,色相经 hue-rotate 大致保留)
        '.dc-section-item_body .echarts { filter: invert(1) hue-rotate(180deg); }',
        // ECharts 悬停提示:无类名,白底和浅灰文字都是 JS 配置写进内联样式,
        // 按 ｢绝对定位+内联白底｣ 特征压暗;全站通用——暗色模式下任何内联白底浮层都该压暗
        'div[style*="position: absolute"][style*="background-color: rgb(255, 255, 255)"]'
        + ' { background-color: #1f2022 !important; color: #e7e9eb !important; }',
        '::selection { background: #00a1d6; color: #fff; }',
    ].join('\n');

    function buildCss() {
        return GENERATED_CSS + '\n' + CORE_CSS;
    }

    // 缺省开启:装脚本即为了暗色,只有手动关过才记住 ｢关｣
    let styleEl = null;
    let darkOn = localStorage.getItem(KEY) !== '0';

    // Dark Reader 活跃时会与本脚本双重暗色打架
    function darkReaderActive() {
        return !!(document.documentElement.getAttribute('data-darkreader-scheme') ||
            document.querySelector('style[data-darkreader-mode]'));
    }

    function applyStyle(on) {
        if (!styleEl || !styleEl.isConnected) {
            styleEl = document.getElementById(STYLE_ID);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = STYLE_ID;
                document.documentElement.appendChild(styleEl);
            }
        }
        styleEl.textContent = on ? buildCss() : '';
        // 捷径:激活站内现成暗色规则(收益中心子应用的配色规则、上传页的 .dark-img 滤镜);
        // 这些规则由 micro-app 动态加载,类挂着对无此规则的页面无副作用
        document.documentElement.classList.toggle('night-mode', on);
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
    // 防抖带 2s 强制下限:只做补缺检查,不重注入,避免高频变更下饿死
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
        const obs = new MutationObserver(scheduleFix);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
        if (document.body) obs.observe(document.body, { childList: true, subtree: false });
    }

    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount, { once: true });
})();
