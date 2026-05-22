window.BLOG_POSTS = [
  {
    id: "ai-fix-ai",
    title: "Claude Code 挂了，我让 Codex 来修它",
    category: "AI 工具",
    date: "2026-05-22",
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
    title: "Codex 国内版安装指南：三个版本怎么选、怎么装、怎么省到最多钱",
    category: "AI 工具",
    date: "2026-05-08",
    readTime: "15 min",
    summary: "Codex 有三个版本（CLI、VS Code 插件、桌面版），本文解决怎么选、怎么装、怎么把成本压到最低（搭配中转站，GPT 模型价格可以是官方的 1/36）。",
    cover: "assets/hero-gpt-image2.png",
    content: [
      {
        heading: "为什么选 Codex 而不是 Claude Code",
        paragraphs: [
          "Claude Code 综合能力更强，Codex 性价比更高、对国内用户更友好。",
          "价格差距巨大——GPT-5.4 的官方价格是输入 $2.50/百万 token、输出 $15.00/百万 token，换算成人民币大约是输入 ¥18、输出 ¥108。通过中转站使用，价格可以降到输入 ¥0.5、输出 ¥3——36 倍的差距。",
          "对中国用户更友好。在主流的几家国外大模型厂商中，OpenAI 对中国用户的态度算是相对正常的。你正常注册、正常使用，基本不会出问题。Claude 这边封号比较频繁，政策限制也多。",
          "互为备份更保险。Claude Code 在代码理解和复杂推理上确实更强，Codex 在性价比和可用性上更有优势。最稳的方案是两个都装，一个挂了另一个顶上。"
        ]
      },
      {
        heading: "三个版本的区别",
        list: [
          "CLI 版（命令行版）：适合终端重度用户、服务器上写代码的人。在项目目录下直接输入命令，让 Codex 帮你改代码、查文件、跑脚本。安装方式：npm i -g @openai/codex。",
          "VS Code 插件版：适合日常用 VS Code 写代码的开发者。装完之后在 VS Code 侧边栏多一个 Codex 面板，直接在编辑器里跟 AI 对话。可以跟 Claude Code 插件共存。",
          "桌面版：适合把 Codex 当独立工作台的人。一个独立的应用程序，不依赖任何编辑器，适合同时管多个项目。去 OpenAI 官网下载对应系统的安装包。",
          "推荐：不确定的话先装 VS Code 插件版（最通用）。如果你已经装过 Claude Code 的 CLI 和插件版，装 Codex 会轻松很多。"
        ]
      },
      {
        heading: "VS Code 插件版安装步骤",
        list: [
          "第 1 步：安装 Codex 插件。打开 VS Code，按 Ctrl+Shift+X 打开扩展市场，搜索 Codex，找到 OpenAI 官方出的那个，点安装。装完后侧边栏会多一个 Codex 图标。",
          "第 2 步：安装 ccswitch。打开后会提示登录 ChatGPT 账号或者填 API Key，先别急着登录——我们用中转站的方式更省钱。ccswitch 是一个开源的模型切换工具，让你把 Codex 的 API 请求转发到中转站。去 GitHub 搜索 cc-switch 或直接访问 https://github.com/farion1231/cc-switch 下载安装。",
          "第 3 步：注册中转站。推荐 RightCode（https://www.right.codes/register?aff=voyagekit）——老牌中转站，按量计费，最低起充 1 块钱。GPT-5.4 输入 ¥0.5/百万 token、输出 ¥3/百万 token，是官方价格的 1/36（价格以注册时中转站实际显示为准）。注册时填写邀请码 voyagekit，以后每次充值都可以多获得 5% 的额度。注册后在「获取订阅」先充一块钱，然后在「令牌管理」创建一个 API Key。",
          "第 4 步：配置 ccswitch。打开 ccswitch，点击 GPT 图标，点击右上角的 + 号添加供应商，在预设供应商列表中找到 RightCode，填入 API Key，点击添加。",
          "第 5 步：验证使用。重新打开 VS Code 里的 Codex，选择模型，试试能不能正常对话。如果能正常回复，说明配置成功。"
        ]
      },
      {
        heading: "CLI 版与桌面版安装",
        list: [
          "CLI 版：先确保电脑装了 Node.js，终端执行 npm i -g @openai/codex，装完输入 codex，首次运行会引导你登录或配置 API Key，同样可以通过 ccswitch 接中转站。",
          "桌面版：去 OpenAI 官网下载 Codex 桌面版（支持 Windows 和 macOS），Windows 用户也可以在微软商店上下载。安装后打开，需要加载一段时间，桌面版跟插件版共用同一个账号，不用重复配置。"
        ]
      },
      {
        heading: "常见问题",
        list: [
          "国内网络能用吗？可以。Codex 的 VS Code 插件版在国内网络下能加载成功，只是加载较慢。",
          "中转站安全吗？中转站本质上是 API 代理，你的代码不会经过中转站——它只是转发 API 请求。但建议选择老牌、口碑好的中转站。",
          "Codex 和 Claude Code 能同时装吗？完全可以，而且建议同时装。两个工具各有长短，互为备份最稳。",
          "ccswitch 还支持哪些中转站？ccswitch 内置了多个中转站的预设，rightcode 只是其中之一。你也可以手动添加其他中转站。"
        ]
      },
      {
        heading: "总结",
        paragraphs: [
          "Claude Code 更强，但是 Codex 更好——性价比更高、对国内用户更友好。",
          "总共 5 步，很快就能搞定。以后每次用 Codex 都是中转站的价格，省下来的钱相当可观。"
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
  },
  {
  "id": "1003",
  "title": "在浏览器上清除特定网站的缓存",
  "category": "学习记录",
  "date": "2026-05-21",
  "readTime": "3min",
  "summary": "记录一下如何在浏览器上清除特定网站的缓存",
  "cover": "",
  "content": [
    {
      "heading": "缘起",
      "paragraphs": [
        "自从之前的公众号——【学游纪】，被永久封禁之后我已经很久没有写过文章了，由于最近想更新有关codex+中转站的视频在抖音一直过不了审核而在其他平台也反响平平，就又动起了些公众号的念头。",
        "在浏览器上先是登陆之前被封的公众号，果不其然还是那个醒目的大红感叹号+那句刺骨的话——账号被永久封禁~",
        "写新文章之前，干了最后一件事——把账号唯一一次申诉机会用了‘官方爸爸再给一次机会，这次洗心革面，重新做人！！！’",
        "之后便准备切换小号写文章了，结果好家伙——返回首页提示：没有权限访问该页面，请点击返回首页，点击后又切回这个界面，直接死循环了！"
      ]
    },
    {
      "image": {
        "src": "assets/QQ20260521-210250.png"
      },
      "heading": ""
    },
    {
      "heading": "解决方法",
      "paragraphs": [
        "这时我就想到应该是网站的缓存保留了我之前账号的登录信息所致，所以只要删掉这个网站的缓存就行了。",
        "于是我查到了这篇文章https://blog.csdn.net/Ussim/article/details/108377633，按照指示点击F12->右上角找到应用程序->存储->清除网站数据，这下就成功切回登陆界面了~"
      ]
    },
    {
      "image": {
        "src": "assets/QQ20260522-103634.png"
      },
      "heading": ""
    }
  ]
}
];
