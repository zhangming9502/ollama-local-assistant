# 贡献指南

感谢你对 Ollama Local Assistant 项目的关注！我们欢迎任何形式的贡献。

[English](#english) | [中文](#中文)

---

## English

### How to Contribute

1. **Fork the repository**
   - Click the "Fork" button on GitHub
   - Clone your fork locally

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Test your changes thoroughly

4. **Commit your changes**
   ```bash
   git commit -m "Add: description of your changes"
   ```
   Use clear, descriptive commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for updates
   - `Refactor:` for code refactoring
   - `Docs:` for documentation changes

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub with a clear description of your changes.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/zhangming9502/ollama-local-assistant.git
cd ollama-local-assistant

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (for development)
npm run watch
```

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Add JSDoc comments for public functions
- Keep functions focused and single-purpose

### Testing

Before submitting a PR, please:
- Test your changes with different models
- Ensure all existing features still work
- Check for TypeScript compilation errors

### Reporting Issues

When reporting issues, please include:
- VS Code version
- Extension version
- Ollama version
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

---

## 中文

### 如何贡献

1. **Fork 仓库**
   - 在 GitHub 上点击 "Fork" 按钮
   - 将 fork 的仓库克隆到本地

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **进行修改**
   - 遵循现有的代码风格
   - 为复杂逻辑添加注释
   - 充分测试你的修改

4. **提交更改**
   ```bash
   git commit -m "Add: 你的更改描述"
   ```
   使用清晰、描述性的提交信息，遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式：
   - `Add:` 新功能
   - `Fix:` 修复 bug
   - `Update:` 更新
   - `Refactor:` 代码重构
   - `Docs:` 文档更改

5. **推送并创建 Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   然后在 GitHub 上创建 Pull Request，清晰描述你的更改。

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/zhangming9502/ollama-local-assistant.git
cd ollama-local-assistant

# 安装依赖
npm install

# 编译 TypeScript
npm run compile

# 监听模式（用于开发）
npm run watch
```

### 代码风格

- 所有新代码使用 TypeScript
- 遵循现有的代码格式化风格
- 为公共函数添加 JSDoc 注释
- 保持函数专注和单一职责

### 测试

提交 PR 前，请确保：
- 使用不同模型测试你的更改
- 确保所有现有功能仍然正常工作
- 检查 TypeScript 编译错误

### 报告问题

报告问题时，请包含：
- VS Code 版本
- 扩展版本
- Ollama 版本
- 复现步骤
- 预期行为 vs 实际行为
- 错误信息（如果有）

### 贡献类型

我们欢迎以下类型的贡献：

- 🐛 Bug 修复
- ✨ 新功能
- 📝 文档改进
- 🎨 UI/UX 改进
- ⚡ 性能优化
- 🔧 代码重构
- 🌐 多语言支持

### 行为准则

请保持友好和尊重。我们致力于为所有人提供友好、欢迎和无骚扰的体验。

