# 故事语音生成App (Vue版本)

这是一个将React项目改造为Vue 3 + Vite的版本，实现了与原React版本相同的功能。

## 项目结构

```
vue-story-web/
├── src/
│   ├── api/                # API 服务层
│   │   ├── config.js            # API 基础配置
│   │   ├── auth.js              # 认证接口
│   │   ├── character.js         # 角色接口
│   │   ├── story.js             # 故事接口
│   │   ├── task.js              # 任务接口
│   │   └── file.js              # 文件接口
│   ├── utils/              # 工具函数
│   │   └── auth.js              # JWT token 管理
│   ├── components/         # 公共组件
│   │   ├── BottomNavigation.vue  # 底部导航
│   │   └── RecordingPage.vue    # 录音页面
│   ├── pages/              # 页面组件
│   │   ├── HomePage.vue         # 首页
│   │   ├── StoryLibraryPage.vue # 故事库页面
│   │   └── ListenPage.vue       # 畅听页面
│   ├── App.vue             # 根组件
│   ├── main.js             # 入口文件
│   ├── router.js           # 路由配置
│   └── store.js            # 状态管理
├── index.html              # HTML模板
├── package.json            # 项目配置
└── vite.config.js          # Vite配置
```

## 功能特性

1. **首页 (HomePage)**
   - 角色创建与管理
   - 录音功能模拟
   - ASR校验模拟

2. **故事库 (StoryLibraryPage)**
   - 故事分类展示
   - 故事生成功能
   - 生成确认弹窗

3. **畅听 (ListenPage)**
   - 生成任务列表
   - 播放功能
   - 进度条显示
   - 悬浮播放器

4. **底部导航 (BottomNavigation)**
   - 页面切换
   - 活动状态标识

## API 配置

项目已集成后端 API 接口，需要在环境变量中配置 API 基础地址。

### 环境变量配置

创建 `.env` 文件（或复制 `.env.example`）：

```bash
VITE_API_BASE_URL=http://localhost:8000
```

如果不配置，默认使用 `http://localhost:8000`。

### API 接口说明

项目已实现以下 API 接口调用：

- **认证接口** (`src/api/auth.js`)
  - 用户注册
  - 用户登录
  - 用户退出

- **角色接口** (`src/api/character.js`)
  - 创建角色
  - 获取用户角色列表

- **故事接口** (`src/api/story.js`)
  - 获取故事列表
  - 获取故事详情

- **任务接口** (`src/api/task.js`)
  - 创建语音生成任务
  - 获取任务列表
  - 获取任务详情
  - 获取任务状态

- **文件接口** (`src/api/file.js`)
  - 上传录音文件
  - 获取音频文件 URL

## 启动项目

### 安装依赖

```bash
npm install
# 或者
yarn install
```

### 开发环境启动

```bash
npm run dev
# 或者
yarn dev
```

**注意**：确保后端 API 服务已启动（默认地址：http://localhost:8000）

### 构建生产版本

```bash
npm run build
# 或者
yarn build
```

### 预览生产版本

```bash
npm run preview
# 或者
yarn preview
```

## 技术栈

- Vue 3 (Composition API)
- Vue Router 4
- Vite
- 原生CSS (无预处理器)

## 响应式设计

项目已针对移动端进行了优化，支持：
- 手机端 (320px - 768px)
- 平板端 (768px - 1024px)
- 桌面端 (1024px+)

## 功能说明

### 角色创建流程
1. 首页点击"添加角色"按钮
2. 输入2-6个字的角色名称
3. 进入录音页面，点击开始录音
4. 模拟录音过程，停止录音后自动校验
5. 校验通过后点击下一步完成角色创建

### 故事生成流程
1. 在故事库选择一个故事
2. 点击"生成"按钮
3. 确认生成弹窗后开始生成任务
4. 任务会自动添加到畅听页面

### 故事播放
1. 在畅听页面查看生成完成的任务
2. 点击播放按钮开始播放
3. 播放时会显示进度条
4. 悬浮播放器会固定在页面底部

## 注意事项

1. **API 服务**：确保后端 API 服务已启动并运行在配置的地址上
2. **认证**：用户登录后，JWT token 会保存在 localStorage 中
3. **录音功能**：录音功能使用浏览器 MediaRecorder API，需要 HTTPS 或 localhost 环境
4. **任务轮询**：生成任务会自动轮询状态，完成后会自动更新
5. **响应式设计**：项目支持响应式设计，在不同设备上都有良好的显示效果

## 浏览器兼容性

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 开发说明

所有组件都使用Vue 3的Composition API编写，状态管理采用Vue的reactive API实现，路由使用Vue Router 4。