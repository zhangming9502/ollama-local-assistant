# 发布前检查清单

在将扩展发布到 VS Code Marketplace 之前，请确认以下所有项目：

## 📋 必需项

### 文件检查
- [x] `package.json` - 包含所有必需字段
  - [x] name, displayName, description
  - [x] version (遵循语义化版本控制)
  - [x] publisher (与 Marketplace 账号匹配)
  - [x] license
  - [x] repository (GitHub 链接)
  - [x] bugs, homepage
  - [x] engines.vscode (最低版本要求)

- [x] `README.md` - 完整的使用说明（英文和中文）
- [x] `LICENSE` - MIT 许可证文件
- [x] `CHANGELOG.md` - 更新日志，包含版本号和日期
- [x] `.vscodeignore` - 正确配置，排除不需要的文件

### 代码检查
- [ ] 代码已编译 (`npm run compile`)
- [ ] 无 TypeScript 编译错误
- [ ] 所有功能已测试
- [ ] 错误处理已完善

### 配置检查
- [ ] `package.json` 中的 publisher 名称正确
- [ ] 版本号已更新（遵循 semver）
- [ ] repository URL 正确指向 GitHub

## 🚀 发布步骤

### 方法 1: 手动发布（推荐首次发布）

1. **安装 vsce**
   ```bash
   npm install -g @vscode/vsce
   ```

2. **登录到 Marketplace**
   ```bash
   vsce login zhangming9502
   ```
   输入你的 Personal Access Token (PAT)

3. **获取 PAT**
   - 访问：https://dev.azure.com/your-organization/_usersSettings/tokens
   - 创建新 Token，权限选择 "Marketplace (Manage)"
   - 复制 Token（只显示一次）

4. **打包测试**
   ```bash
   npm run compile
   vsce package
   ```
   这会生成 `.vsix` 文件，可以本地测试安装

5. **发布到市场**
   ```bash
   vsce publish
   ```

### 方法 2: 使用 GitHub Actions（推荐后续发布）

1. **在 GitHub 仓库中添加 Secret**
   - Settings → Secrets and variables → Actions
   - 新建 Secret：`VSCE_PAT`
   - 值为你的 Personal Access Token

2. **创建 GitHub Release**
   - 创建新 Release
   - 标签格式：`v1.0.0`
   - 发布后会自动触发 GitHub Actions 发布到市场

## ✅ 发布后验证

- [ ] 在 VS Code Marketplace 搜索扩展名称
- [ ] 确认扩展页面显示正确
- [ ] 测试从市场安装扩展
- [ ] 验证所有功能正常工作

## 📝 常见问题

### 发布失败：认证错误
- 检查 PAT 是否有效
- 确认 PAT 有 Marketplace (Manage) 权限
- 重新登录：`vsce login zhangming9502`

### 发布失败：版本已存在
- 更新 `package.json` 中的版本号
- 遵循语义化版本：major.minor.patch

### 发布失败：缺少必填字段
- 检查 `package.json` 是否包含所有必需字段
- 参考：https://code.visualstudio.com/api/references/extension-manifest

## 🔗 有用链接

- [VS Code Marketplace](https://marketplace.visualstudio.com/)
- [vsce 文档](https://github.com/microsoft/vscode-vsce)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [语义化版本控制](https://semver.org/)

## 📌 发布后维护

- 定期更新依赖
- 修复用户报告的 bug
- 响应 Issues 和 Pull Requests
- 添加新功能并更新版本号

