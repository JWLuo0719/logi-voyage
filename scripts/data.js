window.BLOG_POSTS = [
  {
    id: "ai-fix-ai",
    title: "Claude Code 挂了，我让 Codex 来修它",
    category: "AI 工具",
    date: "2026-05-06",
    readTime: "4 min",
    summary: "VSCode 里的 Claude Code 插件突然打不开，我换了个思路——让 Codex 来修它。两分钟定位问题，顺手写了个修复脚本。",
    cover: "assets/hero-gpt-image2.png",
    content: [
      {
        heading: "事情是这样开始的",
        paragraphs: [
          "那天我打开 VSCode，Claude Code 插件一直卡在加载界面。点右上角图标还报错：command 'claude-vscode.editor.openLast' not found。",
          "正常思路是去搜、去翻 issue、去回退版本。但我换了个思路——打开 Codex，把报错信息直接丢给它，让它来修。"
        ]
      },
      {
        heading: "结果出乎意料地顺",
        paragraphs: [
          "Codex 两分钟就定位并解决了问题，我还顺手让它写了一个修复脚本。整个过程可谓酣畅淋漓。",
          "虽然这个脚本可能没什么用了（截至发布前 CC 已经出了新版本），但这个思路值得记下来：当你的 AI 工具出问题时，用另一个 AI 工具来修它。"
        ]
      },
      {
        heading: "为什么这个思路成立",
        paragraphs: [
          "你可能觉得这很绕——AI 修 AI，靠谱吗？其实比你想的靠谱。原因很简单：AI 工具的报错信息对人类来说是天书，但对另一个 AI 来说就是它的母语。你把 log 甩过去，它比你先看懂。",
          "这个思路不止适用于 Claude Code。你用 Cursor 出问题了，可以让 Claude 帮你看 config；你用 Copilot 卡住了，可以让 GPT 帮你分析。本质上就是——让擅长读代码的工具去读另一个工具的代码。"
        ]
      },
      {
        heading: "延伸一步",
        list: [
          "两个工具都装，互为备份，才是最稳的方案。",
          "遇到报错先别慌，把完整 log 丢给另一个 AI，往往比自己搜快得多。",
          "修复脚本可以私信我要，类似的插件加载失败都能用。"
        ]
      }
    ]
  },
  {
    id: "codex-install-guide",
    title: "Codex 安装教程：比 Claude Code 便宜 36 倍，国内直连",
    category: "AI 工具",
    date: "2026-05-08",
    readTime: "5 min",
    summary: "为什么我从 Claude Code 切换到 Codex？便宜 36 倍、对中国用户更友好、两个工具互为备份。附完整安装步骤。",
    cover: "assets/hero-gpt-image2.png",
    content: [
      {
        heading: "为什么用 Codex 而不用 Claude Code",
        paragraphs: [
          "你可能会问，Claude Code 不是更强、网上教程更多吗，为什么要用 Codex？原因有三。",
          "第一，便宜得多。CC 和 Codex 本身的官方定价就有 6 倍以上的差距，但真正拉开差距的是中转站——我现在用的中转站，GPT 模型跟官方价差了 36 倍。性价比才是王道。",
          "第二，对中国用户更友好。OpenAI 是国外御三家大模型中对中国最友好的，而 Claude 则是封号、政策最严的。第三，更保险——两个工具都装，互为备份、优势互补，才是最稳的方案。"
        ]
      },
      {
        heading: "VS Code 插件版安装步骤",
        list: [
          "第一步：装 Codex 插件。打开 VS Code，扩展市场搜 Codex，找到 OpenAI 出的那个，安装。装完侧边栏会多一个图标，国内网络也能加载成功。",
          "第二步：装 ccswitch。加载完后会提示登录或使用 API Key，先关掉 VS Code，去 GitHub 搜索 cc-switch 下载安装——这是一个方便切换中转站的工具。",
          "第三步：注册 RightCode 中转站。老牌中转站，GPT 模型价格是官方的 1/36，按量计费，最低起充一块钱。注册时填邀请码 voyagekit，充值可多获得 5% 额度。",
          "第四步：在令牌管理创建密钥，打开 ccswitch，点击 GPT 图标，右上角 + 号添加供应商，选预设的 RightCode，填入 API Key，重新打开 VS Code 里的 Codex 验证是否可用。"
        ]
      },
      {
        heading: "价格对比参考",
        paragraphs: [
          "GPT-4.1 输入 ¥0.5 vs 官方 ~¥18，输出 ¥3 vs 官方 ~¥108，差距约 36 倍。这不是小数目——如果你每天都在用 AI 写代码，一个月下来差的是几百块。",
          "CC 更强但贵，Codex 更省但够用。两个都装，根据任务选工具，才是现阶段最合理的配置。"
        ]
      }
    ]
  },
  {
    id: "css-layout-notes",
    title: "从课程练习到成品页面：我整理 CSS 布局的方法",
    category: "学习记录",
    date: "2026-04-12",
    readTime: "6 min",
    summary: "把 Flex、Grid 和常见对齐技巧整理成一套更容易复用的页面搭建流程。",
    cover: "assets/hero-gpt-image2.png",
    content: [
      {
        heading: "为什么要重新整理布局知识",
        paragraphs: [
          "刚开始学 CSS 的时候，我经常记住属性名，却不清楚它们应该在什么场景下使用。后来我发现，真正决定效率的不是记住多少属性，而是能不能把页面拆成稳定的区域。",
          "所以我把页面拆分过程总结成三步：先看结构层级，再看主轴和交叉轴，最后补视觉细节。这样写页面时会更有秩序。"
        ]
      },
      {
        heading: "我常用的页面拆解顺序",
        list: [
          "先确认页面的大区域，例如头部、内容区、侧边栏和底部。",
          "判断区域之间更适合使用 Flex 还是 Grid。",
          "把留白、边框、阴影和交互状态放在结构稳定之后处理。"
        ]
      },
      {
        heading: "这篇笔记带来的变化",
        paragraphs: [
          "当我重新整理这些方法之后，再做多页面网站时会更快进入状态，也更容易保证风格统一。",
          "这次个人博客项目里，首页 hero、文章卡片和详情页侧栏都用了类似的拆解思路。"
        ]
      }
    ]
  },
  {
    id: "visual-system-notes",
    title: "为个人博客建立一套蓝橙色的视觉系统",
    category: "设计观察",
    date: "2026-04-18",
    readTime: "5 min",
    summary: "记录这次课程大作业中的主色、版式和氛围设计，避免页面只停留在简单模板风格。",
    cover: "assets/hero-gpt-image2.png",
    content: [
      {
        heading: "颜色选择",
        paragraphs: [
          "我选择蓝橙配色，是因为它既能体现未来感，也有足够鲜明的对比。蓝色负责科技氛围，橙色负责强调和节奏。",
          "在实际页面里，我让浅色背景承载内容，再用高亮边框和按钮制造视觉记忆点。"
        ]
      },
      {
        heading: "排版目标",
        paragraphs: [
          "博客不是海报，所以页面不能只剩风格，还要方便阅读。因此正文部分的对比度、段落间距和卡片信息层级都要稳定。",
          "我把更有个性的设计放在 hero、导航、卡片边缘和时间线这些区域，正文阅读区则保持清晰。"
        ]
      }
    ]
  },
  {
    id: "javascript-blog-data",
    title: "用 JavaScript 管理博客文章数据和详情页跳转",
    category: "开发实践",
    date: "2026-04-22",
    readTime: "7 min",
    summary: "使用统一的数据数组驱动首页推荐、文章列表和文章详情页，减少重复维护。",
    cover: "assets/hero-gpt-image2.png",
    content: [
      {
        heading: "为什么统一管理数据",
        paragraphs: [
          "如果每个页面都手写一份文章内容，后面维护会非常麻烦。把文章数据放到同一个脚本里，可以让多个页面共用同一份信息。",
          "首页负责展示精选文章，文章列表页负责筛选和搜索，详情页则根据参数读取对应内容。"
        ]
      },
      {
        heading: "交互实现思路",
        list: [
          "读取地址栏中的 id 参数。",
          "在文章数组中查找对应文章对象。",
          "如果找到就渲染标题、摘要和正文；如果没有找到则显示提示信息。"
        ]
      }
    ]
  },
  {
    id: "student-project-rhythm",
    title: "课程项目开发时，我怎样安排页面、功能和汇报节奏",
    category: "学习记录",
    date: "2026-04-26",
    readTime: "4 min",
    summary: "把课程大作业拆成页面结构、功能实现、文档整理和视频录制四个阶段，避免最后赶工。",
    cover: "assets/hero-gpt-image2.png",
    content: [
      {
        heading: "先完成能跑通的版本",
        paragraphs: [
          "课程项目最怕一开始想得太满，结果核心页面没有落地。所以我更倾向于先做一个完整但简洁的版本，再逐步提升视觉和交互。",
          "这样既能保证有可提交成果，也方便后面围绕评分点继续加分。"
        ]
      },
      {
        heading: "四段式推进",
        list: [
          "第一阶段：完成四个核心页面的结构与跳转。",
          "第二阶段：补筛选、搜索、推荐等交互功能。",
          "第三阶段：统一风格，优化响应式细节和动画。",
          "第四阶段：整理课程报告和演示视频脚本。"
        ]
      }
    ]
  }
];
