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

    const THEME_VARS = "html:root { --Ga0: #101011 !important; --Ga0_s: #1E2022 !important; --Ga0_t: #1E2022 !important; --Ga1: #0A0B0C !important; --Ga1_s: #232527 !important; --Ga1_t: #232527 !important; --Ga1_e: #232527 !important; --Ga2: #2F3134 !important; --Ga2_t: #2F3134 !important; --Ga3: #46494D !important; --Ga3_t: #46494D !important; --Ga4: #5E6267 !important; --Ga4_t: #5E6267 !important; --Ga5: #757A81 !important; --Ga5_t: #757A81 !important; --Ga6: #8B9097 !important; --Ga6_t: #8B9097 !important; --Ga7: #A2A7AE !important; --Ga7_t: #A2A7AE !important; --Ga8: #B9BDC2 !important; --Ga8_t: #B9BDC2 !important; --Ga9: #D0D3D7 !important; --Ga9_t: #D0D3D7 !important; --Ga10: #E7E9EB !important; --Ga10_t: #E7E9EB !important; --Ga11: #242628 !important; --Ga12: #1F2022 !important; --Ga12_s: #2B2C2F !important; --Ga13: #1A1B1D !important; --Ga13_s: #2F3134 !important; --Wh0: #17181A !important; --Wh0_s: #2F3134 !important; --Wh0_t: #17181A !important; --Ba0: #000000 !important; --Ba0_s: #FFFFFF !important; --Ba0_t: #000000 !important; --Pi0: #26161C !important; --Pi1: #2F1A22 !important; --Pi2: #472030 !important; --Pi3: #76304B !important; --Pi4: #A73E65 !important; --Pi5: #D44E7D !important; --Pi5_t: #D44E7D !important; --Pi6: #DC6D94 !important; --Pi7: #E38CAA !important; --Pi8: #EBABC1 !important; --Pi9: #F2CAD8 !important; --Pi10: #FAE9EF !important; --Ma0: #261525 !important; --Ma1: #2E182D !important; --Ma2: #461C43 !important; --Ma3: #72296C !important; --Ma4: #A13396 !important; --Ma5: #CB41BB !important; --Ma6: #D462C7 !important; --Ma7: #DD83D3 !important; --Ma8: #E6A4DE !important; --Ma9: #EFC5EA !important; --Ma10: #F8E6F6 !important; --Re0: #261314 !important; --Re1: #2E1617 !important; --Re2: #471A1C !important; --Re3: #742728 !important; --Re4: #A63131 !important; --Re5: #D1403E !important; --Re6: #D9615F !important; --Re7: #E18281 !important; --Re8: #E9A3A2 !important; --Re9: #F1C5C4 !important; --Re10: #F9E5E5 !important; --Or0: #28180F !important; --Or1: #301B10 !important; --Or2: #4A230E !important; --Or3: #783610 !important; --Or4: #A9490D !important; --Or5: #D66011 !important; --Or6: #DD7C3A !important; --Or7: #E49764 !important; --Or8: #EBB38D !important; --Or9: #F2CEB6 !important; --Or10: #FAEADF !important; --Ye0: #2A1E0F !important; --Ye1: #342410 !important; --Ye2: #4D300B !important; --Ye3: #7C4C08 !important; --Ye4: #AD6800 !important; --Ye5: #DB8700 !important; --Ye6: #E19C2C !important; --Ye7: #E7B158 !important; --Ye8: #EEC584 !important; --Ye9: #F4DAB1 !important; --Ye10: #FAEFDD !important; --Ly0: #2A2310 !important; --Ly1: #332A11 !important; --Ly2: #49390C !important; --Ly3: #745909 !important; --Ly4: #A27C00 !important; --Ly5: #CCA000 !important; --Ly6: #D5B02C !important; --Ly7: #DEC158 !important; --Ly8: #E7D184 !important; --Ly9: #EFE2B1 !important; --Ly10: #F8F2DD !important; --Lg0: #19220F !important; --Lg1: #1E2911 !important; --Lg2: #273C0E !important; --Lg3: #3C600F !important; --Lg4: #50840B !important; --Lg5: #67A70E !important; --Lg6: #81B638 !important; --Lg7: #9CC562 !important; --Lg8: #B6D58B !important; --Lg9: #D0E4B5 !important; --Lg10: #EBF3DF !important; --Gr0: #102017 !important; --Gr1: #11271B !important; --Gr2: #123923 !important; --Gr3: #175C34 !important; --Gr4: #198042 !important; --Gr5: #1FA251 !important; --Gr6: #46B26F !important; --Gr7: #6DC28D !important; --Gr8: #93D2AB !important; --Gr9: #BAE2C9 !important; --Gr10: #E1F3E8 !important; --Cy0: #0C1F20 !important; --Cy1: #0D2627 !important; --Cy2: #093739 !important; --Cy3: #085B5C !important; --Cy4: #028080 !important; --Cy5: #03A29F !important; --Cy6: #2FB2B0 !important; --Cy7: #5AC2C0 !important; --Cy8: #86D2D1 !important; --Cy9: #B2E2E1 !important; --Cy10: #DDF3F3 !important; --Lb0: #0A1B23 !important; --Lb1: #0B202A !important; --Lb2: #082D40 !important; --Lb3: #064A69 !important; --Lb4: #006996 !important; --Lb5: #0087BD !important; --Lb6: #2C9CC8 !important; --Lb7: #58B1D4 !important; --Lb8: #84C5DF !important; --Lb9: #B1DBEB !important; --Lb10: #DDEFF6 !important; --Bl0: #151826 !important; --Bl1: #181C2F !important; --Bl2: #1F2748 !important; --Bl3: #2E3C76 !important; --Bl4: #3B53A8 !important; --Bl5: #4B6BD4 !important; --Bl6: #6A85DB !important; --Bl7: #899EE3 !important; --Bl8: #A9B8EA !important; --Bl9: #C8D2F2 !important; --Bl10: #E7EBF9 !important; --Pu0: #1D1628 !important; --Pu1: #221A31 !important; --Pu2: #31214C !important; --Pu3: #4E317D !important; --Pu4: #6D3FB1 !important; --Pu5: #8C50E0 !important; --Pu6: #A06EE5 !important; --Pu7: #B48DEB !important; --Pu8: #C8ABF0 !important; --Pu9: #DBC9F5 !important; --Pu10: #F0E8FB !important; --Br0: #211D1B !important; --Br1: #282320 !important; --Br2: #382F2A !important; --Br3: #59483F !important; --Br4: #7A6154 !important; --Br5: #9A7C6A !important; --Br6: #AC9384 !important; --Br7: #BDA99E !important; --Br8: #CEBFB7 !important; --Br9: #E0D7D1 !important; --Br10: #F2EEEB !important; --Si0: #212325 !important; --Si1: #27292C !important; --Si2: #36393F !important; --Si3: #535962 !important; --Si4: #6F7987 !important; --Si5: #8C99AA !important; --Si6: #A0ABB9 !important; --Si7: #B4BCC7 !important; --Si8: #C8CED6 !important; --Si9: #DCE0E5 !important; --Si10: #F0F2F4 !important; --Ga0_rgb: 16, 16, 17 !important; --Ga0_s_rgb: 30, 32, 34 !important; --Ga0_t_rgb: 30, 32, 34 !important; --Ga1_rgb: 10, 11, 12 !important; --Ga1_s_rgb: 35, 37, 39 !important; --Ga1_t_rgb: 35, 37, 39 !important; --Ga1_e_rgb: 35, 37, 39 !important; --Ga2_rgb: 47, 49, 52 !important; --Ga2_t_rgb: 47, 49, 52 !important; --Ga3_rgb: 70, 73, 77 !important; --Ga3_t_rgb: 70, 73, 77 !important; --Ga4_rgb: 94, 98, 103 !important; --Ga4_t_rgb: 94, 98, 103 !important; --Ga5_rgb: 117, 122, 129 !important; --Ga5_t_rgb: 117, 122, 129 !important; --Ga6_rgb: 139, 144, 151 !important; --Ga6_t_rgb: 139, 144, 151 !important; --Ga7_rgb: 162, 167, 174 !important; --Ga7_t_rgb: 162, 167, 174 !important; --Ga8_rgb: 185, 189, 194 !important; --Ga8_t_rgb: 185, 189, 194 !important; --Ga9_rgb: 208, 211, 215 !important; --Ga9_t_rgb: 208, 211, 215 !important; --Ga10_rgb: 231, 233, 235 !important; --Ga10_t_rgb: 231, 233, 235 !important; --Ga11_rgb: 36, 38, 40 !important; --Ga12_rgb: 31, 32, 34 !important; --Ga12_s_rgb: 43, 44, 47 !important; --Ga13_rgb: 26, 27, 29 !important; --Ga13_s_rgb: 47, 49, 52 !important; --Wh0_rgb: 23, 24, 26 !important; --Wh0_s_rgb: 47, 49, 52 !important; --Wh0_t_rgb: 23, 24, 26 !important; --Ba0_rgb: 0, 0, 0 !important; --Ba0_s_rgb: 255, 255, 255 !important; --Ba0_t_rgb: 0, 0, 0 !important; --Pi0_rgb: 38, 22, 28 !important; --Pi1_rgb: 47, 26, 34 !important; --Pi2_rgb: 71, 32, 48 !important; --Pi3_rgb: 118, 48, 75 !important; --Pi4_rgb: 167, 62, 101 !important; --Pi5_rgb: 212, 78, 125 !important; --Pi5_t_rgb: 212, 78, 125 !important; --Pi6_rgb: 220, 109, 148 !important; --Pi7_rgb: 227, 140, 170 !important; --Pi8_rgb: 235, 171, 193 !important; --Pi9_rgb: 242, 202, 216 !important; --Pi10_rgb: 250, 233, 239 !important; --Ma0_rgb: 38, 21, 37 !important; --Ma1_rgb: 46, 24, 45 !important; --Ma2_rgb: 70, 28, 67 !important; --Ma3_rgb: 114, 41, 108 !important; --Ma4_rgb: 161, 51, 150 !important; --Ma5_rgb: 203, 65, 187 !important; --Ma6_rgb: 212, 98, 199 !important; --Ma7_rgb: 221, 131, 211 !important; --Ma8_rgb: 230, 164, 222 !important; --Ma9_rgb: 239, 197, 234 !important; --Ma10_rgb: 248, 230, 246 !important; --Re0_rgb: 38, 19, 20 !important; --Re1_rgb: 46, 22, 23 !important; --Re2_rgb: 71, 26, 28 !important; --Re3_rgb: 116, 39, 40 !important; --Re4_rgb: 166, 49, 49 !important; --Re5_rgb: 209, 64, 62 !important; --Re6_rgb: 217, 97, 95 !important; --Re7_rgb: 225, 130, 129 !important; --Re8_rgb: 233, 163, 162 !important; --Re9_rgb: 241, 197, 196 !important; --Re10_rgb: 249, 229, 229 !important; --Or0_rgb: 40, 24, 15 !important; --Or1_rgb: 48, 27, 16 !important; --Or2_rgb: 74, 35, 14 !important; --Or3_rgb: 120, 54, 16 !important; --Or4_rgb: 169, 73, 13 !important; --Or5_rgb: 214, 96, 17 !important; --Or6_rgb: 221, 124, 58 !important; --Or7_rgb: 228, 151, 100 !important; --Or8_rgb: 235, 179, 141 !important; --Or9_rgb: 242, 206, 182 !important; --Or10_rgb: 250, 234, 223 !important; --Ye0_rgb: 42, 30, 15 !important; --Ye1_rgb: 52, 36, 16 !important; --Ye2_rgb: 77, 48, 11 !important; --Ye3_rgb: 124, 76, 8 !important; --Ye4_rgb: 173, 104, 0 !important; --Ye5_rgb: 219, 135, 0 !important; --Ye6_rgb: 225, 156, 44 !important; --Ye7_rgb: 231, 177, 88 !important; --Ye8_rgb: 238, 197, 132 !important; --Ye9_rgb: 244, 218, 177 !important; --Ye10_rgb: 250, 239, 221 !important; --Ly0_rgb: 42, 35, 16 !important; --Ly1_rgb: 51, 42, 17 !important; --Ly2_rgb: 73, 57, 12 !important; --Ly3_rgb: 116, 89, 9 !important; --Ly4_rgb: 162, 124, 0 !important; --Ly5_rgb: 204, 160, 0 !important; --Ly6_rgb: 213, 176, 44 !important; --Ly7_rgb: 222, 193, 88 !important; --Ly8_rgb: 231, 209, 132 !important; --Ly9_rgb: 239, 226, 177 !important; --Ly10_rgb: 248, 242, 221 !important; --Lg0_rgb: 25, 34, 15 !important; --Lg1_rgb: 30, 41, 17 !important; --Lg2_rgb: 39, 60, 14 !important; --Lg3_rgb: 60, 96, 15 !important; --Lg4_rgb: 80, 132, 11 !important; --Lg5_rgb: 103, 167, 14 !important; --Lg6_rgb: 129, 182, 56 !important; --Lg7_rgb: 156, 197, 98 !important; --Lg8_rgb: 182, 213, 139 !important; --Lg9_rgb: 208, 228, 181 !important; --Lg10_rgb: 235, 243, 223 !important; --Gr0_rgb: 16, 32, 23 !important; --Gr1_rgb: 17, 39, 27 !important; --Gr2_rgb: 18, 57, 35 !important; --Gr3_rgb: 23, 92, 52 !important; --Gr4_rgb: 25, 128, 66 !important; --Gr5_rgb: 31, 162, 81 !important; --Gr6_rgb: 70, 178, 111 !important; --Gr7_rgb: 109, 194, 141 !important; --Gr8_rgb: 147, 210, 171 !important; --Gr9_rgb: 186, 226, 201 !important; --Gr10_rgb: 225, 243, 232 !important; --Cy0_rgb: 12, 31, 32 !important; --Cy1_rgb: 13, 38, 39 !important; --Cy2_rgb: 9, 55, 57 !important; --Cy3_rgb: 8, 91, 92 !important; --Cy4_rgb: 2, 128, 128 !important; --Cy5_rgb: 3, 162, 159 !important; --Cy6_rgb: 47, 178, 176 !important; --Cy7_rgb: 90, 194, 192 !important; --Cy8_rgb: 134, 210, 209 !important; --Cy9_rgb: 178, 226, 225 !important; --Cy10_rgb: 221, 243, 243 !important; --Lb0_rgb: 10, 27, 35 !important; --Lb1_rgb: 11, 32, 42 !important; --Lb2_rgb: 8, 45, 64 !important; --Lb3_rgb: 6, 74, 105 !important; --Lb4_rgb: 0, 105, 150 !important; --Lb5_rgb: 0, 135, 189 !important; --Lb6_rgb: 44, 156, 200 !important; --Lb7_rgb: 88, 177, 212 !important; --Lb8_rgb: 132, 197, 223 !important; --Lb9_rgb: 177, 219, 235 !important; --Lb10_rgb: 221, 239, 246 !important; --Bl0_rgb: 21, 24, 38 !important; --Bl1_rgb: 24, 28, 47 !important; --Bl2_rgb: 31, 39, 72 !important; --Bl3_rgb: 46, 60, 118 !important; --Bl4_rgb: 59, 83, 168 !important; --Bl5_rgb: 75, 107, 212 !important; --Bl6_rgb: 106, 133, 219 !important; --Bl7_rgb: 137, 158, 227 !important; --Bl8_rgb: 169, 184, 234 !important; --Bl9_rgb: 200, 210, 242 !important; --Bl10_rgb: 231, 235, 249 !important; --Pu0_rgb: 29, 22, 40 !important; --Pu1_rgb: 34, 26, 49 !important; --Pu2_rgb: 49, 33, 76 !important; --Pu3_rgb: 78, 49, 125 !important; --Pu4_rgb: 109, 63, 177 !important; --Pu5_rgb: 140, 80, 224 !important; --Pu6_rgb: 160, 110, 229 !important; --Pu7_rgb: 180, 141, 235 !important; --Pu8_rgb: 200, 171, 240 !important; --Pu9_rgb: 219, 201, 245 !important; --Pu10_rgb: 240, 232, 251 !important; --Br0_rgb: 33, 29, 27 !important; --Br1_rgb: 40, 35, 32 !important; --Br2_rgb: 56, 47, 42 !important; --Br3_rgb: 89, 72, 63 !important; --Br4_rgb: 122, 97, 84 !important; --Br5_rgb: 154, 124, 106 !important; --Br6_rgb: 172, 147, 132 !important; --Br7_rgb: 189, 169, 158 !important; --Br8_rgb: 206, 191, 183 !important; --Br9_rgb: 224, 215, 209 !important; --Br10_rgb: 242, 238, 235 !important; --Si0_rgb: 33, 35, 37 !important; --Si1_rgb: 39, 41, 44 !important; --Si2_rgb: 54, 57, 63 !important; --Si3_rgb: 83, 89, 98 !important; --Si4_rgb: 111, 121, 135 !important; --Si5_rgb: 140, 153, 170 !important; --Si6_rgb: 160, 171, 185 !important; --Si7_rgb: 180, 188, 199 !important; --Si8_rgb: 200, 206, 214 !important; --Si9_rgb: 220, 224, 229 !important; --Si10_rgb: 240, 242, 244 !important }";

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
