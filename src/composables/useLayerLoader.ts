import { ref } from 'vue'
import axios from 'axios'
import type { BrickData } from '@/models/Brick'

const layerCache = ref<Record<number, BrickData[]>>({})
const loadingStates = ref<Record<number, boolean>>({})

export function useLayerLoader() {
	const isLoading = ref(false)
	const error = ref<string | null>(null)

	async function loadLayer(
		index: number,
		baseUrl: string = 'https://api.example.com/layers',
	): Promise<BrickData[]> {
		// 如果已缓存，直接返回
		if (layerCache.value[index]) {
			return layerCache.value[index]
		}

		// 设置加载状态
		loadingStates.value[index] = true
		isLoading.value = true
		error.value = null

		try {
			const url = `${baseUrl}/layer-${index}.json`
			const { data } = await axios.get<BrickData[]>(url)

			// 缓存数据
			layerCache.value[index] = data

			return data
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : '加载层数据失败'
			error.value = errorMessage
			console.error(`Failed to load layer ${index}:`, err)
			throw err
		} finally {
			loadingStates.value[index] = false
			isLoading.value = false
		}
	}

	function isLayerLoading(index: number): boolean {
		return loadingStates.value[index] || false
	}

	function clearCache(): void {
		layerCache.value = {}
	}

	function clearLayerCache(index: number): void {
		delete layerCache.value[index]
	}

	function getCachedLayer(index: number): BrickData[] | undefined {
		return layerCache.value[index]
	}

	return {
		loadLayer,
		isLayerLoading,
		clearCache,
		clearLayerCache,
		getCachedLayer,
		isLoading,
		error,
	}
}
