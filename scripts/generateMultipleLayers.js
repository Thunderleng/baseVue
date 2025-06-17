import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 读取第一层作为模板
const layer1Path = path.join(__dirname, '../public/mock/layer-1.json')
const layer1Data = JSON.parse(fs.readFileSync(layer1Path, 'utf8'))

// 生成多个层的数据
const maxLayers = 20 // 生成20层数据

for (let i = 1; i <= maxLayers; i++) {
	const layerData = layer1Data.map((brick) => {
		// 为每一层稍微调整位置和颜色
		const offsetX = (i - 1) * 0.01 // 每层X轴偏移
		const offsetY = (i - 1) * 0.01 // 每层Y轴偏移

		return {
			...brick,
			center: [
				brick.center[0] + offsetX,
				brick.center[1] + offsetY,
				brick.center[2],
			],
			// 稍微调整颜色，让每层略有不同
			color: [
				Math.min(255, Math.max(0, brick.color[0] + (i % 3) * 10)),
				Math.min(255, Math.max(0, brick.color[1] + (i % 3) * 5)),
				Math.min(255, Math.max(0, brick.color[2] + (i % 3) * 15)),
			],
		}
	})

	const outputPath = path.join(__dirname, `../public/mock/layer-${i}.json`)
	fs.writeFileSync(outputPath, JSON.stringify(layerData, null, 2))
	console.log(`Generated layer-${i}.json with ${layerData.length} bricks`)
}

console.log(`\nGenerated ${maxLayers} layers successfully!`)
