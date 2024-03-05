# monorepo-qiankun-template

这是一个基于Turborepo和乾坤（Qiankun）搭建的官方项目模板，包含乾坤的主应用和微应用项目。

## 使用这个模板

首先确保您已经安装了Turborepo。如果还没有安装，请运行以下命令进行安装：

```
npm install -g turbo
```

然后，将这个模板克隆到本地：

```
git clone git@gitlab.fline88.com:front-end-construction/monorepo-qiankun-template.git

pnpm install
```

## 项目结构

这个Turborepo包含了以下项目和工具：

### 主应用

- `react-base`: 基于React的主应用
- `vue3-base`: 基于Vue 3的主应用

### 微应用

- `react-vanilla-app`: 基于React的微应用
- `umi-app`: 基于Umi框架的微应用
- `vue3-vite-app`: 基于Vue 3和Vite的微应用

### 工具和配置

- `@repo/ui`: 一个React组件库，被apps文件中所有项目共享
- `@repo/eslint-config`: `eslint`配置文件（包括`eslint-config-next`和`eslint-config-prettier`）
- `@repo/typescript-config`: 项目中使用的`tsconfig.json`配置文件
  每个项目都是用[TypeScript](https://www.typescriptlang.org/)编写的。

### 实用工具

这个Turborepo已经为您设置了一些额外的工具：

- [TypeScript](https://www.typescriptlang.org/)用于静态类型检查
- [ESLint](https://eslint.org/)用于代码检查
- [Prettier](https://prettier.io)用于代码格式化

### 构建项目

要构建所有的项目和工具，请运行以下命令：

```
cd monorepo-qiankun-template
pnpm build
```

### 开发项目

要开发所有的项目和工具，请运行以下命令：

```
cd monorepo-qiankun-template
pnpm dev
```

### 远程缓存

Turborepo可以使用远程缓存技术，以在多台机器间共享构建缓存，从而提高团队和CI/CD流程的效率。
默认情况下，Turborepo会在本地缓存。要启用远程缓存，您需要一个Vercel账号。如果您还没有账号，可以[创建一个](https://vercel.com/signup)，然后运行以下命令：

```
cd monorepo-qiankun-template
npx turbo login
```

这会将Turborepo CLI与您的[Vercel账号](https://vercel.com/docs/concepts/personal-accounts/overview)进行关联。
接下来，您可以通过运行以下命令，将Turborepo与远程缓存进行关联：

```
npx turbo link
```

## 有用的链接

了解更多关于Turborepo的信息：

- [任务](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [缓存](https://turbo.build/repo/docs/core-concepts/caching)
- [远程缓存](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [过滤](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [配置选项](https://turbo.build/repo/docs/reference/configuration)
- [CLI使用](https://turbo.build/repo/docs/reference/command-line-reference)

---
