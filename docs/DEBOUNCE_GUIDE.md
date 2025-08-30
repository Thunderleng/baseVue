# 防抖功能使用指南

## 概述

本项目实现了滑动层数时的防抖效果，确保在0.2秒内只请求并渲染一层数据，有效提升大量数据渲染的性能。同时实现了加载状态控制，在未加载完所有需要加载的层数前，用户不允许再滑动。

## 功能特性

- **防抖延迟**: 0.2秒防抖延迟，避免频繁请求
- **批量加载**: 智能批量加载新层数据
- **状态显示**: 实时显示防抖状态和加载状态
- **加载控制**: 在层数据加载期间禁用所有交互操作
- **性能优化**: 减少不必要的网络请求和渲染

## 核心组件

### 1. useDebounce Composable

位于 `src/composables/useDebounce.ts`，提供两种防抖功能：

#### useDebounce - 函数防抖
```typescript
import { useDebounce } from '@/composables/useDebounce'

const { debouncedFn, immediateFn, cancel, isDebouncing } = useDebounce(
  (value) => {
    console.log('防抖执行:', value)
  },
  200 // 200ms延迟
)

// 使用防抖函数
debouncedFn('test')

// 立即执行（取消防抖）
immediateFn('test')

// 取消防抖
cancel()
```

#### useDebouncedValue - 值防抖
```typescript
import { useDebouncedValue } from '@/composables/useDebounce'

const { 
  value, 
  debouncedValue, 
  setValue, 
  setValueImmediate, 
  cancel, 
  isDebouncing 
} = useDebouncedValue(initialValue, 200)

// 设置值（带防抖）
setValue(newValue)

// 立即设置值（取消防抖）
setValueImmediate(newValue)
```

### 2. LayerControls 组件

位于 `src/components/LayerControls.vue`，集成了防抖和加载控制功能：

- 滑动条控制渲染层数
- 实时显示防抖状态和加载状态
- 在加载期间禁用所有交互操作
- 按钮操作立即执行（不防抖，但在加载期间禁用）

### 3. BrickViewer 组件

位于 `src/components/BrickViewer.vue`，优化了层数据加载：

- 智能检测需要加载的新层
- 批量加载，每层间隔100ms
- 避免重复加载已缓存的数据
- 加载状态管理和控制

## 使用方法

### 基本使用

1. **滑动条防抖**：
   - 拖动滑动条时，会显示"防抖中..."状态
   - 0.2秒后自动执行渲染请求
   - 在层数据加载期间，滑动条被禁用

2. **层数据加载**：
   - 自动检测需要加载的新层
   - 批量加载，避免同时请求过多数据
   - 显示每层的加载状态
   - 在加载期间禁用所有交互操作

3. **加载状态控制**：
   - 显示全局加载状态提示
   - 禁用滑动条、按钮和复选框
   - 提供清晰的视觉反馈

### 加载状态管理

```typescript
// 在BrickViewer组件中
const isLayerLoading = ref(false)

// 开始加载时设置状态
isLayerLoading.value = true

// 加载完成后重置状态
isLayerLoading.value = false

// 传递给LayerControls组件
<LayerControls :is-layer-loading="isLayerLoading" />
```

### 测试页面

访问 `/debounce-test` 页面可以测试防抖功能：

- 滑动条防抖测试
- 按钮防抖测试
- 输入框防抖测试

## 性能优化

### 1. 网络请求优化
- 防抖减少不必要的网络请求
- 批量加载避免同时发起多个请求
- 缓存已加载的层数据
- 加载状态控制避免重复请求

### 2. 渲染优化
- 只渲染可见的层
- 使用InstancedMesh提升渲染性能
- 智能清理不可见的层数据

### 3. 内存管理
- 自动清理未使用的层数据
- 优化Three.js对象的内存使用
- 防止内存泄漏

### 4. 用户体验优化
- 加载期间禁用交互，避免操作冲突
- 清晰的加载状态提示
- 平滑的加载动画

## 配置选项

### 防抖延迟时间
```typescript
// 在 LayerControls.vue 中修改
const { ... } = useDebouncedValue(4, 200) // 200ms延迟
```

### 批量加载间隔
```typescript
// 在 BrickViewer.vue 中修改
setTimeout(() => {
  loadLayerData(index)
}, i * 100) // 每层间隔100ms
```

## 注意事项

1. **防抖状态**: 确保用户了解当前是否在防抖中
2. **加载状态**: 在加载期间禁用所有交互操作
3. **立即操作**: 按钮操作应该立即执行，不受防抖影响
4. **错误处理**: 网络请求失败时要有适当的错误处理
5. **性能监控**: 监控渲染性能和内存使用情况

## 扩展功能

### 自定义防抖策略
```typescript
// 可以根据不同操作设置不同的防抖时间
const quickDebounce = useDebouncedValue(value, 100)  // 快速响应
const slowDebounce = useDebouncedValue(value, 500)   // 慢速响应
```

### 防抖状态持久化
```typescript
// 可以将防抖状态保存到本地存储
const savedValue = localStorage.getItem('renderLayers')
const { value } = useDebouncedValue(parseInt(savedValue) || 4, 200)
```

### 加载状态自定义
```typescript
// 可以自定义加载状态的显示样式和行为
const customLoadingState = {
  isVisible: true,
  message: '正在加载层数据...',
  showProgress: true,
  allowCancel: true
}
```

## 故障排除

### 常见问题

1. **防抖不生效**: 检查是否正确使用了防抖函数
2. **状态不同步**: 确保使用正确的响应式变量
3. **内存泄漏**: 检查是否正确清理了定时器
4. **加载状态卡住**: 检查是否正确重置了加载状态

### 调试技巧

1. 查看控制台日志了解防抖执行情况
2. 使用Vue DevTools检查响应式状态
3. 监控网络请求确认防抖效果
4. 检查加载状态的切换时机 