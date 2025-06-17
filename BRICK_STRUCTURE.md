# 🧱 积木结构说明 (Y轴平行坐标系)

## 📋 积木数据结构

每个积木都是一个复合结构，**平行于Y轴**，由以下部分组成：

### JSON数据格式
```json
{
  "center": [x, y, z],           // 积木中心位置
  "shape": [width, depth],       // 底部形状尺寸 (1x1, 1x2, 1x3等)
  "size": 0.008,                 // 基础尺寸单位
  "thickness": 0.008,            // 底部厚度 (Y轴方向)
  "circle_radius": 0.001625,     // 顶部圆柱体半径 (可选)
  "cylinder_thickness": 0.002,   // 顶部圆柱体高度 (可选)
  "color": [r, g, b]             // 积木颜色 (RGB 0-1)
}
```

## 🏗️ 坐标系说明

### 新的坐标系布局
- **X轴**: 积木宽度方向
- **Y轴**: 积木厚度方向 (垂直向上)
- **Z轴**: 积木深度方向

### 积木朝向
- 积木**平行于Y轴**放置
- 底部正方体/长方体沿Y轴延伸
- 顶部圆柱体沿Y轴延伸
- **整体沿Y轴旋转90°**，以获得正确的显示朝向

## 🎨 渲染逻辑

### 底部结构 (平行于Y轴)
```javascript
// 底部正方体/长方体 - 平行于Y轴
const baseWidth = brickData.size * brickData.shape[0]   // X方向宽度
const baseHeight = brickData.size * brickData.shape[1]  // Z方向深度
const baseDepth = brickData.thickness                   // Y方向厚度

// 创建底部几何体 (width, height, depth)
const baseGeometry = new THREE.BoxGeometry(baseWidth, baseDepth, baseHeight)
```

### 顶部结构 (平行于Y轴)
```javascript
// 顶部圆柱体 (如果存在) - 平行于Y轴
if (brickData.circle_radius && brickData.circle_radius > 0) {
  const cylinderGeometry = new THREE.CylinderGeometry(
    brickData.circle_radius,                    // 半径
    brickData.circle_radius,                    // 半径 (圆柱体)
    brickData.cylinder_thickness || 0.002,      // 高度 (Y轴方向)
    12                                          // 分段数
  )
}
```

### 位置计算 (Y轴平行)
```javascript
// 底部位置 (BoxGeometry中心在几何体中心)
baseMesh.position.y = baseDepth / 2

// 顶部圆柱体位置 (在底部上方，沿Y轴)
cylinderMesh.position.y = baseDepth + (cylinder_thickness / 2)

// 整体旋转 (沿Y轴旋转90度)
brickGroup.rotation.y = Math.PI / 2
```

### 旋转说明
- **Y轴旋转90°**：`rotation.y = Math.PI / 2`
- 旋转后，积木的宽度方向变为Z轴
- 积木的深度方向变为X轴
- 厚度方向仍为Y轴

## 🔧 技术实现

### 1. 复合几何体 (Y轴平行)
- 使用 `THREE.Group` 组合多个几何体
- 底部和顶部使用相同材质
- 分别设置阴影和位置
- 所有几何体平行于Y轴

### 2. 相机设置 (适应Y轴平行)
```javascript
// 相机位置调整
camera.position.set(0.2, 0.1, 0.2) // 适应Y轴平行坐标系

// 自适应视角调整
camera.position.y = center.y + cameraZ * Math.sin(angle) * 0.5 // Y轴缩放
```

### 3. 光照设置 (适应Y轴平行)
```javascript
// 方向光位置调整
directionalLight.position.set(0.3, 0.5, 0.3) // 适应Y轴平行

// 点光源位置调整
pointLight.position.set(-0.2, 0.3, -0.2) // 适应Y轴平行
```

## 📊 尺寸规格 (Y轴平行)

### 标准尺寸
- **基础尺寸**: 0.008 单位
- **底部厚度**: 0.008 单位 (Y轴方向)
- **圆柱半径**: 0.001625 单位
- **圆柱高度**: 0.002 单位 (Y轴方向)

### 形状尺寸 (Y轴平行)
- **1x1**: 0.008 × 0.008 × 0.008 (X×Y×Z)
- **1x2**: 0.008 × 0.008 × 0.016 (X×Y×Z)
- **1x3**: 0.008 × 0.008 × 0.024 (X×Y×Z)

## 🎯 使用示例

### 1x1 带圆柱积木 (Y轴平行)
```json
{
  "center": [0.046, -0.002, -0.087],
  "shape": [1, 1],
  "size": 0.008,
  "thickness": 0.008,
  "circle_radius": 0.001625,
  "cylinder_thickness": 0.002,
  "color": [0.41, 0.67, 0.67]
}
```
**渲染结果**: 底部1x1正方体 + 顶部圆柱体，都平行于Y轴

### 1x3 板状积木 (Y轴平行)
```json
{
  "center": [0.030, 0.021, -0.087],
  "shape": [1, 3],
  "size": 0.008,
  "thickness": 0.008,
  "circle_radius": 0,
  "color": [0.41, 0.67, 0.67]
}
```
**渲染结果**: 1x3长方体，平行于Y轴

## 🔍 调试信息

控制台会输出每个积木的渲染信息：
```
Rendered brick: 1x1 with cylinder at position: [0.046, -0.002, -0.087]
Rendered brick: 1x3 plate at position: [0.030, 0.021, -0.087]
```

## 🎮 视角控制

### 相机设置
- **初始位置**: (0.2, 0.1, 0.2) - 适应Y轴平行
- **FOV**: 45° - 更自然的透视
- **控制范围**: 0.01 - 2.0 距离

### 自适应视角
- 自动计算场景边界
- 调整相机位置适应Y轴平行
- Y轴缩放因子: 0.5

---

**现在积木正确平行于Y轴，朝向已同步调整！** 🎉 