/**
 * 积木数据转换工具
 * 用于在编辑器格式和展示器格式之间进行转换
 */

// 展示器格式的积木数据结构
export interface ViewerBrickData {
	center: [number, number, number]
	shape: [number, number]
	size: number
	thickness: number
	circle_radius: number
	cylinder_thickness: number
	color: [number, number, number]
	orientation?: number // 朝向角度（度）
	rotationX?: number // X轴旋转角度
	rotationY?: number // Y轴旋转角度
	rotationZ?: number // Z轴旋转角度
}

// 编辑器格式的积木数据结构
export interface EditorBrickData {
	id: string
	position: [number, number, number]
	rotation: number
	size: [number, number]
	color: string
}

// 展示器多层格式
export interface ViewerLayerData {
	layers: {
		bricks: ViewerBrickData[]
	}[]
}

// 编辑器导出格式
export interface EditorExportData {
	bricks: EditorBrickData[]
	metadata: {
		version: string
		exportDate: string
		totalBricks: number
		gridSize: number
	}
}

/**
 * 将展示器格式转换为编辑器格式
 */
export function viewerToEditor(viewerBrick: ViewerBrickData): EditorBrickData {
	return {
		id: generateId(),
		position: viewerBrick.center,
		rotation: viewerBrick.orientation || 0,
		size: viewerBrick.shape,
		color: rgbToHex(viewerBrick.color)
	}
}

/**
 * 将编辑器格式转换为展示器格式
 */
export function editorToViewer(editorBrick: EditorBrickData): ViewerBrickData {
	return {
		center: editorBrick.position,
		shape: editorBrick.size,
		size: 0.008, // 标准尺寸
		thickness: 0.008, // 标准厚度
		circle_radius: 0, // 默认无圆柱体
		cylinder_thickness: 0.002, // 默认圆柱体厚度
		color: hexToRgb(editorBrick.color),
		orientation: editorBrick.rotation
	}
}

/**
 * 将展示器多层格式转换为编辑器格式
 */
export function viewerLayersToEditor(viewerData: ViewerLayerData): EditorBrickData[] {
	const editorBricks: EditorBrickData[] = []
	
	viewerData.layers.forEach((layer, layerIndex) => {
		layer.bricks.forEach((viewerBrick) => {
			// 调整Y坐标以反映层级
			const adjustedBrick = {
				...viewerBrick,
				center: [
					viewerBrick.center[0],
					layerIndex * 0.02 + viewerBrick.center[1], // 每层间隔2cm
					viewerBrick.center[2]
				] as [number, number, number]
			}
			
			editorBricks.push(viewerToEditor(adjustedBrick))
		})
	})
	
	return editorBricks
}

/**
 * 将编辑器格式转换为展示器多层格式
 */
export function editorToViewerLayers(editorBricks: EditorBrickData[]): ViewerLayerData {
	// 按Y坐标分组到不同层级
	const layerMap = new Map<number, ViewerBrickData[]>()
	
	editorBricks.forEach(editorBrick => {
		const layerIndex = Math.round(editorBrick.position[1] / 0.02) // 每层间隔2cm
		const adjustedBrick = {
			...editorToViewer(editorBrick),
			center: [
				editorBrick.position[0],
				editorBrick.position[1] - (layerIndex * 0.02), // 移除层级偏移
				editorBrick.position[2]
			] as [number, number, number]
		}
		
		if (!layerMap.has(layerIndex)) {
			layerMap.set(layerIndex, [])
		}
		layerMap.get(layerIndex)!.push(adjustedBrick)
	})
	
	// 转换为展示器格式
	const layers: { bricks: ViewerBrickData[] }[] = []
	const sortedLayers = Array.from(layerMap.entries()).sort(([a], [b]) => a - b)
	
	sortedLayers.forEach(([layerIndex, bricks]) => {
		layers.push({ bricks })
	})
	
	return { layers }
}

/**
 * 将展示器单层数组格式转换为编辑器格式
 */
export function viewerArrayToEditor(viewerBricks: ViewerBrickData[]): EditorBrickData[] {
	return viewerBricks.map(viewerToEditor)
}

/**
 * 将编辑器格式转换为展示器单层数组格式
 */
export function editorToViewerArray(editorBricks: EditorBrickData[]): ViewerBrickData[] {
	return editorBricks.map(editorToViewer)
}

/**
 * 生成唯一ID
 */
function generateId(): string {
	return 'brick_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

/**
 * RGB数组转换为十六进制颜色
 */
function rgbToHex(rgb: [number, number, number]): string {
	const [r, g, b] = rgb.map(c => Math.round(c * 255))
	return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')
}

/**
 * 十六进制颜色转换为RGB数组
 */
function hexToRgb(hex: string): [number, number, number] {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	if (!result) {
		return [0.5, 0.5, 0.5] // 默认灰色
	}
	return [
		parseInt(result[1], 16) / 255,
		parseInt(result[2], 16) / 255,
		parseInt(result[3], 16) / 255
	]
}

/**
 * 创建标准积木数据（用于编辑器）
 */
export function createStandardBrick(
	position: [number, number, number],
	shape: [number, number] = [1, 1],
	color: string = '#ff0000',
	hasCylinder: boolean = false
): ViewerBrickData {
	return {
		center: position,
		shape,
		size: 0.008,
		thickness: 0.008,
		circle_radius: hasCylinder ? 0.001625 : 0,
		cylinder_thickness: 0.002,
		color: hexToRgb(color)
	}
}

/**
 * 验证积木数据格式
 */
export function validateViewerBrickData(data: any): data is ViewerBrickData {
	return (
		Array.isArray(data.center) && data.center.length === 3 &&
		Array.isArray(data.shape) && data.shape.length === 2 &&
		typeof data.size === 'number' &&
		typeof data.thickness === 'number' &&
		typeof data.circle_radius === 'number' &&
		typeof data.cylinder_thickness === 'number' &&
		Array.isArray(data.color) && data.color.length === 3
	)
}

/**
 * 解析JSON数据，自动识别格式并转换
 */
export function parseBrickData(jsonString: string): EditorBrickData[] {
	try {
		const data = JSON.parse(jsonString)
		
		// 如果是数组，检查是否为展示器格式
		if (Array.isArray(data)) {
			if (data.length > 0 && validateViewerBrickData(data[0])) {
				// 展示器单层数组格式
				return viewerArrayToEditor(data)
			} else {
				// 编辑器数组格式
				return data
			}
		}
		
		// 如果是对象
		if (typeof data === 'object') {
			if (data.layers && Array.isArray(data.layers)) {
				// 展示器多层格式
				return viewerLayersToEditor(data as ViewerLayerData)
			} else if (data.bricks && Array.isArray(data.bricks)) {
				// 编辑器导出格式
				return data.bricks
			}
		}
		
		throw new Error('不支持的JSON格式')
	} catch (error) {
		console.error('解析积木数据失败:', error)
		throw error
	}
}

/**
 * 导出为展示器格式
 */
export function exportToViewerFormat(editorBricks: EditorBrickData[]): string {
	const viewerBricks = editorToViewerArray(editorBricks)
	return JSON.stringify(viewerBricks, null, 2)
}

/**
 * 导出为展示器多层格式
 */
export function exportToViewerLayersFormat(editorBricks: EditorBrickData[]): string {
	const viewerLayers = editorToViewerLayers(editorBricks)
	return JSON.stringify(viewerLayers, null, 2)
} 