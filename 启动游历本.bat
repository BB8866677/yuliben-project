@echo off
chcp 65001 >nul
title 游历本 - 开发预览
echo =================================
echo  游历本 React 网页原型
echo =================================
where node >nul 2>nul
if errorlevel 1 (
  echo [提示] 未检测到 Node.js。请先从 https://nodejs.org 安装 Node.js LTS。
  pause
  exit /b 1
)
if not exist node_modules (
  echo 首次启动，安装项目依赖……
  call npm install
  if errorlevel 1 (
    echo 依赖安装失败，请检查网络或在 VS Code 终端重试 npm install。
    pause
    exit /b 1
  )
)
echo 正在启动网页，请打开终端提示的网址……
call npm run dev
pause
