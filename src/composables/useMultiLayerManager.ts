import { ref, computed } from 'vue'

export interface LayerData {
	index: number
	bricks: any[]
	visible: boolean
	loading: boolean
	loaded: boolean
}

export interface RenderStats {
	totalBricks: number
	visibleBricks: number
	renderedLayers: number
	instancedMeshCount: number
	brickTypeCacheSize: number
	memoryUsage?: {
		used: number
		total: number
	}
}

export function useMultiLayerManager(maxLayers: number) {
	// 层数据管理
	const layersData = ref<LayerData[]>(
		Array.from({ length: maxLayers }, (_, index) => ({
			index,
			bricks: [],
			visible: false,
			loading: false,
			loaded: false,
		}))
	)

	// 当前层
	const currentLayer = ref(0)

	// 渲染统计
	const renderStats = ref<RenderStats>({
		totalBricks: 0,
		visibleBricks: 0,
		renderedLayers: 0,
		instancedMeshCount: 0,
		brickTypeCacheSize: 0,
	})

	// 计算可见层
	const visibleLayers = computed(() => {
		return layersData.value.map(layer => layer.visible)
	})

	// 计算加载状态
	const loadingStates = computed(() => {
		return layersData.value.map(layer => layer.loading)
	})

	// 更新层可见性
	function updateLayerVisibility(newVisibleLayers: boolean[]) {
		let totalVisibleBricks = 0
		let renderedLayersCount = 0

		layersData.value.forEach((layer, index) => {
			layer.visible = newVisibleLayers[index]
			if (layer.visible) {
				renderedLayersCount++
				if (layer.loaded) {
					totalVisibleBricks += layer.bricks.length
				}
			}
		})

		// 更新统计
		updateRenderStats(totalVisibleBricks, renderedLayersCount)
	}

	// 设置层数据
	function setLayerData(index: number, bricks: any[]) {
		if (index >= 0 && index < maxLayers) {
			layersData.value[index] = {
				...layersData.value[index],
				bricks,
				loaded: true,
				loading: false,
			}
			updateRenderStats()
		}
	}

	// 设置层加载状态
	function setLayerLoading(index: number, loading: boolean) {
		if (index >= 0 && index < maxLayers) {
			layersData.value[index].loading = loading
		}
	}

	// 切换层可见性
	function toggleLayer(index: number) {
		if (index >= 0 && index < maxLayers) {
			layersData.value[index].visible = !layersData.value[index].visible
			updateRenderStats()
		}
	}

	// 全选/取消全选
	function selectAll() {
		layersData.value.forEach(layer => {
			layer.visible = true
		})
		updateRenderStats()
	}

	function deselectAll() {
		layersData.value.forEach(layer => {
			layer.visible = false
		})
		updateRenderStats()
	}

	// 层导航
	function prevLayer() {
		if (currentLayer.value > 0) {
			currentLayer.value--
			// 同步可见层，前N层为true
			layersData.value.forEach((layer, index) => {
				layer.visible = index <= currentLayer.value
			})
			updateRenderStats()
		}
	}

	function nextLayer() {
		if (currentLayer.value < maxLayers - 1) {
			currentLayer.value++
			// 同步可见层，前N层为true
			layersData.value.forEach((layer, index) => {
				layer.visible = index <= currentLayer.value
			})
			updateRenderStats()
		}
	}

	// 批量设置渲染层数
	function setRenderLayers(count: number) {
		const newVisibleLayers = new Array(maxLayers).fill(false)
		for (let i = 0; i < count && i < maxLayers; i++) {
			newVisibleLayers[i] = true
		}
		updateLayerVisibility(newVisibleLayers)
	}

	// 更新渲染统计
	function updateRenderStats(visibleBricks?: number, renderedLayers?: number) {
		const totalBricks = layersData.value.reduce((sum, layer) => sum + layer.bricks.length, 0)
		const actualVisibleBricks = visibleBricks ?? layersData.value.reduce((sum, layer) => 
			layer.visible ? sum + layer.bricks.length : sum, 0
		)
		const actualRenderedLayers = renderedLayers ?? layersData.value.filter(layer => layer.visible).length

		renderStats.value = {
			...renderStats.value,
			totalBricks,
			visibleBricks: actualVisibleBricks,
			renderedLayers: actualRenderedLayers,
		}
	}

	// 获取需要加载的层
	function getLayersToLoad(): number[] {
		return layersData.value
			.filter(layer => layer.visible && !layer.loaded && !layer.loading)
			.map(layer => layer.index)
	}

	// 预加载相邻层
	function preloadAdjacentLayers(centerIndex: number, range: number = 2) {
		const startIndex = Math.max(0, centerIndex - range)
		const endIndex = Math.min(maxLayers - 1, centerIndex + range)
		
		return layersData.value
			.slice(startIndex, endIndex + 1)
			.filter(layer => !layer.loaded && !layer.loading)
			.map(layer => layer.index)
	}

	// 清理未使用的层数据
	function cleanupUnusedLayers() {
		layersData.value.forEach(layer => {
			if (!layer.visible && layer.loaded) {
				layer.bricks = []
				layer.loaded = false
			}
		})
		updateRenderStats()
	}

	// 获取性能信息
	function getPerformanceInfo(instancedMeshCount: number, brickTypeCacheSize: number) {
		return {
			...renderStats.value,
			instancedMeshCount,
			brickTypeCacheSize,
			memoryUsage: (performance as any).memory ? {
				used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
				total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
			} : null,
		}
	}

	return {
		// 状态
		layersData,
		currentLayer,
		visibleLayers,
		loadingStates,
		renderStats,

		// 方法
		updateLayerVisibility,
		setLayerData,
		setLayerLoading,
		toggleLayer,
		selectAll,
		deselectAll,
		prevLayer,
		nextLayer,
		setRenderLayers,
		getLayersToLoad,
		preloadAdjacentLayers,
		cleanupUnusedLayers,
		getPerformanceInfo,
	}
} 