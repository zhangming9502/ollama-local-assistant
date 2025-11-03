# Ollama Local Assistant

[English](#english) | [中文](#中文)

---

## English

A VS Code extension that allows you to use local Ollama AI models for code assistance directly in VS Code.

### Features

- 🤖 **Code Explanation**: Select code and get detailed explanations from AI
- 🔧 **Code Refactoring**: Automatically optimize and refactor selected code
- 💡 **Code Generation**: Generate code snippets based on descriptions
- ❓ **Smart Q&A**: Ask questions and get professional answers
- 📦 **Model Management**: Easily switch between different local models

### Prerequisites

1. **Install Ollama**:
   - Visit [Ollama website](https://ollama.ai) to download and install
   - Ensure Ollama service is running (default: `http://127.0.0.1:11434`)

2. **Download Models**:
   ```bash
   # For example, download llama3 model
   ollama pull llama3
   
   # Or download other models:
   ollama pull codellama
   ollama pull mistral
   ```

### Installation

#### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "Ollama Local Assistant"
4. Click Install

#### From VSIX File

1. Download the `.vsix` file
2. In VS Code, go to Extensions view
3. Click the `...` menu and select "Install from VSIX..."
4. Choose the downloaded file

### Usage

#### Configuration

Open VS Code Settings (`Ctrl+,` or `Cmd+,`), search for "Ollama", and configure:

- **Ollama Base Url**: The base URL for Ollama API (default: `http://127.0.0.1:11434`)
- **Ollama Model**: The default model name (default: `llama3`)
- **Ollama Timeout**: API request timeout in milliseconds (default: 60000)

#### Available Commands

1. **Ask Ollama** (`Ctrl+Shift+P` → `Ollama: Ask Ollama`)
   - Opens input box to ask questions
   - Responses are displayed in the output panel

2. **Explain Selected Code** (`Ctrl+Shift+P` → `Ollama: Explain Selected Code`)
   - Select code in the editor
   - Run command to get detailed code explanation

3. **Refactor Selected Code** (`Ctrl+Shift+P` → `Ollama: Refactor Selected Code`)
   - Select code to refactor
   - AI provides optimized code
   - Option to apply changes to the file

4. **Generate Code** (`Ctrl+Shift+P` → `Ollama: Generate Code`)
   - Enter code description
   - AI generates corresponding code
   - Option to insert into current file

5. **Set Model** (`Ctrl+Shift+P` → `Ollama: Set Model`)
   - Select from available model list

### Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode compilation
npm run watch
```

### Technology Stack

- TypeScript
- VS Code Extension API
- Native Fetch API (no external HTTP dependencies)
- Ollama API

### License

MIT

### Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

## 中文

这是一个 VS Code 插件，允许你在 VS Code 中使用本地通过 Ollama 搭建的大模型进行代码辅助。

### 功能特性

- 🤖 **代码解释**：选中代码后，AI 会详细解释代码的功能和原理
- 🔧 **代码重构**：自动优化和重构选中的代码
- 💡 **代码生成**：根据描述生成代码片段
- ❓ **智能问答**：向 AI 提问，获得专业回答
- 📦 **模型管理**：轻松切换不同的本地模型

### 前置要求

1. **安装 Ollama**：
   - 访问 [Ollama 官网](https://ollama.ai) 下载并安装
   - 确保 Ollama 服务正在运行（默认地址：`http://127.0.0.1:11434`）

2. **下载模型**：
   ```bash
   # 例如下载 llama3 模型
   ollama pull llama3
   
   # 或下载其他模型，如：
   ollama pull codellama
   ollama pull mistral
   ```

### 安装插件

#### 从 VS Code 市场安装

1. 打开 VS Code
2. 进入扩展视图 (`Ctrl+Shift+X` 或 `Cmd+Shift+X`)
3. 搜索 "Ollama Local Assistant"
4. 点击安装

#### 从 VSIX 文件安装

1. 下载 `.vsix` 文件
2. 在 VS Code 中，进入扩展视图
3. 点击 `...` 菜单，选择 "Install from VSIX..."
4. 选择下载的文件

### 使用方法

#### 配置设置

打开 VS Code 设置（`Ctrl+,` 或 `Cmd+,`），搜索 "Ollama"，可以配置：

- **Ollama Base Url**：Ollama API 的基础 URL（默认：`http://127.0.0.1:11434`）
- **Ollama Model**：默认使用的模型名称（默认：`llama3`）
- **Ollama Timeout**：API 请求超时时间（默认：60000 毫秒）

#### 可用命令

1. **向 Ollama 提问** (`Ctrl+Shift+P` → `Ollama: 向 Ollama 提问`)
   - 打开输入框，输入问题
   - 响应会显示在输出面板中

2. **解释选中代码** (`Ctrl+Shift+P` → `Ollama: 解释选中代码`)
   - 在编辑器中选中代码
   - 运行命令，AI 会详细解释代码

3. **重构选中代码** (`Ctrl+Shift+P` → `Ollama: 重构选中代码`)
   - 选中要重构的代码
   - AI 会提供优化后的代码
   - 可选择是否应用到文件中

4. **生成代码** (`Ctrl+Shift+P` → `Ollama: 生成代码`)
   - 输入代码描述
   - AI 会生成相应的代码
   - 可选择是否插入到当前文件

5. **设置使用的模型** (`Ctrl+Shift+P` → `Ollama: 设置使用的模型`)
   - 从可用模型列表中选择要使用的模型

### 开发

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run compile

# 监听模式编译
npm run watch
```

### 技术栈

- TypeScript
- VS Code Extension API
- 原生 Fetch API（无外部 HTTP 依赖）
- Ollama API

### 许可证

MIT
可以免费使用，但需要注明原始来源

### 贡献

欢迎提交 Issue 和 Pull Request！
[查看GitHub仓库](https://github.com/zhangming9502/ollama-local-assistant/tree/master)