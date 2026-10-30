// 组装:模板 + theme-dark.css 编译的变量表 → 仓库的 member-dark.user.js
// 动态引擎接管站方样式映射后,构建只剩这一步静态注入(变量表是固定色板,不随站方改版变)
// 用法: node assemble.js
import fs from 'node:fs';
const dir = import.meta.dirname;
const themeCss = fs.readFileSync(dir + '/theme-dark.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const decls = [...themeCss.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)]
    .map(m => `${m[1]}: ${m[2].trim()} !important`)
    .join('; ');
if (decls.length < 1000) { console.error('theme-dark.css 变量表异常(' + decls.length + ' 字符)'); process.exit(1); }
// html:root 而非 :root:站方(york 编辑器等)会在脚本之后动态注入同带 !important 的
// :root 亮值变量表,同特异性时后插者胜;提高一级特异性才能压住
const vars = `html:root { ${decls} }`;
const tpl = fs.readFileSync(dir + '/member-dark.template.js', 'utf8');
const PLACEHOLDER = "const THEME_VARS = ''; // __THEME_VARS__(assemble 时整行替换,勿动格式)";
if (!tpl.includes(PLACEHOLDER)) { console.error('placeholder not found'); process.exit(1); }
const js = tpl.replace(PLACEHOLDER, 'const THEME_VARS = ' + JSON.stringify(vars) + ';');
fs.writeFileSync(dir + '/../member-dark.user.js', js);
console.log('assembled', (js.length / 1024).toFixed(0) + 'KB, vars', decls.split(';').length);
