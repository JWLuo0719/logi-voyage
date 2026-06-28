window.BLOG_POSTS = [
  {
    id: "codex-desktop-reconnect-sandbox-fix",
    title: "Codex Desktop 一直 Reconnecting，我把之前的代理补丁拆了",
    category: "AI 工具",
    date: "2026-06-28",
    readTime: "8 min",
    summary: "一次很像自找麻烦的排障：为了解决 Codex Desktop 的 websocket 重连，我曾经往 .codex 里塞代理变量，后来它又反过来影响 Windows sandbox。最后的修法不是继续加代理，而是拆掉旧补丁，改成 HTTP-only provider。",
    cover: "assets/hero-gpt-image2.png",
    content: [
      {
        heading: "问题不是突然来的",
        paragraphs: [
          "这次问题有点尴尬，因为坑是我自己早些时候埋下的。",
          "最开始 Codex Desktop 每次打开都会 Reconnecting，好像要等五轮才肯正常工作。看日志和现象，大概率是 websocket 先连不上，等它重试超时后才切到能通信的 HTTP。为了绕过这段等待，我当时在 C:\\Users\\34590\\.codex\\.env 里写了代理变量。",
          "当时看起来很合理：HTTP_PROXY、HTTPS_PROXY、ALL_PROXY 都指到本机代理端口。重连等待确实少了。问题是，后来 Codex Desktop 更新后，这个老补丁开始影响 Windows sandbox。"
        ]
      },
      {
        heading: "真正坏掉的是 sandbox",
        paragraphs: [
          "我后来看到一篇 Linux.do 帖子，里面的症状跟我很像：Codex Desktop 代理配置会被 sandbox 初始化过程读到，然后写进 .codex\\.sandbox\\setup_marker.json 里的 proxy_ports。",
          "我这台机器上检查到的现场也对上了。.env 还在，里面是 127.0.0.1:7897。setup_marker.json 里也出现了 proxy_ports: [7897]。这就解释了为什么问题不只是联网慢，还可能牵扯到 apply_patch、沙箱初始化和一些奇怪的模块错误。",
          "这类问题最麻烦的地方，是它看起来不像代理问题。你看到的是工具调用失败、沙箱不正常、编辑链路卡住，但源头其实是一个几天前为了加速启动写进去的 .env。"
        ]
      },
      {
        heading: "我没有直接改，先做了备份",
        paragraphs: [
          "这一步很重要。Codex 的配置目录里不只有一个 config.toml，还有 sessions、state_5.sqlite、sandbox marker。乱改虽然快，但回滚会很痛苦。",
          "所以我先把 .env、.sandbox\\setup_marker.json、config.toml、sessions、state_5.sqlite 和 sqlite\\state_5.sqlite 都备份到了 C:\\Users\\34590\\.codex\\backups\\fix-sandbox-reconnect-20260625-222725。",
          "备份完再动手，心态完全不一样。坏了能退，才敢把问题拆干净。"
        ]
      },
      {
        heading: "第一刀：删掉 .env 代理",
        paragraphs: [
          "我先删除了 C:\\Users\\34590\\.codex\\.env。这个文件里只有三行代理变量，没有别的配置，所以可以直接拿掉。",
          "接着把 C:\\Users\\34590\\.codex\\.sandbox\\setup_marker.json 里的 proxy_ports 从 [7897] 改成 []。这一步是为了把 sandbox 里已经记录下来的代理端口清掉。",
          "同时我检查了 Windows 用户级和机器级环境变量，没有发现持久的 HTTP_PROXY、HTTPS_PROXY、ALL_PROXY、NO_PROXY。也就是说，重启 Codex 后，这些代理变量不应该再被新进程继承。"
        ]
      },
      {
        heading: "第二刀：别让 Codex 再走 websocket",
        paragraphs: [
          "删代理只能解决 sandbox 被污染的问题。最初的 Reconnecting 还要另想办法。",
          "这次我没有继续用 .env 代理去绕，而是在 C:\\Users\\34590\\.codex\\config.toml 里加了一个 provider：chatgpt_http。它仍然走 ChatGPT/Codex 的官方登录，但显式写了 supports_websockets = false。",
          "关键配置其实就几项：model_provider = \"chatgpt_http\"，base_url 指向 https://chatgpt.com/backend-api/codex，wire_api = \"responses\"，requires_openai_auth = true，supports_websockets = false。这样 Codex 就不用先在 websocket 上耗几轮。"
        ]
      },
      {
        heading: "还有一个容易漏掉的点：旧会话",
        paragraphs: [
          "改 model_provider 之后，旧线程可能会因为 provider 名不一样而在界面里消失。帖子里也有人提到这个坑。",
          "我检查了 sessions 和两个 SQLite 数据库，确实还有 model_provider = openai 的记录。备份之后，我只把 openai 精确改成 chatgpt_http，custom 和 rightcode 没碰。",
          "最后的结果是：17 个 session 文件里的 81 处记录被迁移；C:\\Users\\34590\\.codex\\state_5.sqlite 和 C:\\Users\\34590\\.codex\\sqlite\\state_5.sqlite 里的 openai 线程也都改成了 chatgpt_http。这个动作不一定每个人都需要，但如果你很在意旧会话能不能继续显示，就别漏。"
        ]
      },
      {
        heading: "重启后的检查",
        paragraphs: [
          "改完后我重启 Codex Desktop，再检查了一遍。结果比较干净：.env 没有复活，当前 Codex 进程里没有 HTTP_PROXY、HTTPS_PROXY、ALL_PROXY、NO_PROXY，Windows 用户级和机器级环境变量也没有这些代理变量。",
          "setup_marker.json 里的 proxy_ports 还是空数组。config.toml 能正常解析，当前 provider 是 chatgpt_http，supports_websockets 仍然是 false。",
          "我还做了一个很小的 apply_patch 冒烟测试：创建 work/apply-patch-smoke-test.txt，再删掉。创建和删除都成功。至少从这个结果看，sandbox 和编辑链路已经恢复正常。"
        ]
      },
      {
        heading: "如果你也遇到这个问题",
        list: [
          "先别急着继续加代理。先检查 C:\\Users\\你的用户名\\.codex\\.env 有没有 HTTP_PROXY、HTTPS_PROXY、ALL_PROXY、NO_PROXY。",
          "再看 .codex\\.sandbox\\setup_marker.json 里的 proxy_ports。如果那里有本机代理端口，基本就对上了。",
          "动手前先备份 .env、setup_marker.json、config.toml、sessions 和 state_5.sqlite。",
          "删掉只用于代理的 .env，把 proxy_ports 改成空数组。",
          "在 config.toml 里新增 HTTP-only provider，并设置 supports_websockets = false。",
          "重启 Codex Desktop 后再检查一次环境变量、proxy_ports 和 apply_patch。不要只看有没有报错，最好做一次实际编辑测试。"
        ]
      },
      {
        heading: "顺手说一下这篇文章怎么写的",
        paragraphs: [
          "我后来想把这次排障写成文章，但技术记录一不小心就会写成很像 AI 的说明书：背景、原因、步骤、总结，整整齐齐，读起来没什么人味。",
          "所以我顺手找了一下可用的 skill。市场里能搜到 softaworks/agent-toolkit@humanizer、remove-ai-style、humanize-chinese 之类的东西，不过我本地已经有 humanizer-zh，就没有再装新的。",
          "我用它的思路处理这篇稿子：少用“关键”“显著”“完整解决方案”这类空泛词，多保留当时的检查结果和路径；少写万能建议，多写我实际改了什么；不要把故事修得太圆，因为这件事本来就有点绕。"
        ]
      },
      {
        heading: "最后",
        paragraphs: [
          "这次排障给我的提醒很简单：临时补丁最好写清楚来龙去脉，不然几天后它就会变成新的问题。",
          "当时我为了跳过 websocket 重连，把代理变量塞进 .codex\\.env。它确实解决过一个问题。后来版本变了，sandbox 的行为也变了，旧补丁就开始反咬一口。",
          "最后真正有效的修法，不是再叠一层补丁，而是把旧补丁拆掉，把通信方式明确改成 HTTP，再把会话和 sandbox 状态整理干净。排障有时候就是这样，越急着往上加东西，越容易把自己绕进去。"
        ]
      }
    ]
  },
  {
    id: "xianyu-wecom-ops-retrospective",
    title: "从闲鱼自动化到企业微信：一次把项目越做越窄的复盘",
    category: "项目复盘",
    date: "2026-06-17",
    readTime: "12 min",
    summary: "从最初的闲鱼自动化代租想法，到 DeltaXianyuOps 的网站后台歪路，再到 WeComXianyuOps 的企业微信路线：这是一篇关于边界、平台规则、真实工作流和自动化幻觉的复盘。",
    cover: "assets/hero-gpt-image2.png",
    content: [
      {
        heading: "一开始，我想做的是一个很顺手的自动化工具",
        paragraphs: [
          "这个项目最早不是从技术开始的，而是从一个很具体的运营痛点开始的：闲鱼上做双贴租赁，号主资料、交易贴、押金贴、买家付款、拉群、验号、退款、结算，所有环节都散在聊天、截图和人工记忆里。",
          "最初在 D:\\Project\\闲鱼自动化代租 里冒出来的想法很朴素：既然这些流程重复度这么高，能不能做一个工具，把能自动的都自动掉？最好能读取资料、生成文案、识别订单、提醒我下一步做什么，甚至自动把整个流程串起来。",
          "现在回头看，这个想法没有错。错的是我一开始把“自动化”想得太大，把“业务真实发生在哪里”想得太轻。"
        ]
      },
      {
        heading: "DeltaXianyuOps：我把问题做成了一个后台，却没有真正贴近现场",
        paragraphs: [
          "第二阶段是 D:\\Project\\DeltaXianyuOps。这个阶段其实做出了不少东西：有本地 /ops 工作台，有账号解析，有订单解析，有双贴模型，也把交易贴和押金贴看成同一个租赁案例的两个凭证。这些业务抽象是有价值的。",
          "但它也暴露了一个问题：我太容易把一个运营工具做成“网站后台”。有页面、有接口、有服务层、有数据模型，看起来越来越像一个产品，却离最初那个“我在企业微信、闲鱼、聊天窗口之间来回切换”的真实现场越来越远。",
          "这就是所谓走歪路的地方。不是代码错了，而是入口错了。真实工作流不是从网页登录开始的，也不是让买家或号主来使用我的系统。真实工作流是运营者本人在聊天里收到资料，在闲鱼里完成平台动作，在群里保留证据。网站后台并不是第一入口。"
        ]
      },
      {
        heading: "真正难的不是写代码，是承认哪些地方不能自动",
        paragraphs: [
          "这一路最大的经验教训，是自动化项目必须先画边界。尤其是闲鱼这种平台交易场景，很多动作不是“技术上能不能做”，而是“做了以后风险是不是不可控”。",
          "自动登录闲鱼、抓包逆向、读取私有 token、自动发号、自动确认交易、自动退款，这些看起来都像自动化的捷径，但它们会把项目推到一个非常危险的位置。平台风控、交易纠纷、账号安全、客户隐私，任何一个点出问题，都不是一个脚本能兜住的。",
          "所以后来我给项目定下了很硬的边界：不绕过平台风控，不抓包逆向，不自动登录闲鱼，不自动发号，不自动确认交易或退款，不保存明文账号密码、二次验证码、买家敏感身份证明。系统只做解析、提醒、证据、任务和官方授权范围内的同步。"
        ]
      },
      {
        heading: "WeComXianyuOps：把企业微信当成运营调度中心",
        paragraphs: [
          "第三阶段是现在的 D:\\Project\\WeComXianyuOps。我决定不再迁移旧网站后台，而是重新从企业微信这条路出发。这个选择背后的核心判断是：企业微信更接近真实现场。",
          "企业微信不是成交平台，闲鱼才是。企业微信也不是替代号主和买家的登录平台，它更适合作为运营调度中心：收资料、发提醒、解析文本、创建任务、沉淀客户、记录证据、把下一步动作推给运营者。",
          "这个项目现在的核心公式很简单：企业微信等于运营调度中心，闲鱼等于成交与平台履约发生地，本系统等于解析、任务、提醒、话术、证据和可控同步层。"
        ]
      },
      {
        heading: "企业微信这条路教会我的几件事",
        list: [
          "自建应用消息是最容易跑通的第一步：CorpID、AgentId、Secret、接收人 UserID 配好后，就能发送测试消息和今日待办摘要。",
          "可信 IP 是真实 API 的第一道门槛：本机系统代理、网络出口变化都会导致企业微信返回 60020，正式使用最好部署到固定公网 IP。",
          "回调比发送消息复杂得多：需要公网 HTTPS、Token、EncodingAESKey、签名校验、AES 解密和加密回复，临时 tunnel 只能用于测试。",
          "客户联系 API 能识别外部联系人、跟进成员、客户列表和客户详情，但不能直接读取成员与客户的一对一聊天内容。",
          "微信客服才是“系统发固定话术、客户回复、系统读取并解析”的官方自动化入口，但前提是客户先进入客服会话，客服不能凭空主动开聊。",
          "会话内容存档是另一条路，但它是合规重方案，需要开通、告知、SDK 解密和更高的管理成本，不适合作为默认起步方案。"
        ]
      },
      {
        heading: "一次真实测试暴露的误区",
        paragraphs: [
          "中途我犯过一个很典型的错误：客户联系 API 查到了阿游，我就继续用手动注入的号主资料和订单文本跑完整工作流，生成了价格、押金、双贴任务和配对结果。",
          "后来我意识到，这其实混淆了两种事实。真实事实是：企业微信能找到阿游这个外部联系人。模拟事实是：我手动给系统塞了一段“VX区、黑鹰、纯币38000w、押金1000”的账号资料。前者来自 API，后者来自测试输入，不能混在一起说。",
          "这个错误逼着我做了一个很重要的修正：清理历史模拟数据，并且让解析器在缺少平台、段位、纯币、押金这些关键字段时，只创建“待补资料”任务，不再给默认普通号、不再生成押金建议、不再假装可以发帖。"
        ]
      },
      {
        heading: "现在项目真实走到了哪里",
        paragraphs: [
          "目前 WeComXianyuOps 已经能做这些事：企业微信应用消息推送、今日待办摘要、文本指令解析、号主资料解析、闲鱼订单文本导入、双贴保守配对、任务完成/推迟/备注、证据索引、客户联系查询、微信客服自动化准入检查和客服接入链接生成。",
          "它也真实查到了客户“阿游”，拿到了 external_userid，并确认跟进成员是 LuoJiWei。微信客服也已经能生成接入链接。系统可以把链接推送给运营者，由运营者转发给客户；客户进入客服会话并按格式回复后，系统再拉取消息解析账号资料。",
          "但它还没有走到我最开始幻想的那个“全自动闲鱼代租系统”。更准确地说，它变成了一个更窄、更克制、更贴近现实的运营助手。"
        ]
      },
      {
        heading: "我学到的项目方法论",
        list: [
          "先找真实入口，再写系统。对这个项目来说，真实入口不是网页后台，而是企业微信、复制文本、截图和人工确认。",
          "不要把“能写出来”当成“应该写”。交易确认、退款、发号这类动作必须保留人工确认。",
          "模拟数据必须和真实数据隔离。否则测试跑得越顺，越容易误判项目已经成功。",
          "官方 API 是边界，不是装饰。能走企业微信、微信客服、官方授权，就不要幻想私有接口和抓包捷径。",
          "任务系统比大后台更重要。运营者真正需要的往往不是一个复杂页面，而是下一步该做什么、该找谁、缺什么字段、证据在哪里。",
          "越接近真实业务，项目越会变窄。变窄不是失败，而是从幻想回到可持续。"
        ]
      },
      {
        heading: "它离最开始的想法还有多远",
        paragraphs: [
          "坦白说，距离还挺远。最初我想要的是一个很强的自动化机器，最好能把重复劳动都吃掉。现在得到的是一个企业微信里的运营助手，很多关键动作仍然需要人确认。",
          "但我现在不觉得这是退步。因为一个能长期用的运营工具，不应该只追求自动化率，还要考虑账号安全、平台规则、客户隐私、证据留存和纠纷处理。尤其是在真实交易里，过度自动化往往不是效率，而是风险。",
          "所以这个项目的阶段性答案是：不要急着做一个“代替人”的系统，先做一个“让人不容易忘、不容易错、不容易丢证据”的系统。等这个基础稳了，再考虑更深的自动化。"
        ]
      },
      {
        heading: "下一步，如果我还继续做",
        list: [
          "把本地 JSON 数据切到 SQLite，避免任务、订单、证据越来越难管理。",
          "让微信客服会话真正承接号主资料收集，客户按格式回复后自动解析。",
          "给客户和任务建立稳定关联，不再只靠昵称或备注匹配。",
          "完善标签体系，例如号主、买家、待验号、已结算、高风险。",
          "继续保持闲鱼官方 API 的准入检查，不满足服务商和权限条件前，不碰私有接口。"
        ]
      },
      {
        heading: "最后",
        paragraphs: [
          "这段时间最大的收获，不是我终于把某个接口跑通了，而是我慢慢看清了一个项目从想法到落地会经历什么：一开始什么都想自动化，中间容易被技术形态带偏，最后才意识到真正重要的是业务现场和安全边界。",
          "D:\\Project\\闲鱼自动化代租 是冲动的起点，D:\\Project\\DeltaXianyuOps 是一个有价值但方向偏重的中间站，D:\\Project\\WeComXianyuOps 则是一次把项目重新拉回真实场景的尝试。",
          "它还不完美，也远没有实现最初的全部想象。但至少现在我知道，下一步应该往哪里走，也知道哪些路不该再走。"
        ]
      }
    ]
  },
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
