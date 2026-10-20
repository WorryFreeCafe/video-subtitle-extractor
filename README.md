# 软字幕提取器 (subtitle-soft-extract)

Chrome 浏览器插件，提取网页 `<video>` 原生软字幕（WebVTT），导出为 SRT 或纯文本。

## 功能

- 自动扫描页面中所有 `<video>` 的 `<track kind="subtitles/captions">` 字幕轨
- 一键导出 SRT 字幕文件
- 一键导出纯文本 TXT（去掉时间轴）

## 安装（开发模式）

1. 打开 Chrome，地址栏输入 `chrome://extensions/`
2. 右上角开启「开发者模式」
3. 点击「加载已解压的扩展程序」，选择本文件夹
4. 打开带字幕的视频页面，点击插件图标即可导出

## 测试

直接用浏览器打开 `test.html`，点击插件图标测试。

## 文件结构

```
subtitle-soft-extract/
├── manifest.json      # 插件配置 (Manifest V3)
├── popup.html         # 弹窗界面
├── popup.js           # 弹窗逻辑
├── content.js         # 注入页面脚本，扫描 track
├── background.js     # Service Worker，下载与格式转换
├── lib/vtt2srt.js    # VTT 转 SRT / TXT
└── test.html         # 测试页面
```

## 后续计划

- [ ] 网络请求劫持，捕获播放器动态加载的字幕 URL（非原生 track 场景）
- [ ] 硬字幕 OCR（参考 video-subtitle-extractor 的帧采样 + onnxruntime-web）
