import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const LAYERS = 5
const BRICKS_PER_LAYER = 200 // 增加积木数量来测试性能
const COLORS = [
	[1, 0, 0], // 红色
	[0, 1, 0], // 绿色
	[0, 0, 1], // 蓝色
	[1, 1, 0], // 黄色
	[1, 0, 1], // 紫色
	[0, 1, 1], // 青色
	[1, 0.5, 0], // 橙色
	[0.5, 0, 1], // 紫罗兰
	[0, 0.5, 0], // 深绿
	[0.5, 0.5, 0.5], // 灰色
]

// 积木类型配置
const BRICK_TYPES = [
	{ shape: [1, 1], hasCylinder: false, weight: 0.3 }, // 1x1 方块
	{ shape: [2, 1], hasCylinder: false, weight: 0.2 }, // 2x1 板
	{ shape: [1, 2], hasCylinder: false, weight: 0.2 }, // 1x2 板
	{ shape: [2, 2], hasCylinder: false, weight: 0.15 }, // 2x2 板
	{ shape: [1, 1], hasCylinder: true, weight: 0.1 }, // 1x1 带圆柱
	{ shape: [2, 1], hasCylinder: true, weight: 0.05 }, // 2x1 带圆柱
]

// 生成随机积木数据
function generateBrick(layerIndex) {
	// 随机选择积木类型
	const brickType = BRICK_TYPES[Math.floor(Math.random() * BRICK_TYPES.length)]

	// 随机选择颜色
	const color = COLORS[Math.floor(Math.random() * COLORS.length)]

	// 生成位置（在合理范围内）
	const x = (Math.random() - 0.5) * 0.2
	const y = layerIndex * 0.02 + 0.01 // 每层间隔2cm
	const z = (Math.random() - 0.5) * 0.2

	// 基础积木数据
	const brick = {
		center: [x, y, z],
		size: 0.008, // 8mm 基础尺寸
		thickness: 0.003, // 3mm 厚度
		shape: brickType.shape,
		color: color,
	}

	// 如果是有圆柱体的积木，添加圆柱体参数
	if (brickType.hasCylinder) {
		brick.circle_radius = 0.002 // 2mm 半径
		brick.cylinder_thickness = 0.002 // 2mm 厚度
	}

	return brick
}

// 生成单层数据
function generateLayer(layerIndex) {
	const bricks = []

	for (let i = 0; i < BRICKS_PER_LAYER; i++) {
		bricks.push(generateBrick(layerIndex))
	}

	return bricks
}

// 生成所有层数据
function generateAllLayers() {
	const mockDir = path.join(__dirname, '..', 'public', 'mock')

	// 确保目录存在
	if (!fs.existsSync(mockDir)) {
		fs.mkdirSync(mockDir, { recursive: true })
	}

	for (let layer = 1; layer <= LAYERS; layer++) {
		const layerData = generateLayer(layer - 1)
		const filePath = path.join(mockDir, `layer-${layer}.json`)

		fs.writeFileSync(filePath, JSON.stringify(layerData, null, 2))
		console.log(`Generated layer-${layer}.json with ${layerData.length} bricks`)
	}

	console.log(
		`\nGenerated ${LAYERS} layers with ${BRICKS_PER_LAYER} bricks each`,
	)
	console.log(`Total: ${LAYERS * BRICKS_PER_LAYER} bricks`)
	console.log(`Files saved to: ${mockDir}`)
}

// 生成性能测试数据
function generatePerformanceTestData() {
	const mockDir = path.join(__dirname, '..', 'public', 'mock')

	// 确保目录存在
	if (!fs.existsSync(mockDir)) {
		fs.mkdirSync(mockDir, { recursive: true })
	}

	// 生成不同规模的测试数据
	const testSizes = [50, 100, 200, 500, 1000]

	testSizes.forEach((size) => {
		const bricks = []
		for (let i = 0; i < size; i++) {
			bricks.push(generateBrick(0))
		}

		const filePath = path.join(mockDir, `performance-test-${size}.json`)
		fs.writeFileSync(filePath, JSON.stringify(bricks, null, 2))
		console.log(
			`Generated performance-test-${size}.json with ${bricks.length} bricks`,
		)
	})

	console.log(
		`\nPerformance test data generated with sizes: ${testSizes.join(', ')}`,
	)
}

// 主函数
function main() {
	console.log('Generating mock data for 3D Brick Viewer...\n')

	// 生成标准层数据
	generateAllLayers()

	console.log('\n' + '='.repeat(50) + '\n')

	// 生成性能测试数据
	generatePerformanceTestData()

	console.log('\nMock data generation completed!')
}

// 运行脚本
main()
