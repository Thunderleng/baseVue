import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface BrickItem {
	id: string
	position: [number, number, number] // 世界坐标（对齐格点）
	rotation: number // Y轴旋转（单位：度）
	size: [number, number] // 如 [1, 2] 表示 1x2
	color: string // hex 颜色值
}

export const useBrickEditorStore = defineStore('brickEditor', () => {
	// 积木列表
	const bricks = ref<BrickItem[]>([])
	
	// 当前选中的积木
	const selectedBrickId = ref<string | null>(null)
	const selectedBrickIds = ref<string[]>([])
	
	// 当前工具模式
	const toolMode = ref<'add' | 'move' | 'delete' | 'rotate' | 'color'>('add')
	
	// 选择模式
	const selectionMode = ref<'single' | 'multiple' | 'box'>('single')
	
	// 当前颜色
	const currentColor = ref('#ff6b6b')
	
	// 当前积木尺寸
	const currentSize = ref<[number, number]>([1, 1])
	
	// 可用的积木尺寸选项
	const availableSizes = ref<[number, number][]>([
		[1, 1], // 1x1
		[1, 2], // 1x2
		[2, 1], // 2x1
		[2, 2], // 2x2
		[1, 3], // 1x3
		[3, 1], // 3x1
		[2, 3], // 2x3
		[3, 2], // 3x2
		[3, 3], // 3x3
		[1, 4], // 1x4
		[4, 1], // 4x1
		[2, 4], // 2x4
		[4, 2], // 4x2
	])
	
	// 网格大小
	const gridSize = ref(1)
	
	// 撤销/重做历史
	const history = ref<BrickItem[][]>([])
	const historyIndex = ref(-1)
	const maxHistorySize = 50
	
	// 计算属性
	const selectedBrick = computed(() => {
		return bricks.value.find(brick => brick.id === selectedBrickId.value) || null
	})
	
	const brickCount = computed(() => bricks.value.length)
	
	const canUndo = computed(() => historyIndex.value > 0)
	
	const canRedo = computed(() => historyIndex.value < history.value.length - 1)
	
	// 保存历史
	function saveHistory() {
		// 删除当前位置之后的历史
		history.value.splice(historyIndex.value + 1)
		
		// 添加新的历史记录
		history.value.push(JSON.parse(JSON.stringify(bricks.value)))
		historyIndex.value++
		
		// 限制历史记录数量
		if (history.value.length > maxHistorySize) {
			history.value.shift()
			historyIndex.value--
		}
	}
	
	// 添加积木
	function addBrick(position: [number, number, number]) {
		const newBrick: BrickItem = {
			id: generateId(),
			position,
			rotation: 0,
			size: [...currentSize.value],
			color: currentColor.value,
		}
		
		bricks.value.push(newBrick)
		selectedBrickId.value = newBrick.id
		saveHistory()
		return newBrick
	}
	
	// 删除积木
	function deleteBrick(id: string) {
		const index = bricks.value.findIndex(brick => brick.id === id)
		if (index !== -1) {
			bricks.value.splice(index, 1)
			if (selectedBrickId.value === id) {
				selectedBrickId.value = null
			}
			// 从多选列表中移除
			const multiIndex = selectedBrickIds.value.indexOf(id)
			if (multiIndex !== -1) {
				selectedBrickIds.value.splice(multiIndex, 1)
			}
			saveHistory()
		}
	}
	
	// 移动积木
	function moveBrick(id: string, position: [number, number, number]) {
		const brick = bricks.value.find(brick => brick.id === id)
		if (brick) {
			brick.position = position
		}
	}
	
	// 旋转积木
	function rotateBrick(id: string, rotation: number) {
		const brick = bricks.value.find(brick => brick.id === id)
		if (brick) {
			brick.rotation = rotation
		}
	}
	
	// 改变积木颜色
	function changeBrickColor(id: string, color: string) {
		const brick = bricks.value.find(brick => brick.id === id)
		if (brick) {
			brick.color = color
		}
	}
	
	// 选择积木
	function selectBrick(id: string | null) {
		if (selectionMode.value === 'single') {
			selectedBrickId.value = id
			selectedBrickIds.value = id ? [id] : []
		} else if (selectionMode.value === 'multiple') {
			if (id) {
				const index = selectedBrickIds.value.indexOf(id)
				if (index === -1) {
					selectedBrickIds.value.push(id)
				} else {
					selectedBrickIds.value.splice(index, 1)
				}
				selectedBrickId.value = selectedBrickIds.value.length > 0 ? selectedBrickIds.value[0] : null
			}
		}
	}
	
	// 全选
	function selectAll() {
		selectedBrickIds.value = bricks.value.map(brick => brick.id)
		selectedBrickId.value = selectedBrickIds.value.length > 0 ? selectedBrickIds.value[0] : null
	}
	
	// 取消选择
	function deselectAll() {
		selectedBrickId.value = null
		selectedBrickIds.value = []
	}
	
	// 设置工具模式
	function setToolMode(mode: 'add' | 'move' | 'delete' | 'rotate' | 'color') {
		toolMode.value = mode
	}
	
	// 设置选择模式
	function setSelectionMode(mode: 'single' | 'multiple' | 'box') {
		selectionMode.value = mode
		if (mode === 'single') {
			selectedBrickIds.value = selectedBrickId.value ? [selectedBrickId.value] : []
		}
	}
	
	// 设置当前颜色
	function setCurrentColor(color: string) {
		currentColor.value = color
	}
	
	// 设置当前尺寸
	function setCurrentSize(size: [number, number]) {
		currentSize.value = size
	}
	
	// 清空所有积木
	function clearAllBricks() {
		bricks.value = []
		selectedBrickId.value = null
		selectedBrickIds.value = []
		saveHistory()
	}
	
	// 撤销
	function undo() {
		if (canUndo.value) {
			historyIndex.value--
			bricks.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
			// 清理无效的选择
			cleanupSelection()
		}
	}
	
	// 重做
	function redo() {
		if (canRedo.value) {
			historyIndex.value++
			bricks.value = JSON.parse(JSON.stringify(history.value[historyIndex.value]))
			// 清理无效的选择
			cleanupSelection()
		}
	}
	
	// 清理无效的选择
	function cleanupSelection() {
		const validIds = new Set(bricks.value.map(brick => brick.id))
		selectedBrickIds.value = selectedBrickIds.value.filter(id => validIds.has(id))
		selectedBrickId.value = selectedBrickId.value && validIds.has(selectedBrickId.value) 
			? selectedBrickId.value 
			: selectedBrickIds.value.length > 0 ? selectedBrickIds.value[0] : null
	}
	
	// 导出积木数据
	function exportBricks(): BrickItem[] {
		return JSON.parse(JSON.stringify(bricks.value))
	}
	
	// 导出为JSON文件格式（兼容积木展示器）
	function exportToJSON(): string {
		const exportData = {
			bricks: bricks.value,
			metadata: {
				version: '1.0',
				exportDate: new Date().toISOString(),
				totalBricks: bricks.value.length,
				gridSize: gridSize.value,
			}
		}
		return JSON.stringify(exportData, null, 2)
	}
	
	// 导入积木数据
	function importBricks(data: BrickItem[]) {
		bricks.value = JSON.parse(JSON.stringify(data))
		selectedBrickId.value = null
		selectedBrickIds.value = []
		saveHistory()
	}
	
	// 从JSON文件导入（兼容积木展示器）
	function importFromJSON(jsonString: string): boolean {
		try {
			const data = JSON.parse(jsonString)
			
			// 支持多种格式
			let bricksData: BrickItem[] = []
			
			if (Array.isArray(data)) {
				// 直接是积木数组
				bricksData = data
			} else if (data.bricks && Array.isArray(data.bricks)) {
				// 包含bricks字段的对象
				bricksData = data.bricks
			} else if (data.layers && Array.isArray(data.layers)) {
				// 积木展示器的多层格式
				bricksData = []
				data.layers.forEach((layer: any, layerIndex: number) => {
					if (layer.bricks && Array.isArray(layer.bricks)) {
						layer.bricks.forEach((brick: any) => {
							// 转换积木展示器格式到编辑器格式
							const editorBrick: BrickItem = {
								id: generateId(),
								position: [brick.x || brick.position?.[0] || 0, layerIndex, brick.z || brick.position?.[2] || 0],
								rotation: brick.rotation || 0,
								size: brick.size || [1, 1],
								color: brick.color || '#ff0000',
							}
							bricksData.push(editorBrick)
						})
					}
				})
			}
			
			if (bricksData.length > 0) {
				importBricks(bricksData)
				return true
			}
			
			return false
		} catch (error) {
			console.error('导入JSON失败:', error)
			return false
		}
	}
	
	// 生成唯一ID
	function generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2)
	}
	
	// 检查位置是否被占用（考虑积木尺寸）
	function isPositionOccupied(position: [number, number, number], brickSize: [number, number] = [1, 1]): boolean {
		const currentBrick = { position, size: brickSize }
		return bricks.value.some(brick => {
			// 使用边界框检查重叠
			const box1 = getBrickBoundingBox(currentBrick.position, currentBrick.size)
			const box2 = getBrickBoundingBox(brick.position, brick.size)
			
			return !(
				box1.max[0] <= box2.min[0] ||
				box1.min[0] >= box2.max[0] ||
				box1.max[1] <= box2.min[1] ||
				box1.min[1] >= box2.max[1] ||
				box1.max[2] <= box2.min[2] ||
				box1.min[2] >= box2.max[2]
			)
		})
	}
	
	// 获取积木边界框
	function getBrickBoundingBox(position: [number, number, number], size: [number, number]) {
		const [x, y, z] = position
		const [width, length] = size
		
		// 从中心点计算边界（积木几何体以中心为原点）
		const halfWidth = width / 2
		const halfLength = length / 2
		
		return {
			min: [x - halfWidth, y, z - halfLength],
			max: [x + halfWidth, y + 1, z + halfLength],
		}
	}
	
	// 获取指定位置的积木（考虑积木尺寸）
	function getBrickAtPosition(position: [number, number, number]): BrickItem | null {
		return bricks.value.find(brick => {
			const box = getBrickBoundingBox(brick.position, brick.size)
			return (
				position[0] >= box.min[0] && position[0] <= box.max[0] &&
				position[1] >= box.min[1] && position[1] <= box.max[1] &&
				position[2] >= box.min[2] && position[2] <= box.max[2]
			)
		}) || null
	}
	
	// 检查积木是否有支撑（地面检测）
	function hasSupport(position: [number, number, number], brickSize: [number, number] = [1, 1]): boolean {
		const [x, y, z] = position
		const [width, length] = brickSize
		
		// 如果积木在地面（y=0），则有支撑
		if (y === 0) {
			return true
		}
		
		// 检查积木下方是否有其他积木支撑
		const supportY = y - 1 // 支撑积木应该在下方一层
		
		// 计算积木底部覆盖的网格范围
		const halfWidth = width / 2
		const halfLength = length / 2
		
		// 积木底部的边界
		const minX = x - halfWidth
		const maxX = x + halfWidth
		const minZ = z - halfLength
		const maxZ = z + halfLength
		
		// 调试信息
		if (import.meta.env.DEV) {
			console.log('支撑检测调试信息:')
			console.log('积木位置:', position)
			console.log('积木尺寸:', brickSize)
			console.log('支撑层Y:', supportY)
			console.log('底部范围:', { minX, maxX, minZ, maxZ })
		}
		
		// 对于大尺寸积木，我们需要检查底部覆盖的所有网格点
		// 生成需要检查的网格点
		const gridPoints: [number, number][] = []
		
		// 计算需要检查的网格点范围
		const startX = Math.floor(minX)
		const endX = Math.ceil(maxX - 0.001) // 避免浮点数精度问题
		const startZ = Math.floor(minZ)
		const endZ = Math.ceil(maxZ - 0.001)
		
		// 调试信息
		if (import.meta.env.DEV) {
			console.log('检查网格范围:', { startX, endX, startZ, endZ })
		}
		
		// 生成需要检查的网格点
		for (let gridX = startX; gridX <= endX; gridX++) {
			for (let gridZ = startZ; gridZ <= endZ; gridZ++) {
				// 检查这个网格点是否在积木底部范围内
				if (gridX >= minX && gridX < maxX && gridZ >= minZ && gridZ < maxZ) {
					gridPoints.push([gridX, gridZ])
				}
			}
		}
		
		// 调试信息
		if (import.meta.env.DEV) {
			console.log('需要检查的网格点:', gridPoints)
		}
		
		// 检查每个网格点是否有支撑
		for (const [checkX, checkZ] of gridPoints) {
			// 检查这个网格点是否有积木支撑
			const hasSupportAtPoint = bricks.value.some(brick => {
				const box = getBrickBoundingBox(brick.position, brick.size)
				const isSupported = (
					brick.position[1] === supportY && // 在支撑层
					checkX >= box.min[0] && checkX < box.max[0] &&
					checkZ >= box.min[2] && checkZ < box.max[2]
				)
				
				// 调试信息
				if (import.meta.env.DEV && isSupported) {
					console.log(`网格点[${checkX}, ${checkZ}]有支撑，来自积木:`, brick)
				}
				
				return isSupported
			})
			
			if (!hasSupportAtPoint) {
				// 调试信息
				if (import.meta.env.DEV) {
					console.log(`网格点[${checkX}, ${checkZ}]没有支撑`)
				}
				return false // 如果任何一个点没有支撑，整个积木就没有支撑
			}
		}
		
		// 调试信息
		if (import.meta.env.DEV) {
			console.log('所有网格点都有支撑')
		}
		
		return true // 所有点都有支撑
	}
	
	// 检查位置是否有效（不重叠且有支撑）
	function isPositionValid(position: [number, number, number], brickSize: [number, number] = [1, 1]): boolean {
		// 检查是否被占用
		if (isPositionOccupied(position, brickSize)) {
			return false
		}
		
		// 检查是否有支撑
		if (!hasSupport(position, brickSize)) {
			return false
		}
		
		return true
	}
	
	// 初始化历史记录
	saveHistory()
	
	return {
		// 状态
		bricks,
		selectedBrickId,
		selectedBrickIds,
		toolMode,
		selectionMode,
		currentColor,
		currentSize,
		availableSizes,
		gridSize,
		
		// 计算属性
		selectedBrick,
		brickCount,
		canUndo,
		canRedo,
		
		// 方法
		addBrick,
		deleteBrick,
		moveBrick,
		rotateBrick,
		changeBrickColor,
		selectBrick,
		selectAll,
		deselectAll,
		setToolMode,
		setSelectionMode,
		setCurrentColor,
		setCurrentSize,
		clearAllBricks,
		undo,
		redo,
		exportBricks,
		exportToJSON,
		importBricks,
		importFromJSON,
		isPositionOccupied,
		getBrickAtPosition,
		getBrickBoundingBox,
		hasSupport,
		isPositionValid,
	}
}) 