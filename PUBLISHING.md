# Publishing Guide

本文档介绍如何将插件发布到 VS Code Marketplace。

## 准备工作

### 1. 创建 Azure DevOps 组织

VS Code Marketplace 使用 Azure DevOps 进行发布管理。你需要：

1. 访问 https://dev.azure.com
2. 创建一个免费的 Azure DevOps 组织
3. 记录你的组织名称（如：`yourname`）

### 2. 获取 Personal Access Token (PAT)

1. 访问 Azure DevOps：https://dev.azure.com/your-organization-name/_usersSettings/tokens
2. 点击 "New Token"
3. 设置：
   - Name: `VSCode Marketplace`
   - Organization: `All accessible organizations`
   - Expiration: 根据需要设置（建议 90 天或更长）
   - Scopes: 选择 **Marketplace (Manage)** 权限
4. 创建并复制 Token（只显示一次，请妥善保存）

### 3. 登录 vsce

```bash
# 安装 vsce（如果还没有安装）
npm install -g @vscode/vsce

# 登录到 VS Code Marketplace
vsce login zhangming9502
```

按提示输入你的 Personal Access Token。

### 4. 更新版本号

在发布新版本前，更新 `package.json` 中的版本号：

```json
{
  "version": "1.0.1"  // 遵循语义化版本控制 (semver)
}
```

## 发布步骤

### 方法 1: 使用 vsce 命令行

```bash
# 1. 确保代码已编译
npm run compile

# 2. 打包扩展（可选，用于测试）
vsce package

# 3. 发布到 Marketplace
vsce publish

# 如果要发布预览版（minor version）
vsce publish --pre-release

# 如果要发布补丁版本
vsce publish patch

# 如果要发布次版本
vsce publish minor

# 如果要发布主版本
vsce publish major
```

### 方法 2: 使用 GitHub Actions（推荐）

创建 `.github/workflows/publish.yml`:

```yaml
name: Publish Extension

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Compile TypeScript
        run: npm run compile
      
      - name: Publish to VS Code Marketplace
        uses: HaaLeo/publish-vscode-extension@v1
        with:
          pat: ${{ secrets.VSCE_PAT }}
```

在 GitHub 仓库设置中添加 Secret：`VSCE_PAT`，值为你的 Personal Access Token。

## 发布检查清单

发布前请确认：

- [ ] 版本号已更新
- [ ] README.md 已更新（包含英文说明）
- [ ] LICENSE 文件存在
- [ ] package.json 包含所有必要字段（repository, bugs, homepage, license）
- [ ] 代码已编译（`npm run compile`）
- [ ] 所有功能都已测试
- [ ] .vscodeignore 配置正确

## 验证发布

发布后：

1. 访问 VS Code Marketplace：https://marketplace.visualstudio.com/vscode
2. 搜索你的扩展名称
3. 确认扩展可以正常安装和使用

## 常见问题

### 发布失败：认证错误

- 检查 Personal Access Token 是否有效
- 确认 Token 有 Marketplace (Manage) 权限
- 尝试重新登录：`vsce login <publisher-name>`

### 发布失败：版本已存在

- 更新 `package.json` 中的版本号

### 发布失败：缺少必填字段

- 检查 package.json 是否包含所有必需字段
- 参考 VS Code 官方文档：https://code.visualstudio.com/api/references/extension-manifest

## 资源链接

- [VS Code Extension Marketplace](https://marketplace.visualstudio.com/)
- [vsce 文档](https://github.com/microsoft/vscode-vsce)
- [VS Code Extension API 文档](https://code.visualstudio.com/api)
- [语义化版本控制](https://semver.org/)

## 后续维护

发布后，定期：

- 修复用户报告的 bug
- 添加新功能
- 更新依赖
- 响应 Issues 和 Pull Requests

每次更新时，遵循语义化版本控制（semver）更新版本号。

