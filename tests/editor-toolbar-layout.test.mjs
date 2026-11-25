import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const jsx=readFileSync(new URL('../src/pages/JournalEditorPage.jsx',import.meta.url),'utf8');
const shell=readFileSync(new URL('../src/components/AppShell.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles/global.css',import.meta.url),'utf8');
const v19=css.slice(css.lastIndexOf('第十九轮 · 07 手账编辑'));

test('07 编辑栏是版式、图片、文字、贴纸、更多这五个固定入口',()=>{
  const start=jsx.indexOf('className="je-main-tools"');
  const end=jsx.indexOf('].map(t=>',start);
  const buttons=jsx.slice(start,end);
  const labels=[...buttons.matchAll(/\{id:'([^']+)',Icon:[^,]+,label:'([^']+)'\}/g)].map(m=>[m[1],m[2]]);
  assert.deepEqual(labels,[['templates','版式'],['photos','图片'],['text','文字'],['stickers','贴纸'],['more','更多']]);
});

test('07 工具栏 Portal 到手机屏幕容器，而不是页面或浏览器窗口',()=>{
  assert.match(jsx,/querySelector\('\.app-screen--editor'\)/);
  assert.match(jsx,/createPortal\(editorDock,dockHost\)/);
  assert.match(shell,/app-screen--editor/);
  assert.match(v19,/\.app-screen--editor \.je-mobile-dock\s*\{\s*position:absolute;/);
  assert.match(v19,/\.app-screen--editor \.je-mobile-dock \.je-main-tools\s*\{\s*position:absolute;/);
  assert.match(v19,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(v19,/left:7px;\s*right:7px;/);
});

test('二级面板同样锚定手机内部，页面管理可从更多进入',()=>{
  assert.match(v19,/\.app-screen--editor \.je-mobile-dock \.je-tool-panel/);
  assert.match(v19,/left:7px;\s*right:7px;/);
  assert.match(jsx,/panel==='more'/);
  assert.match(jsx,/onClick=\{\(\)=>setPanel\('pages'\)\}/);
  assert.match(jsx,/panel==='confirm-delete'/);
  assert.match(jsx,/panel==='stickers'/);
});
