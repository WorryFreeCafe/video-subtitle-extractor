# video-subtitle-extractor

Chrome Extension：从网页视频中提取可访问的软字幕，并导出 SRT / TXT。

## 支持范围

- HTML5 原生 `<track>` 字幕（VTT）
- Bilibili 播放器接口返回的 JSON 字幕
- YouTube 播放器字幕轨道（JSON3 / XML 字幕响应）

## 使用方法

1. 在 Chrome 扩展管理页开启开发者模式，选择“加载已解压的扩展程序”并选择项目目录。
2. 打开 Bilibili 或 YouTube 视频页面，刷新页面后播放视频，等待播放器加载。
3. 点击扩展图标；检测到字幕轨道后，可分别导出 SRT 或纯文本 TXT。

## 注意事项

- 仅能提取播放器实际提供且当前可访问的软字幕；没有字幕轨道、字幕尚未加载、需要登录/权限或平台接口变化时，可能无法提取。
- 当前不支持对画面中烧录的硬字幕进行 OCR。
- 本次对 Bilibili / YouTube 的支持需要在对应视频页面刷新后生效。扩展不会自动合并到主分支；修复请通过独立分支的 Pull Request 审核。
