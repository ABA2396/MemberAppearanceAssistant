// 颜色重写生成器:读 css-dump 的壳 CSS,按 ｢声明名分语境｣ 的亮→暗映射生成暗色覆盖规则
// 用法: node build-dark.js  →  输出 dark-generated.css + 统计
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(import.meta.dirname, 'css-dump');
const OUT = path.join(import.meta.dirname, 'dark-generated.css');

// ---------------- 色彩工具 ----------------
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

// ---------------- 暗色映射 ----------------
// 色板基准:B 站主站 night-mode(body #0d0d0e、卡片 #242628、分割线 #303132、主文字 #e6e7e9)
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

// ---------------- 简易 CSS 规则解析(编译产物,最多 @media 一层嵌套) ----------------
function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ''); }

function* topRules(css) {
  let depth = 0, start = 0, braceStart = -1;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') { if (depth === 0) braceStart = i; depth++; }
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        yield { head: css.slice(start, braceStart).trim(), body: css.slice(braceStart + 1, i), end: i + 1 };
        start = i + 1;
      }
    }
  }
}

function mapDeclarations(body) {
  // 按声明名逐条映射;生成器只保留 ｢发生了变化｣ 的声明,避免输出全量重复规则
  const out = [];
  for (const decl of body.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!prop || val.includes('url(') || val.startsWith('var(')) continue;
    if (!/[#r]/.test(val)) continue; // 快速筛:无 hex 无 rgb 的声明跳过
    const nv = mapColor(prop, val);
    if (nv && nv !== val) out.push(`${prop}: ${nv}`);
  }
  return out;
}

// ---------------- b-style 语义变量暗色覆盖 ----------------
// iframe 子应用(图文编辑器/opus 管理/创作选择)消费 --text1/--Ga10/--b_text1 等站方语义变量,
// 亮值来自 theme-light/map(别名链最终指向 --Ga* 叶子);注入 theme-dark 全套变量即整体换肤
function buildThemeVars() {
  let darkCss;
  try { darkCss = stripComments(fs.readFileSync(path.join(SRC, 'theme-dark.css'), 'utf8')); } catch { return ''; }
  const decls = [...darkCss.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)]
    .map(m => `${m[1]}: ${m[2].trim()} !important`)
    .join('; ');
  return decls ? `:root { ${decls} }` : '';
}

// ---------------- 主流程 ----------------
let inRules = 0, outRules = 0;
const outParts = [];
const themeVars = buildThemeVars();
if (themeVars) outParts.push(themeVars);
const seenRules = new Set();
const seenInput = new Set();
function pushRule(key, text) {
  if (seenRules.has(key)) return;
  seenRules.add(key);
  outParts.push(text);
  outRules++;
}
for (const f of fs.readdirSync(SRC)) {
  if (!f.endsWith('.css') || f.includes('theme-') || f.includes('iconfont')) continue;
  const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
  // 不同会话重复收集的内联表内容相同,按内容去重
  const dupKey = raw.length + ':' + (raw.length > 4096 ? raw.slice(0, 2048) + raw.slice(-2048) : raw);
  if (seenInput.has(dupKey)) continue;
  seenInput.add(dupKey);
  const css = stripComments(raw);
  for (const r of topRules(css)) {
    if (r.head.startsWith('@')) {
      if (!/^@media|^@supports/.test(r.head)) continue;
      const inner = [];
      for (const rr of topRules(r.body)) {
        const decls = mapDeclarations(rr.body);
        if (decls.length) { inner.push(`${rr.head}{${decls.join(';')}}`); inRules++; }
      }
      if (inner.length) pushRule(r.head + inner.join(''), `${r.head}{${inner.join('')}}`);
      continue;
    }
    if (r.head.includes('@keyframes') || r.body.includes('@')) continue;
    const decls = mapDeclarations(r.body);
    inRules++;
    if (decls.length) pushRule(r.head + decls.join(';'), `${r.head}{${decls.join(';')}}`);
  }
}
fs.writeFileSync(OUT, outParts.join('\n'));
console.log(`in=${inRules} out=${outRules} size=${(fs.statSync(OUT).size / 1024).toFixed(0)}KB`);
