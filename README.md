# HAKAMORI
HAKAMORI 个人主页
# HAKAMORI

我的个人主页项目，借助 Codex 逐步设计和制作。

整体采用 endfield-ui 工业科技风格，启动动画参考了《明日方舟》相关影像的视觉表现。

## 当前内容

- 陆地粒子地球与开机按钮
- 粒子双螺旋、身份确认和模拟进度动画
- 方尖碑 Logo 生长、文字闪切与斜纹虚影
- 鼠标跟随的 3D 主页倾斜
- 鼠标掉落粒子效果

启动动画已完成，个人主页和作品集功能将继续完善。

## 技术

使用 HTML、CSS、原生 JavaScript、SVG 和 Canvas 实现。

## 本地运行

下载仓库并解压，在项目文件夹内打开终端。

安装了 Python 的电脑可以运行：

    python -m http.server 8000

然后用浏览器打开：

    http://localhost:8000

点击开机按钮继续播放动画，刷新页面可以重播。

## 文件说明

- index.html — 页面结构
- style.css — 主页样式
- intro.css — 启动动画样式
- app.js — 动画流程与交互
- particles.js — 粒子效果
- assets/ — 图片、字体、Logo 和地理数据

## 素材说明

Saira 和 Noto Sans SC 字体的许可证保存在 assets/fonts/ 中。
地球陆地轮廓使用 Natural Earth 数据。
