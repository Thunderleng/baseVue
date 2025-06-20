<template>
	<div class="loading-demo p-8">
		<h1 class="text-2xl font-bold mb-6">加载状态控制演示</h1>
		
		<div class="max-w-2xl space-y-6">
			<!-- 模拟层控制面板 -->
			<div class="bg-white p-6 rounded-lg shadow">
				<h2 class="text-lg font-semibold mb-4">模拟层控制面板</h2>
				
				<!-- 加载状态显示 -->
				<div v-if="isLoading" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
					<div class="flex items-center">
						<div class="mr-2 h-4 w-4 animate-spin border-2 border-yellow-600 border-t-transparent rounded-full"></div>
						正在加载层数据，请稍候... ({{ loadingProgress }}%)
					</div>
				</div>
				
				<!-- 滑动条控制 -->
				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700 mb-2">渲染层数</label>
					<div class="flex items-center gap-3">
						<button
							:disabled="renderLayers <= 1 || isLoading"
							class="rounded bg-orange-500 px-3 py-1 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 hover:bg-orange-600"
							@click="decreaseLayers"
						>
							-
						</button>

						<div class="flex-1">
							<input
								type="range"
								:min="1"
								:max="10"
								:value="renderLayers"
								:disabled="isLoading"
								:class="[
									'slider h-2 w-full appearance-none rounded-lg',
									isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-200 cursor-pointer'
								]"
								@input="updateLayers"
							/>
							<div class="mt-1 text-center text-sm text-gray-600">
								渲染{{ renderLayers }} 层
								<span v-if="isLoading" class="text-red-500 ml-2">
									(加载中，请稍候...)
								</span>
							</div>
						</div>

						<button
							:disabled="renderLayers >= 10 || isLoading"
							class="rounded bg-orange-500 px-3 py-1 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 hover:bg-orange-600"
							@click="increaseLayers"
						>
							+
						</button>
					</div>
				</div>
				
				<!-- 层选择 -->
				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700 mb-2">层选择</label>
					<div class="grid grid-cols-5 gap-2">
						<label
							v-for="index in 10"
							:key="index - 1"
							:class="[
								'flex cursor-pointer items-center rounded p-2 space-x-2 hover:bg-gray-100',
								isLoading ? 'opacity-50 cursor-not-allowed' : ''
							]"
						>
							<input
								type="checkbox"
								:checked="selectedLayers[index - 1]"
								:disabled="isLoading"
								class="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50"
								@change="toggleLayer(index - 1)"
							/>
							<span class="text-sm text-gray-700">第{{ index }}层</span>
						</label>
					</div>
				</div>
				
				<!-- 操作按钮 -->
				<div class="flex gap-2">
					<button
						:disabled="isLoading"
						class="rounded bg-green-500 px-4 py-2 text-sm text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
						@click="selectAll"
					>
						全选
					</button>
					<button
						:disabled="isLoading"
						class="rounded bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
						@click="deselectAll"
					>
						取消全选
					</button>
					<button
						:disabled="isLoading"
						class="rounded bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
						@click="simulateLoading"
					>
						模拟加载 (3秒)
					</button>
				</div>
			</div>
			
			<!-- 状态信息 -->
			<div class="bg-white p-6 rounded-lg shadow">
				<h2 class="text-lg font-semibold mb-4">状态信息</h2>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-600">加载状态:</span>
						<span :class="isLoading ? 'text-red-500' : 'text-green-500'">
							{{ isLoading ? '加载中' : '就绪' }}
						</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">渲染层数:</span>
						<span class="text-blue-600">{{ renderLayers }}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">选中层数:</span>
						<span class="text-purple-600">{{ selectedLayers.filter(v => v).length }}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">加载进度:</span>
						<span class="text-orange-600">{{ loadingProgress }}%</span>
					</div>
				</div>
			</div>
			
			<!-- 说明 -->
			<div class="bg-blue-50 p-4 rounded-lg">
				<h3 class="font-semibold text-blue-800 mb-2">功能说明</h3>
				<ul class="text-sm text-blue-700 space-y-1">
					<li>• 在加载期间，所有交互控件都会被禁用</li>
					<li>• 滑动条、按钮、复选框都会显示禁用状态</li>
					<li>• 加载进度会实时更新</li>
					<li>• 加载完成后，所有控件恢复正常状态</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 状态管理
const renderLayers = ref(4)
const selectedLayers = ref(new Array(10).fill(false))
const isLoading = ref(false)
const loadingProgress = ref(0)

// 初始化选中前4层
selectedLayers.value.fill(true, 0, 4)

// 更新渲染层数
function updateLayers(event: Event) {
	if (isLoading.value) {
		console.log('正在加载中，阻止滑动操作')
		return
	}
	
	const target = event.target as HTMLInputElement
	renderLayers.value = parseInt(target.value)
	
	// 同步选中状态
	selectedLayers.value.fill(false)
	selectedLayers.value.fill(true, 0, renderLayers.value)
}

// 增加层数
function increaseLayers() {
	if (renderLayers.value < 10 && !isLoading.value) {
		renderLayers.value++
		selectedLayers.value[renderLayers.value - 1] = true
	}
}

// 减少层数
function decreaseLayers() {
	if (renderLayers.value > 1 && !isLoading.value) {
		selectedLayers.value[renderLayers.value - 1] = false
		renderLayers.value--
	}
}

// 切换层选择
function toggleLayer(index: number) {
	if (!isLoading.value) {
		selectedLayers.value[index] = !selectedLayers.value[index]
	}
}

// 全选
function selectAll() {
	if (!isLoading.value) {
		selectedLayers.value.fill(true)
		renderLayers.value = 10
	}
}

// 取消全选
function deselectAll() {
	if (!isLoading.value) {
		selectedLayers.value.fill(false)
		renderLayers.value = 0
	}
}

// 模拟加载过程
function simulateLoading() {
	if (isLoading.value) return
	
	isLoading.value = true
	loadingProgress.value = 0
	
	const interval = setInterval(() => {
		loadingProgress.value += 10
		if (loadingProgress.value >= 100) {
			clearInterval(interval)
			isLoading.value = false
			loadingProgress.value = 0
			console.log('加载完成')
		}
	}, 300) // 3秒完成
}
</script>

<style scoped>
.loading-demo {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	min-height: 100vh;
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

.slider:disabled::-webkit-slider-thumb {
	background: #9ca3af;
	cursor: not-allowed;
}

.slider:disabled::-moz-range-thumb {
	background: #9ca3af;
	cursor: not-allowed;
}
</style> 