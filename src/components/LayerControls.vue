<template>
	<div
		class="layer-controls rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur-sm"
	>
		<div class="flex flex-col gap-4">
			<!-- 性能统计显示 -->
			<div v-if="renderStats" class="border-t pt-4">
				<h3 class="mb-3 text-lg text-gray-700 font-semibold">渲染统计</h3>
				<div class="grid grid-cols-2 gap-2 text-sm">
					<div class="text-gray-600">
						总积木数: <span class="font-semibold text-blue-600">{{ renderStats.totalBricks }}</span>
					</div>
					<div class="text-gray-600">
						可见积木: <span class="font-semibold text-green-600">{{ renderStats.visibleBricks }}</span>
					</div>
					<div class="text-gray-600">
						渲染层数: <span class="font-semibold text-purple-600">{{ renderStats.renderedLayers }}</span>
					</div>
					<div class="text-gray-600">
						实例网格: <span class="font-semibold text-orange-600">{{ renderStats.instancedMeshCount || 0 }}</span>
					</div>
				</div>
			</div>

			<!-- 滑动条控制 -->
			<div class="border-t pt-4">
				<h3 class="mb-3 text-lg text-gray-700 font-semibold">层数控制</h3>
				<div class="flex items-center gap-3">
					<button
						:disabled="renderLayers <= 1 || props.isLayerLoading"
						class="rounded bg-orange-500 px-3 py-1 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 hover:bg-orange-600"
						@click="decreaseRenderLayers"
					>
						-
					</button>

					<div class="flex-1">
						<input
							type="range"
							:min="1"
							:max="maxLayers"
							:value="renderLayers"
							:disabled="props.isLayerLoading"
							:class="[
								'slider h-2 w-full appearance-none rounded-lg',
								props.isLayerLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-200 cursor-pointer'
							]"
							@input="updateRenderLayers"
						/>
						<div class="mt-1 text-center text-sm text-gray-600">
							渲染{{ renderLayers }} 层
							<span v-if="isRenderDebouncing" class="text-orange-500 ml-2">
								(防抖中...)
							</span>
							<span v-if="props.isLayerLoading" class="text-red-500 ml-2">
								(加载中，请稍候...)
							</span>
						</div>
					</div>

					<button
						:disabled="renderLayers >= maxLayers || props.isLayerLoading"
						class="rounded bg-orange-500 px-3 py-1 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 hover:bg-orange-600"
						@click="increaseRenderLayers"
					>
						+
					</button>
				</div>
			</div>
			<!-- 视角控制 -->
			<div class="border-t pt-4">
				<h3 class="mb-3 text-lg text-gray-700 font-semibold">视角控制</h3>
				<div class="flex gap-2">
					<button
						class="rounded bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600"
						@click="$emit('reset-view')"
					>
						重置视角
					</button>
					<button
						class="rounded bg-purple-500 px-3 py-2 text-sm text-white transition-colors hover:bg-purple-600"
						@click="$emit('fit-view')"
					>
						适应视角
					</button>
				</div>
			</div>

			<!-- 层选择复选框 -->
			<div class="border-t pt-4">
				<h3 class="mb-3 text-lg text-gray-700 font-semibold">层选择</h3>
				
				<!-- 全局加载状态提示 -->
				<div v-if="props.isLayerLoading" class="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
					<div class="flex items-center">
						<div class="mr-2 h-4 w-4 animate-spin border-2 border-yellow-600 border-t-transparent rounded-full"></div>
						正在加载层数据，请稍候...
					</div>
				</div>
				
				<div class="grid grid-cols-2 max-h-40 gap-2 overflow-y-auto">
					<label
						v-for="index in maxLayers"
						:key="index - 1"
						:class="[
							'flex cursor-pointer items-center rounded p-2 space-x-2 hover:bg-gray-100',
							layerLoadingStates && layerLoadingStates[index - 1] ? 'bg-yellow-50' : '',
							props.isLayerLoading ? 'opacity-50 cursor-not-allowed' : ''
						]"
					>
						<input
							type="checkbox"
							:checked="visibleLayers[index - 1]"
							:disabled="(layerLoadingStates && layerLoadingStates[index - 1]) || props.isLayerLoading"
							class="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
							@change="$emit('toggle-layer', index - 1)"
						/>
						<span class="text-sm text-gray-700">
							第{{ index }} 层
							<span v-if="layerLoadingStates && layerLoadingStates[index - 1]" class="text-yellow-600">
								(加载中...)
							</span>
						</span>
					</label>
				</div>
			</div>

			<!-- 全选/取消全选 -->
			<div class="flex gap-2">
				<button
					:disabled="props.isLayerLoading"
					class="rounded bg-green-500 px-3 py-1 text-sm text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
					@click="$emit('select-all')"
				>
					全选
				</button>
				<button
					:disabled="props.isLayerLoading"
					class="rounded bg-red-500 px-3 py-1 text-sm text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
					@click="$emit('deselect-all')"
				>
					取消全选
				</button>
			</div>

			<!-- 加载状态 -->
			<div v-if="isLoading" class="text-center text-blue-600">
				<div
					class="mr-2 inline-block h-4 w-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full"
				></div>
				加载中...
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDebouncedValue } from '@/composables/useDebounce'

interface Props {
	currentLayer: number
	maxLayers: number
	visibleLayers: boolean[]
	isLoading?: boolean
	renderStats?: {
		totalBricks: number
		visibleBricks: number
		renderedLayers: number
		instancedMeshCount?: number
	}
	layerLoadingStates?: boolean[]
	isLayerLoading?: boolean
}

const props = defineProps<Props>()

// 使用防抖值来管理渲染层数
const { 
	value: renderLayers, 
	debouncedValue: debouncedRenderLayers,
	setValue: setRenderLayers,
	setValueImmediate: setRenderLayersImmediate,
	isDebouncing: isRenderDebouncing
} = useDebouncedValue(4, 200) // 200ms防抖延迟

// 更新渲染层数（带防抖）
function updateRenderLayers(event: Event) {
	// 如果正在加载层数据，阻止操作
	if (props.isLayerLoading) {
		console.log('层数据正在加载中，阻止滑动操作')
		return
	}
	
	const target = event.target as HTMLInputElement
	const newValue = parseInt(target.value)
	setRenderLayers(newValue)
}

// 增加渲染层数（立即执行，不防抖）
function increaseRenderLayers() {
	if (renderLayers.value < props.maxLayers) {
		const newValue = renderLayers.value + 1
		setRenderLayersImmediate(newValue)
		updateVisibleLayers(newValue)
	}
}

// 减少渲染层数（立即执行，不防抖）
function decreaseRenderLayers() {
	if (renderLayers.value > 1) {
		const newValue = renderLayers.value - 1
		setRenderLayersImmediate(newValue)
		updateVisibleLayers(newValue)
	}
}

// 更新可见层
function updateVisibleLayers(layerCount?: number) {
	const count = layerCount ?? debouncedRenderLayers.value
	const newVisibleLayers = new Array(props.maxLayers).fill(false)
	for (let i = 0; i < count; i++) {
		newVisibleLayers[i] = true
	}
	emit('update-render-layers', newVisibleLayers)
}

// 监听防抖后的渲染层数变化
watch(debouncedRenderLayers, (newValue) => {
	console.log(`防抖后更新渲染层数: ${newValue}`)
	updateVisibleLayers(newValue)
})

// 监听当前层变化，自动调整渲染层数
watch(
	() => props.currentLayer,
	(newLayer) => {
		if (newLayer >= renderLayers.value) {
			const newValue = newLayer + 1
			setRenderLayersImmediate(newValue)
			updateVisibleLayers(newValue)
		}
	},
)

const emit = defineEmits<{
	'prev-layer': []
	'next-layer': []
	'toggle-layer': [index: number]
	'select-all': []
	'deselect-all': []
	'reset-view': []
	'fit-view': []
	'update-render-layers': [layers: boolean[]]
}>()
</script>

<style scoped>
.layer-controls {
	position: absolute;
	top: 20px;
	left: 20px;
	z-index: 1000;
	min-width: 280px;
}

/* 滑动条样式 */
.slider::-webkit-slider-thumb {
	appearance: none;
	height: 20px;
	width: 20px;
	border-radius: 50%;
	background: #3b82f6;
	cursor: pointer;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
	height: 20px;
	width: 20px;
	border-radius: 50%;
	background: #3b82f6;
	cursor: pointer;
	border: none;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-webkit-slider-track {
	background: #e5e7eb;
	border-radius: 10px;
	height: 8px;
}

.slider::-moz-range-track {
	background: #e5e7eb;
	border-radius: 10px;
	height: 8px;
	border: none;
}
</style>
