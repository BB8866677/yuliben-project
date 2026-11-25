# 游历本 · 第二十轮 · GitHub Pages 部署版

这是在**第二十轮原型**基础上制作的 GitHub Pages 发布版本。保留所有 App 设计、旅行规划、模拟多人协作、手账贴纸和实体纪念册交互；只调整静态部署所需的路径和路由，并新增自动发布配置。

## 1. 先在 GitHub 创建空仓库

登录 GitHub，点击右上角 **+ → New repository**，仓库名称可以设为 `yuliben-app`（也可以用任意其他英文名）。建议选 **Public**，不要自动创建 README、license 或 .gitignore，然后创建。

## 2. 在 VS Code 终端上传

**注意：终端必须定位到包含 `package.json`、`src`、`public`、`.github` 的这个项目根目录。**

```bash
git init
git branch -M main
git add .
git commit -m "Deploy 游历本 v20 prototype"
git remote add origin https://github.com/你的GitHub用户名/你的仓库名.git
git push -u origin main
```

替换最后两条命令中的用户名和仓库名。GitHub 可能要求在浏览器登录进行授权。不要把账号密码直接粘贴给任何人。

如果电脑没有 Git，可以安装 Git for Windows 或 GitHub Desktop，选择该项目目录后创建仓库并发布到 GitHub。

## 3. 打开 GitHub Pages

打开仓库的 **Settings → Pages**，在 **Build and deployment → Source** 选择 **GitHub Actions**。

然后到仓库的 **Actions** 标签，打开 **Deploy 游历本 to GitHub Pages**，如果自动任务没有触发，点击 **Run workflow**。

成功后网站地址通常是：

`https://你的GitHub用户名.github.io/你的仓库名/`

如果仓库名恰好是 `你的GitHub用户名.github.io`，网站地址则是 `https://你的GitHub用户名.github.io/`。

## 4. 分享链接

把 GitHub Pages 的网址发给组员/老师即可。他们不需要下载源码或安装 VS Code。手机可直接打开这个网址进行触屏体验；可以把网址制作成二维码放进汇报 PPT。

## 重要说明

- **原型不是线上多人实时同步系统**。第 20 轮的邀请、模拟好友加入和协作身份切换都在**当前浏览器**本地模拟，发链接不能把一台设备的修改同步到另一台设备。
- 保存的行程、手账、模拟订单依赖浏览器本地存储，每个人/每台设备的数据独立。清理浏览器网站数据可能丢失这些演示记录。
- 这是纯静态部署，不会部署数据库、账号系统或后端服务。
- **所有写死的 `/images/` 资源路径已调整为适配仓库子路径**，并使用 HashRouter 避免内页刷新 404。
- 仓库开源前，先检查有没有加入私人信息、API 密钥或不允许公开传播的素材。本版本没有添加任何密钥。
- 如果打开后看不到最新改动，尝试手机浏览器刷新或使用无痕窗口。

## 本地运行方式（保持不变）

```bash
npm install
npm run dev
```

测试：

```bash
npm test
```

## 项目部署适配点

- `.github/workflows/deploy.yml`：新增自动测试、构建和部署脚本；每次 push 到 `main` 分支会重新发布。
- `vite.config.js`：根据 GitHub 仓库名自动设置网站子路径（本地不受影响）。
- `src/main.jsx`：从 `BrowserRouter` 改为 `HashRouter`，兼容 GitHub Pages 刷新。
- `src` 中静态图片地址：改为通过统一的 `SITE_BASE` 辅助模块计算，适配 `/仓库名/`，不修改画面和素材。

其他视觉设计、交互界面和功能数据维持第二十轮原样。
