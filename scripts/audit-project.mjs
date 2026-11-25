import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {JOURNAL_STICKERS} from '../src/data/journalStickers.js';
import {PRINT_COVERS} from '../src/data/printCoverArt.js';
import {EDITOR_TEMPLATES} from '../src/data/journalEditor.js';
const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'..'),src=path.join(root,'src'),publicDir=path.join(root,'public');
const routes=['/','/plan/new','/plan/generate','/trip/:id','/trips','/journal/create','/journal/edit/:id','/print/customize','/orders'];
const app=fs.readFileSync(path.join(src,'App.jsx'),'utf8');
for(const route of routes){assert.ok(app.includes(`path="${route}"`),`缺少路由：${route}`)}
let files=0,imports=0,assets=0;
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(css|js|jsx)$/.test(e.name)){
 files++;
 const txt=fs.readFileSync(p,'utf8');
 for(const m of txt.matchAll(/(?:from\s*|import\s*)["'](\.{1,2}\/[^"']+)["']/g)){
   const candidate=path.resolve(path.dirname(p),m[1]);
   assert.ok([candidate,candidate+'.js',candidate+'.jsx'].some(x=>fs.existsSync(x)),`缺失本地导入 ${p}: ${m[1]}`);imports++;
 }
 for(const m of txt.matchAll(/["'`](\/images\/[a-zA-Z0-9_./-]+\.(?:png|jpg|jpeg|webp|svg))["'`]/g)){
   const asset=path.join(publicDir,m[1].slice(1));
   assert.ok(fs.existsSync(asset),`缺失图片素材 ${p}: ${m[1]}`);assets++;
 }
 }} }
walk(src);
for(const s of JOURNAL_STICKERS){assert.ok(fs.existsSync(path.join(publicDir,s.src.slice(1))),`缺少贴纸 ${s.id}`)}
for(const [id,c] of Object.entries(PRINT_COVERS))assert.ok(fs.existsSync(path.join(publicDir,c.src.slice(1))),`缺少实体封面 ${id}`);
for(const t of EDITOR_TEMPLATES)assert.ok(fs.existsSync(path.join(publicDir,'images/template-previews',`${t.id}.jpg`)),`缺少手账缩略图 ${t.id}`);
assert.equal(JOURNAL_STICKERS.length,71);
assert.equal(EDITOR_TEMPLATES.length,4);
assert.equal(Object.keys(PRINT_COVERS).length,4);
console.log(`审计通过：${routes.length} 条路由、${files} 个源文件、${imports} 处本地模块导入、${assets} 处静态图片引用、71 枚贴纸、4 套手账和 4 套封面。`);
