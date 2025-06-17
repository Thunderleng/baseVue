const fs = require('fs')
const path = require('path')

// 生成随机积木数据
function generateBrickData(x, y, z, type = 'cube') {
  const colors = [
    [0.41, 0.67, 0.36], // 绿色
    [0.8, 0.2, 0.2],    // 红色
    [0.2, 0.2, 0.8],    // 蓝色
    [0.8, 0.8, 0.2],    // 黄色
    [0.6, 0.3, 0.8],    // 紫色
    [0.9, 0.4, 0.1],    // 橙色
    [0.1, 0.7, 0.9],    // 青色
    [0.9, 0.1, 0.7],    // 粉色
    [0.3, 0.9, 0.3],    // 亮绿色
    [0.7, 0.7, 0.7]     // 灰色
  ]

  const baseData = {
    center: [x * 0.016, y * 0.008, z * 0.016],
    size: 0.008,
    thickness: 0.008,
    circle_radius: 0,
    cylinder_thickness: 0.002,
    color: colors[Math.floor(Math.random() * colors.length)]
  }

  switch (type) {
    case 'cube':
      return {
        ...baseData,
        shape: [1, 1]
      }
    case 'plate':
      return {
        ...baseData,
        shape: [Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 3) + 1],
        thickness: 0.004
      }
    case 'cylinder':
      return {
        ...baseData,
        shape: [1, 1],
        circle_radius: 0.004,
        thickness: 0.008
      }
    default:
      return baseData
  }
}

// 生成一层的数据
function generateLayerData(layerIndex, brickCount = 20) {
  const bricks = []
  const types = ['cube', 'plate', 'cylinder']
  
  for (let i = 0; i < brickCount; i++) {
    const x = Math.floor(Math.random() * 10) - 5
    const y = layerIndex
    const z = Math.floor(Math.random() * 10) - 5
    const type = types[Math.floor(Math.random() * types.length)]
    
    bricks.push(generateBrickData(x, y, z, type))
  }
  
  return bricks
}

// 生成多层数据
function generateAllLayers(layerCount = 5) {
  const mockDir = path.join(__dirname, '../public/mock')
  
  // 确保目录存在
  if (!fs.existsSync(mockDir)) {
    fs.mkdirSync(mockDir, { recursive: true })
  }
  
  for (let i = 0; i < layerCount; i++) {
    const layerData = generateLayerData(i, 15 + Math.floor(Math.random() * 10))
    const filePath = path.join(mockDir, `layer-${i}.json`)
    
    fs.writeFileSync(filePath, JSON.stringify(layerData, null, 2))
    console.log(`Generated layer-${i}.json with ${layerData.length} bricks`)
  }
  
  console.log(`\nGenerated ${layerCount} layers in ${mockDir}`)
}

// 运行生成器
if (require.main === module) {
  const layerCount = process.argv[2] ? parseInt(process.argv[2]) : 5
  generateAllLayers(layerCount)
}

module.exports = {
  generateBrickData,
  generateLayerData,
  generateAllLayers
} 