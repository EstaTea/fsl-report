# 佛山照明 SAP S/4HANA 升级及业务诊断咨询方案 — 单文件离线版说明

## 交付文件
`佛山照明SAP-S4HANA升级及业务诊断咨询方案_单文件.html`（约 4.1 MB）

## 使用方式
直接用浏览器（Chrome / Edge / Safari 均可）双击打开即可播放，无需服务器、无需解压。

## 已内联资源（离线可用）
- CSS：fonts.css、base.css、corporate-clean 主题、animations.css
- JS：runtime.js（翻页/全屏/总览/计时器）
- 图片：blue-geo.png、fsl-cloud-docs.png、quadrant-23-scenarios.png、sankey_v4.png
- 16 个图表 iframe 均改为 `srcdoc` 内联，并内联 Chart.js 4.4.0、d3 v7、d3-sankey 等依赖库

## 仍需联网的部分
- 页脚两个 kanban 工具（DCMM 成熟度工具、成熟度评估工具）依赖 GitHub API / 业务 API，因此仍指向 `https://estatea.github.io/fsl-report/kanban/...`。若在无网环境打开，这两个 iframe 会显示加载失败，不影响主 PPT 放映。

## 验证
已通过 Playwright 在 `file://` 下验证：封面、桑基图、23 场景四象限、24 项目优先级、调研分析等页均正常渲染，控制台无 JavaScript 报错。
