Git 提交信息规范是团队协作中的重要环节，它可以帮助开发者更好地理解代码变更的目的和背景，同时也有助于生成清晰的版本历史日志。以下是常见的 Git 提交信息规范，推荐使用 **Conventional Commits** 规范。

---

## **1. Commit Message 格式**

每一条提交信息应遵循以下格式：

```
<类型>(<作用域>): <描述>
```

### **示例**

```
feat(user): add user login functionality
fix(auth): resolve authentication token issue
docs(readme): update installation instructions
```

---

## **2. 提交信息组成**

### **(1) 类型（Type）**

表示提交的类别，通常为以下之一：

| 类型       | 描述                                                   |
| ---------- | ------------------------------------------------------ |
| `feat`     | 新增功能（Feature）                                    |
| `fix`      | 修复 Bug                                               |
| `docs`     | 文档更新（Documentation）                              |
| `style`    | 代码格式化（如空格、分号等，不涉及功能变更）           |
| `refactor` | 代码重构（既不是新增功能，也不是修复 Bug）             |
| `perf`     | 性能优化（Performance）                                |
| `test`     | 添加或修改测试用例                                     |
| `chore`    | 构建工具或依赖的变更（如配置、脚本、依赖包等）         |
| `ci`       | CI 配置或脚本变更（Continuous Integration）            |
| `revert`   | 回滚之前的提交                                         |
| `build`    | 构建工具或外部依赖的变更（如 Webpack、Babel 等）       |
| `wip`      | 正在进行中的工作（Work In Progress，通常用于临时提交） |

### **(2) 作用域（Scope）**

可选字段，表示提交的影响范围。可以是模块、组件、文件等。

#### **示例**

```
feat(user): add user registration
fix(auth): resolve token expiration issue
refactor(api): improve error handling
```

如果无法明确作用域，可以省略：

```
docs: update README file
```

### **(3) 描述（Description）**

对提交内容的简短描述，遵循以下规则：

- 使用**现在时**（如 `add` 而不是 `added`）。
- 首字母**小写**。
- 末尾不加句号。

#### **示例**

```
feat(user): add user registration form
fix(auth): resolve token validation bug
```

---

## **3. 可选：正文（Body）**

如果需要更详细的说明，可以在描述后添加正文。正文和描述之间需要空一行。

#### **示例**

```
feat(user): add user registration form

This commit adds a new user registration form component, including validation and error handling.
```

---

## **4. 可选：脚注（Footer）**

用于记录**关联问题**或**重大变更**。

### **(1) 关联问题**

使用 `Closes` 或 `Fixes` 关键字关联问题或 Bug。

#### **示例**

```
fix(auth): resolve token validation bug

Fixes #123
```

### **(2) 重大变更**

使用 `BREAKING CHANGE` 标记不兼容的变更。

#### **示例**

```
feat(api): update authentication flow

BREAKING CHANGE: The authentication token format has been changed.
```

---

## **5. 完整示例**

```
feat(user): add user registration form

This commit adds a new user registration form component, including validation and error handling.

Closes #123
BREAKING CHANGE: The authentication token format has been changed.
```

---

## **6. 工具支持**

### **(1) Commitizen**

一个交互式工具，帮助生成规范的提交信息。

- 安装：
  ```bash
  npm install -g commitizen
  ```
- 使用：
  ```bash
  git cz
  ```

### **(2) Husky + Commitlint**

在提交时自动验证提交信息是否符合规范。

- 安装：
  ```bash
  npm install husky @commitlint/cli @commitlint/config-conventional --save-dev
  ```
- 配置：
  在项目根目录创建 `commitlint.config.js`：
  ```js
  module.exports = {
    extends: ["@commitlint/config-conventional"],
  };
  ```
- 启用 Husky：
  ```bash
  npx husky install
  npx husky add .husky/commit-msg 'npx --no -- commitlint --edit $1'
  ```

---

### **(3)conventional-changelog**

根据git信息生成

`yarn add -D conventional-changelog-cli`


在 package.json 中添加脚本：
```json
{
  "scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}

```

执行 `yarn changelog`生成changelog文件

```bash
git tag v4.2.0-beta15
git push origin v4.2.0-beta15
yarn changelog --from v4.2.0-beta14 --to v4.2.0-beta15
```
