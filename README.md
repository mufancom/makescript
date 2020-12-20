# MakeScript

MakeScript 是一个可以将脚本执行集成到 [Makeflow](https://www.makeflow.com) ，或者通过 API 调用执行脚本的工具。

## 开始使用

在开始之前，你需要先安装 [NodeJs](https://nodejs.org) 和 [yarn](https://yarnpkg.com/getting-started/install)（或 [npm](https://docs.npmjs.com/about-npm)）。然后使用 yarn 或 npm 在全局安装 MakeScript 的 CLI 工具。

```bash
yarn global add @makeflow/makescript
```

安装完成后在终端执行 `makescript` 命令，在第一个问题中输入 `y`，在第二个问题中输入当前仓库的 git 地址 (`https://github.com/makeflow/makescript.git`) 后回车。

![get-started-makescript.png](images/get-started-makescript.png)

然后等待片刻，看到控制台输出了 `get-started-initialization.png` 字样后即代表 MakeScript 启动成功。（因为会从 GitHub clone 仓库，如果网络环境不好可能会等待较长时间）。

MakeScript 启动成功后，在浏览器中访问 [`http://localhost:8900`](http://localhost:8900) 即可进入 MakeScript 的管理界面。第一次进入时会要求输入一个密码进行初始化，以后再次进入需要提供初始化时输入的密码进行身份验证。

<p align="center"><img src="images/get-started-initialization.png" alt="get-started-initialization.png" width="450"></p>

输入密码初始化后，在管理界面中的 "Token 管理" 界面中新建一个 Token 并复制。然后使用 HTTP 请求工具发起如下 HTTP 请求：

```http
POST http://localhost:8901/api/script/default/echo-message/enqueue
Content-Type: application/json
Authorization: Token the-token-created-before

{
  "parameters": {
    "message": "Hello"
  }
}
```

如果操作成功，该请求将会响应 `{id: record-id}`。

回到管理界面进入 “脚本执行” 界面，将会记录列表里看到刚刚的请求。在列表里点击该记录，然后点击右下角的 <svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-right" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M715.8 493.5L335 165.1c-14.2-12.2-35-1.2-35 18.5v656.8c0 19.7 20.8 30.7 35 18.5l380.8-328.4c10.9-9.4 10.9-27.6 0-37z"></path></svg> 按钮，在弹出的对话框中输入密码 `abc123` 后点击 “执行” 按钮。

执行后将会在该界面看到执行结果及脚本输出等信息：

<p align="center"><img src="images/ger-started-running-result.png" alt="ger-started-running-result.png" width="500"></p>

## 文档

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [MakeScript 想要解决的问题](#makescript-%E6%83%B3%E8%A6%81%E8%A7%A3%E5%86%B3%E7%9A%84%E9%97%AE%E9%A2%98)
- [MakeScript](#makescript)
  - [安装 MakeScript](#%E5%AE%89%E8%A3%85-makescript)
  - [启动 MakeScript](#%E5%90%AF%E5%8A%A8-makescript)
  - [MakeScript 管理界面](#makescript-%E7%AE%A1%E7%90%86%E7%95%8C%E9%9D%A2)
- [Agent](#agent)
  - [安装节点工具](#%E5%AE%89%E8%A3%85%E8%8A%82%E7%82%B9%E5%B7%A5%E5%85%B7)
  - [初始化节点](#%E5%88%9D%E5%A7%8B%E5%8C%96%E8%8A%82%E7%82%B9)
- [脚本仓库](#%E8%84%9A%E6%9C%AC%E4%BB%93%E5%BA%93)
  - [`hooks`](#hooks)
  - [`passwordHash`](#passwordhash)
  - [`scripts`](#scripts)
- [MakeScript 配置文件](#makescript-%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)
- [Agent 配置文件](#agent-%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)
- [How To](#how-to)
  - [如何在有脚本被触发时发送通知？](#%E5%A6%82%E4%BD%95%E5%9C%A8%E6%9C%89%E8%84%9A%E6%9C%AC%E8%A2%AB%E8%A7%A6%E5%8F%91%E6%97%B6%E5%8F%91%E9%80%81%E9%80%9A%E7%9F%A5)
  - [如何实现脚本执行时需要密码验证？](#%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0%E8%84%9A%E6%9C%AC%E6%89%A7%E8%A1%8C%E6%97%B6%E9%9C%80%E8%A6%81%E5%AF%86%E7%A0%81%E9%AA%8C%E8%AF%81)
  - [如何与 Makeflow 进行集成](#%E5%A6%82%E4%BD%95%E4%B8%8E-makeflow-%E8%BF%9B%E8%A1%8C%E9%9B%86%E6%88%90)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## MakeScript 想要解决的问题

在项目的早期阶段，可能会因为业务需要或客户需求而进行一些分散零碎而且很细小的功能需求，但是又不属于产品的功能或暂未安排到日程中。比如客户咨询客服修改密码、客户要求删除账号等。

可能这些需求只需要简单地改变数据库中的一个字段、或是执行一段简单的脚本。但这些操作都不适合非技术人员去操作，但是为这些小需求都提供一个非技术人员能操作的界面成本又太高。

于是 MakeScript 让技术人员只关注脚本中业务逻辑，而 MakeScript 负责去提供一个用户友好的操作界面。且搭配 [Makeflow](https://www.makeflow.com) 的流程系统，还能轻松地与其他工作流进行有机结合。

## MakeScript

### 安装 MakeScript

MakeScript 以 npm 包的形式提供了一个 CLI，你可以通过 [`yarn`](https://yarnpkg.com/getting-started/install) 或 [`npm`](https://docs.npmjs.com/about-npm) 来将 MakeScript 安装到全局：

- yarn:

```bash
yarn global add @makeflow/makescript
```

- npm:

```bash
npm install @makeflow/makescript --global
```

### 启动 MakeScript

安装 MakeScript 后，直接在控制台中输入 `makescript` 命令即可启动。首次启动时会要求输入一些必要信息：

1. 首先会询问是否启用默认[节点](#agent)，输入 `Y` 或直接回车为启用，输入 `n` 为不启用：
   ![MakeScript default agent prompts](images/makescript-default-agent-prompts.png)
   如果仅在当前操作机器上使用 MakeScript 或当前机器需要执行脚本，则可以启用默认节点。如果当前机器仅作为 API 端，或仅与 Makeflow 进行桥接，而执具体的脚本会在其他机器上执行，则可以不启用默认节点。

2. 如果启用了默认节点，则会提示输入 [脚本仓库](#脚本仓库) 的地址，MakeScript 在每次启动时将会同步该仓库：
   ![MakeScript scripts repo url prompts](images/makescript-scripts-repo-url-prompts.png)
   输入一个脚本仓库的地址并回车后，MakeScript 将会将该仓库的脚本同步到本地，以方便后续执行。该地址可以是一个 [HTTPS 地址](https://docs.github.com/en/free-pro-team@latest/github/using-git/which-remote-url-should-i-use#cloning-with-https-urls) 或 [SSH 地址](https://docs.github.com/en/free-pro-team@latest/github/using-git/which-remote-url-should-i-use#cloning-with-ssh-urls)，但请确保有对该仓库的访问权限。

### MakeScript 管理界面

MakeScript 提供了一个 Web 管理界面，启动 MakeScript 后使用浏览器进入 [`http://localhost:8900`](http://localhost:8900) 来访问。第一次访问时会提示输入密码进行初始化：

![MakeScript initialize](images/makescript-initialize.png)

输入密码成功初始化后，即会进入 MakeScript 的管理主界面。该界面中，包含了 `脚本执行`、`Token 管理`、`Makeflow 集成` 和 `管理节点` 四个选项：

![MakeScript home](images/makescript-home.png)

- `脚本执行`: 在 `脚本执行` 界面中，可以查看历史执行记录、执行需要手动执行的脚本、查看所有可执行的脚本。
- `Token 管理`: 在 `Token 管理` 界面中，可以创建和停用 Token。
- `Makeflow 集成`: 在 `Makeflow 集成` 界面中，可以登录到 Makeflow 后将脚本列表以超级应用的形式发布到 Makeflow 。
- `节点管理`: 在 `节点管理` 界面中，可以查看节点注册链接和已注册的节点及所有节点的脚本数量。

## Agent

MakeScript 身只做集成与提供管理界面等工作，本身不提供脚本执行的功能。而脚本执行的功能是交给节点（Agent）去完成的。

一个 MakeScript 中可以注册多个节点，一个节点中可以包含多个脚本。MakeScript 启动时也可以选择启动一个默认节点。

MakeScript 将多个节点的脚本列表进行聚合，然后统一与 Makeflow 集成或提供 API。在脚本执行时，会分别分发到对应的节点进行执行，然后再将执行结果及产生的资源进行聚合展示到管理界面。

### 安装节点工具

因为 MakeScript 的节点没有管理界面、与 Makeflow 集成、提供 API 等功能，比 MakeScript 本体更轻量，所以单独提供了一个程序用于启动节点。与 MakeScript 一致，节点工具也以 npm 包的形式提供，可以通过 [`yarn`](https://yarnpkg.com/getting-started/install) 或 [`npm`](https://docs.npmjs.com/about-npm) 来进行安装：

- yarn:

```bash
yarn global add @makeflow/makescript-agent
```

- npm:

```bash
npm install @makeflow/makescript-agent --global
```

### 初始化节点

在目标机器上成功安装节点工具后，在控制台执行 `makescript-agent` 即可启动一个 Agent 作为节点。在第一次执行该命令时，需要输入一些必要的信息以初始化：

![agent-initialize.png](images/agent-initialize.png)

1. 首先需要提供的是 MakeScript 管理节点提供的节点注册链接，该链接在 MakeScript 管理界面的 “节点管理” 界面里可以查看到并复制：
   ![makescript-home-with-agents-management-notation.png](images/makescript-home-with-agents-management-notation.png)
   ![makescript-agents-management-with-join-link-notation.png](images/makescript-agents-management-with-join-link-notation.png)
2. 需要提供的第二个信息是一个名称空间，该名称空间用于区分不同的节点，不同节点的名称空间不能重复。
3. 需要提供的第三个信息是一个脚本仓库的地址，这个脚本仓库中的脚本均可以在该节点上执行。

## 脚本仓库

脚本仓库里包含了一系列将要执行的脚本以及根目录下一个名为 `makescript.json` 的定义文件。该定义文件中定义脚本列表、执行密码、脚本参数、脚本和脚本钩子等信息，可以参考本项目根目录中的 `makescript.json` 文件，也可以使用 `makescript check-definition` 命令来检测该文件是否符合定义要求。该定义文件可以有如下属性：

### `hooks`

可选属性，`hooks` 属性中可以定义一系列钩子，在发生特定事件时，将会执行定义里的命令。目前可用的钩子有：

- `install`: 初始化脚本仓库时将会执行，可以用于安装脚本仓库所需依赖
- `postTrigger`: 当有脚本被触发时将会执行，可用于通知管理员手动执行脚本

示例：

```json
{
  "hooks": {
    "install": "yarn",
    "postTrigger": "sh ./notify.sh"
  }
}
```

### `passwordHash`

可选属性，`passwordHash` 属性可以提供一个密码哈希值，提供了该值后，执行该脚本仓库中的所有脚本时均需要输入确认密码。该哈希值可以通过 `makescript generate-hash your-password` 生成。

示例：

```json
{
  "passwordHash": "$2b$10$Qqz.Lqa1WwtvdFXgHM3pAu/sbzwpKo94zUCYwMiipDJZq.67QB/wW"
}
```

### `scripts`

必选属性，`scripts` 属性接受一个数组，其定义了所有需要执行的脚本，以及这些脚本的需要接受的参数。

示例：

```json
{
  "scripts": [
    {
      "displayName": "Echo Message",
      "name": "echo-message",
      "type": "node",
      "source": "example-scripts/echo-message.js",
      "parameters": ["message"],
      "manual": false
    }
  ]
}
```

`scripts` 中的单个元素定义如下：

```ts
type ScriptDefinition = {
  // 脚本的展示名称
  displayName: string;
  // 脚本的唯一识别名称，在同一个脚本仓库中需唯一
  name: string;
  // 脚本类型，可选值有 `executable`、`node`、`shell`、`sqlite`
  type: string;
  // 脚本文件路径
  source: string;
  // 执行该脚本时是否需手动确认
  manual?: boolean;
  // 脚本的参数列表，接受参数定义或字符串数组
  parameters?: (
    | {
        // 参数唯一识别名称，在同一个脚本的定义里需唯一
        name: string;
        // 参数的展示名称
        displayName: string;
        // 是否为必选参数
        required?: boolean;
        // 要创建 MakeScript 的表单类型
        field?:
          | string
          | {
              type: string;
              data?: unknown;
            };
      }
    | string
  )[];
  // 脚本选项，执行脚本时会传递给执行脚本的 Adapter
  options?: (
    | {
        name: string;
        type: 'value';
        value: unknown;
      }
    | {
        name: string;
        type: 'env';
        env: string;
        required?: boolean;
      }
  )[];
  // 单个脚本的执行密码的哈希值，该属性出现时将会覆盖同名全局属性
  passwordHash?: string;
  // 单个脚本的钩子，该属性下的子属性会覆盖全局属性中的子属性
  hooks?: {
    postTrigger?: string;
  };
};
```

## MakeScript 配置文件

在 MakeScript 初始化后，可以通过编辑配置文件来修改 MakeScript 的一些配置。该配置文件的路径默认在 `~/.config/makescript/makescript.yaml`。其可编辑的项及解释如下：

```yaml
# Web 界面相关配置
web:
  host: localhost
  port: 8900
  url: http://localhost:8900
# API 相关配置
api:
  host: localhost
  port: 8901
  url: http://localhost:8901
# Makeflow 相关配置
makeflow:
  base-url: https://makeflow.com
  power-app:
    name: makescript
    display-name: MakeScript
    description: Auto generated by makescript
# 默认节点相关配置
default-agent:
  # 脚本仓库的链接
  scripts-repo-url: https://github.com/makeflow/makescript.git
# 加入链接的 Token，如果改变该值必须更新所有节点的配置中的加入链接
join-token: dfa5356a-25fc-4963-adb2-8d5d86fde8ad
# 脚本生成的资源文件存放位置
resources-path: /tmp/makescript-resources
```

## Agent 配置文件

在 MakeScript 的节点初始化后，可以通过编辑配置文件来修改 MakeScript 节点的一些配置。该配置文件的路径默认在 `~/.config/makescript/agent/agent.yaml`。其可编辑的项及解释如下：

```yaml
# MakeScript 主节点的加入链接
makescript-secret-url: http://localhost:8901/join/dfa5356a-25fc-4963-adb2-8d5d86fde8ad
# 脚本仓库的链接
scripts-repo-url: https://github.com/makeflow/makescript.git
# 节点的名称空间
namespace: a-unique-namespace
# 使用的代理信息
proxy: null
```

## How To

### 如何在有脚本被触发时发送通知？

可以使用脚本仓库的定义中的 [`hooks#postTrigger`](#hooks) 或 `scripts[]#hooks#postTrigger` 属性来在脚本被触发时执行一个脚本，再结合 [TriggerScript](https://github.com/makeflow/triggerscript) 在脚本中使用 `curl` 等工具调用一个通知请求。

### 如何实现脚本执行时需要密码验证？

可以使用脚本仓库的定义中的 [`passwordHash`](#passwordhash) 或 `scripts[]#passwordHash` 结合 `makescript generate-hash your-password` 命令来实现。

### 如何与 Makeflow 进行集成

1. 在 MakeScript 的 Web 管理界面中，点击首页中的 "Makeflow 集成" 按钮，然后输入 Makeflow 的用户名与密码进行登录。
2. 登录成功后点击 "发布 Power App " 按钮后点击对话框中的 "确认发布" 按钮将应用发布或更新到 Makeflow
3. 到 Makeflow 的应用商店中安装该应用
4. 在 Makeflow 的流程中使用 MakeScript 应用提供的超级流程项

## License

MIT License.
