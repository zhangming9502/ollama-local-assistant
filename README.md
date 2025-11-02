# Ollama 本地大模型助手

这是一个 VS Code 插件，允许你在 VS Code 中使用本地通过 Ollama 搭建的大模型进行代码辅助。

## 功能特性

- 🤖 **代码解释**：选中代码后，AI 会详细解释代码的功能和原理
- 🔧 **代码重构**：自动优化和重构选中的代码
- 💡 **代码生成**：根据描述生成代码片段
- ❓ **智能问答**：向 AI 提问，获得专业回答
- 📦 **模型管理**：轻松切换不同的本地模型

## 前置要求

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

## 安装插件

1. 在 VS Code 中按 `F5` 启动调试（开发模式）
2. 或使用 VS Code 扩展打包命令：
   ```bash
   npm install -g vsce
   vsce package
   ```
   然后将生成的 `.vsix` 文件安装到 VS Code

## 使用方法

### 配置设置

打开 VS Code 设置（`Ctrl+,` 或 `Cmd+,`），搜索 "Ollama"，可以配置：

- **Ollama Base Url**：Ollama API 的基础 URL（默认：`http://127.0.0.1:11434`）
- **Ollama Model**：默认使用的模型名称（默认：`llama3`）
- **Ollama Timeout**：API 请求超时时间（默认：60000 毫秒）

### 可用命令

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

## 开发

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run compile

# 监听模式编译
npm run watch
```

## 技术栈

- TypeScript
- VS Code Extension API
- Axios (HTTP 客户端)
- Ollama API

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

