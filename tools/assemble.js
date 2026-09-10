// 组装:模板 + 生成的暗色 CSS → 仓库的 member-dark.user.js
// 用法: node assemble.js(css-dump/ 与本文件同目录)
import fs from 'node:fs';
const css = fs.readFileSync(import.meta.dirname + '/dark-generated.css', 'utf8');
const tpl = fs.readFileSync(import.meta.dirname + '/member-dark.template.js', 'utf8');
const PLACEHOLDER = "const GENERATED_CSS = ''; // __GENERATED_CSS__(assemble 时整行替换,勿动格式)";
const js = tpl.replace(PLACEHOLDER, 'const GENERATED_CSS = ' + JSON.stringify(css) + ';');
if (!js.includes('GENERATED_CSS = "')) { console.error('placeholder not replaced'); process.exit(1); }
const outIdx = process.argv.indexOf('--out');
fs.writeFileSync(outIdx > 0 ? process.argv[outIdx + 1] : import.meta.dirname + '/../member-dark.user.js', js);
console.log('assembled', (js.length / 1024).toFixed(0) + 'KB');
