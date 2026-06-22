# FSL 佛山照明 · 数字化转型项目工作台

## 如何新增报告

1. 把 HTML 文件放入对应目录（如 `consulting/blueprint/ea-report.html`）
2. 打开 `MANIFEST.json`，找到对应的 doc 条目，把 `"status": "todo"` 改为 `"status": "done"`
3. 在本地运行 `python3 build.py` 重新生成所有索引页
4. `git add -A && git commit -m "Add [报告名称]" && git push`

## 目录结构

```
/
├── index.html              # 工作台首页
├── MANIFEST.json           # 交付物清单（唯一配置文件）
├── build.py                # 重新生成所有页面的脚本
├── consulting/             # 管理咨询交付物
│   ├── diagnosis/          # 现状诊断阶段
│   ├── blueprint/          # 蓝图架构设计阶段
│   ├── solutions/          # 专项方案设计阶段
│   └── roadmap/            # 实施路径规划阶段
├── sap/                    # SAP实施交付物
│   ├── prepare/            # 项目准备阶段
│   ├── blueprint/          # 蓝图设计阶段
│   ├── realize/            # 系统实现阶段
│   └── deploy/             # 上线切换阶段
└── research/               # 行业研究参考资料
```
