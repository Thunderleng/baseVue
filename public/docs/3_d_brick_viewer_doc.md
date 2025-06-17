# 📦 3D 积木模型展示器项目文档

## 🧾 项目概述

这是一个基于 Vue3 + TypeScript + Three.js + Tres.js 构建的 3D 可视化项目，主要用于在网页中展示由多个层级组成的积木模型。每一层模型的数据来源于在线 JSON 文件，用户可以通过交互按钮来逐层查看模型，也可以勾选显示任意层级，实现自定义组合展示。项目具备高性能渲染能力，能够支持展示高达 10 万块积木的大型模型。

---

## 🛠️ 技术栈

- **前端框架**：Vue3
- **3D 渲染**：Three.js + Tres.js（Vue 封装）
- **语言**：TypeScript
- **样式**：TailwindCSS
- **数据管理**：通过请求在线 JSON 地址获取各层数据
- **性能优化**：InstancedMesh 批量渲染，异步加载与懒加载处理，合批管理

---

## 🧱 项目功能

### ✅ 主要功能

- 支持将每层积木数据以在线 JSON 文件形式存储并按需加载。
- 使用动态请求（如 fetch 或 axios）拉取模型层级数据。
- 使用 `<TresCanvas>` 与 `<TresMesh>` 渲染每一块积木。
- 用户可点击“上一层 / 下一层”按钮切换展示层。
- 用户可通过复选框勾选任意层级实现自由组合显示。
- 支持使用 Three.js 控制器对整个模型进行旋转、缩放和拖动操作。
- 针对大模型（10w+ 积木）设计：采用 InstancedMesh 批量渲染方式，极大提升性能。

### 🔍 JSON 数据结构（单层多颗）

```json
[  {
        "center": [
            -0.057241534000000004,
            0.005784713000000004,
            -0.08679759
        ],
        "shape": [
            1,
            3
        ],
        "size": 0.008,
        "thickness": 0.008,
        "circle_radius": 0.001625,
        "cylinder_thickness": 0.002,
        "color": [
            0.41,
            0.67,
            0.36000000000000004
        ]
    },]
```

### 🧱 Brick 类结构设计

每一块积木对应一个类实例，统一封装其渲染与数据属性。

```ts
export class Brick {
  type: string
  position: [number, number, number]
  rotation: [number, number, number]
  color: string

  constructor(data: BrickData) {
    this.type = data.type
    this.position = data.position
    this.rotation = data.rotation
    this.color = data.color
  }

  toMesh() {
    // 返回对应的 Three.js Mesh 或 Tres 组件渲染结构
  }
}
```

---

## 🧩 模块设计

### 📂 项目结构

```
src/
├── components/
│   ├── BrickLayer.vue          # 单层积木渲染组件
│   ├── BrickViewer.vue         # 主展示区域（包含交互按钮 + 控制器）
│   └── LayerControls.vue       # 层控制按钮/复选框
├── composables/
│   └── useLayerLoader.ts       # 用于按需加载层数据的逻辑封装
├── models/
│   └── Brick.ts                # 定义 Brick 类及其渲染逻辑
├── App.vue
└── main.ts
```

### ⚙️ 关键逻辑

- 使用 `ref(currentIndex)` 管理当前显示层。
- 使用 `computed` 或 `v-model` 管理复选框控制的 `visibleLayers`。
- 每次切换时，通过 `useLayerLoader` 请求对应 JSON 地址并缓存数据。
- 每块积木通过 `new Brick(data)` 创建类实例，再渲染对应 Mesh。
- 使用 Tres.js 内置的 OrbitControls 实现对整个场景的控制（旋转、缩放、平移）。
- 渲染性能优化：
  - 利用 InstancedMesh 批量渲染同类型积木，避免性能瓶颈。
  - 异步加载数据，逐层加载，按需显示。
  - 积木渲染中使用缓存避免重复生成材质和几何体。

#### useLayerLoader 示例逻辑：

```ts
import { ref } from 'vue'
import axios from 'axios'

const layerCache = ref<Record<number, any>>({})

export async function loadLayer(index: number) {
  if (layerCache.value[index]) return layerCache.value[index]
  const url = `https://example.com/layers/layer-${index}.json`
  const { data } = await axios.get(url)
  layerCache.value[index] = data
  return data
}
```

---

## 🧪 用户交互设计

### 按钮交互

```vue
<button @click="prevLayer">上一层</button>
<button @click="nextLayer">下一层</button>
```

### 自定义层选择

```vue
<label v-for="(layer, index) in layers" :key="index">
  <input type="checkbox" v-model="visibleLayers[index]" />
  显示第 {{ index + 1 }} 层
</label>
```

### 模型控制器（OrbitControls）

```vue
<TresCanvas>
  <TresOrbitControls />
  <!-- 模型渲染区域 -->
</TresCanvas>
```

- 用户可使用鼠标拖动旋转模型，滚轮缩放，右键平移。
- 控制器可设置阻尼、缩放限制、旋转范围等参数。

---

## 💡 Cursor 编辑器集成建议

### 智能提示

- 自动识别从 URL 请求返回的 JSON 数据结构。
- 鼠标悬停 `<BrickLayer>` 组件时，提示该层对应的数据字段及来源链接。
- 鼠标悬停 `new Brick(...)` 时可提示构造参数类型和支持的方法。
- 鼠标悬停 `<TresOrbitControls>` 时可提示支持的交互参数。

### 推荐插件

- Volar（Vue + TS 支持）
- Tres.js 类型提示插件
- TailwindCSS IntelliSense

### 推荐配置

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "types": ["@tresjs/core"]
  }
}
```

---

## ✅ 后续计划

- ✅ 动画过渡支持（切换层级时平滑显示）
- ✅ 层级颜色方案优化（每层不同色彩方案）
- ✅ 支持模型旋转缩放控制（OrbitControls）
- ✅ 支持大型模型渲染（InstancedMesh + 合批管理）
- ⬜ 支持用户自定义上传 JSON 数据
- ⬜ Brick 类中加入透明度、材质等高级属性封装

---

如需进一步生成组件模板、性能基准测试建议，或集成 Worker/WebGL 降级方案，欢迎继续提出！

