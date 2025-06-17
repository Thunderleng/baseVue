# 🧱 3D 积木模型展示器

基于 Vue3 + TypeScript + Three.js + Tres.js 构建的 3D 可视化项目，用于在网页中展示由多个层级组成的积木模型。

## ✨ 功能特性

- 🎯 **多层积木展示**：支持展示由多个层级组成的积木模型
- 🔄 **动态数据加载**：从在线 JSON 文件按需加载各层数据
- 🎮 **交互控制**：支持逐层查看和自定义组合显示
- 🎨 **3D 控制器**：支持旋转、缩放、平移等操作
- ⚡ **高性能渲染**：使用 InstancedMesh 批量渲染，支持 10 万+ 积木
- 🎨 **现代化 UI**：基于 TailwindCSS 的美观界面

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

## 📁 项目结构

```
src/
├── components/
│   ├── BrickLayer.vue          # 单层积木渲染组件
│   ├── BrickViewer.vue         # 主展示区域
│   └── LayerControls.vue       # 层控制面板
├── composables/
│   └── useLayerLoader.ts       # 层数据加载逻辑
├── models/
│   └── Brick.ts                # 积木数据模型
└── App.vue                     # 主应用组件
```

## 🧩 核心组件

### BrickViewer.vue
主展示组件，包含：
- 3D 场景渲染
- 光照系统（环境光、方向光、点光源）
- 轨道控制器（OrbitControls）
- 网格辅助线

### BrickLayer.vue
单层积木渲染组件，支持：
- 立方体积木（cube）
- 板状积木（plate）
- 圆柱积木（cylinder）

### LayerControls.vue
控制面板组件，提供：
- 层导航按钮（上一层/下一层）
- 层选择复选框
- 全选/取消全选功能
- 加载状态显示

## 📊 数据格式

每层积木数据为 JSON 数组，每个积木对象包含：

```json
{
  "center": [x, y, z],           // 中心位置
  "shape": [width, depth],       // 形状尺寸
  "size": 0.008,                 // 基础尺寸
  "thickness": 0.008,            // 厚度
  "circle_radius": 0,            // 圆形半径（圆柱用）
  "cylinder_thickness": 0.002,   // 圆柱厚度
  "color": [r, g, b]             // RGB 颜色值（0-1）
}
```

## 🎮 使用说明

### 基本操作
1. **查看单层**：点击"上一层"/"下一层"按钮切换显示层
2. **组合显示**：勾选多个层的复选框实现自定义组合
3. **3D 控制**：
   - 鼠标左键拖动：旋转视角
   - 鼠标滚轮：缩放
   - 鼠标右键拖动：平移

### 数据配置
1. 将积木数据保存为 JSON 文件
2. 文件命名格式：`layer-{index}.json`
3. 放置在 `public/mock/` 目录下
4. 在 `BrickViewer.vue` 中配置 `maxLayers` 和 `baseUrl`

## 🔧 自定义配置

### 修改最大层数
在 `BrickViewer.vue` 中修改：
```typescript
const maxLayers = 10 // 设置最大层数
```

### 修改数据源
```typescript
const baseUrl = 'https://your-api.com/layers' // 远程API
// 或
const baseUrl = '/mock' // 本地文件
```

### 调整渲染性能
- 修改 `BrickLayer.vue` 中的几何体参数
- 调整光照强度和位置
- 优化 InstancedMesh 的使用

## 🎨 样式定制

项目使用 TailwindCSS，可以通过修改类名来定制样式：

```vue
<!-- 修改控制面板样式 -->
<div class="layer-controls bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
```

## 🚀 部署

### 静态部署
```bash
pnpm build
# 将 dist 目录部署到静态服务器
```

### Docker 部署
```bash
docker build -t brick-viewer .
docker run -p 80:80 brick-viewer
```

## 🔍 故障排除

### 常见问题

1. **3D 场景不显示**
   - 检查浏览器 WebGL 支持
   - 确认 Three.js 和 Tres.js 正确安装

2. **数据加载失败**
   - 检查 JSON 文件格式
   - 确认文件路径正确
   - 查看浏览器控制台错误信息

3. **性能问题**
   - 减少同时显示的积木数量
   - 使用 InstancedMesh 优化渲染
   - 启用 LOD（细节层次）优化

## 📝 开发计划

- [ ] 支持用户自定义上传 JSON 数据
- [ ] 添加积木透明度控制
- [ ] 实现动画过渡效果
- [ ] 支持更多积木类型
- [ ] 添加导出功能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License 