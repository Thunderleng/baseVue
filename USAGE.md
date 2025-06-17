# 🧱 3D 积木模型展示器 - 使用说明

## 🚀 快速开始

### 1. 启动项目
```bash
pnpm dev
```

### 2. 访问应用
打开浏览器访问 `http://localhost:5173` 或 `http://localhost:5174`

## 🎮 功能操作

### 基本控制
- **上一层/下一层按钮**：切换当前显示的层
- **层选择复选框**：勾选要显示的层，支持多选
- **全选/取消全选**：快速选择或取消所有层

### 3D 交互
- **鼠标左键拖动**：旋转视角
- **鼠标滚轮**：缩放场景
- **鼠标右键拖动**：平移视角

## 📊 数据格式

项目支持从 JSON 文件加载积木数据，每个积木对象包含：

```json
{
  "center": [x, y, z],           // 积木中心位置
  "shape": [width, depth],       // 形状尺寸
  "size": 0.008,                 // 基础尺寸
  "thickness": 0.008,            // 厚度
  "circle_radius": 0,            // 圆形半径（圆柱用）
  "cylinder_thickness": 0.002,   // 圆柱厚度
  "color": [r, g, b]             // RGB 颜色值（0-1）
}
```

## 🔧 自定义配置

### 修改层数
在 `src/components/BrickViewer.vue` 中修改：
```typescript
const maxLayers = 10 // 设置最大层数
```

### 修改数据源
```typescript
const baseUrl = 'https://your-api.com/layers' // 远程API
// 或
const baseUrl = '/mock' // 本地文件
```

### 生成测试数据
```bash
node scripts/generateMockData.cjs 10  # 生成10层测试数据
```

## 🎨 积木类型

项目支持三种积木类型：

1. **立方体 (cube)**：标准立方体积木
2. **板状 (plate)**：扁平的长方体积木
3. **圆柱 (cylinder)**：圆柱形积木

## 📁 文件结构

```
public/mock/           # 测试数据目录
├── layer-0.json      # 第0层数据
├── layer-1.json      # 第1层数据
└── ...

src/
├── components/       # 组件目录
├── composables/      # 组合式函数
├── models/          # 数据模型
└── pages/           # 页面组件
```

## 🚀 性能优化

项目包含两个版本的渲染组件：

1. **BrickLayer.vue**：标准版本，适合少量积木
2. **BrickLayerOptimized.vue**：优化版本，使用 InstancedMesh，适合大量积木

## 🔍 故障排除

### 常见问题

1. **3D 场景不显示**
   - 检查浏览器是否支持 WebGL
   - 确认 Three.js 和 Tres.js 正确安装

2. **数据加载失败**
   - 检查 JSON 文件格式是否正确
   - 确认文件路径配置正确
   - 查看浏览器控制台错误信息

3. **性能问题**
   - 减少同时显示的积木数量
   - 使用优化版本的渲染组件
   - 启用浏览器硬件加速

## 📝 开发说明

### 技术栈
- **Vue 3**：前端框架
- **TypeScript**：类型安全
- **Three.js**：3D 渲染引擎
- **Tres.js**：Vue 3 的 Three.js 集成
- **TailwindCSS**：样式框架

### 扩展功能
- 支持更多积木类型
- 添加动画效果
- 实现积木选择高亮
- 支持数据导出功能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License 