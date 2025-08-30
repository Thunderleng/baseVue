<template>
	<div class="debounce-test p-8">
		<h1 class="text-2xl font-bold mb-6">防抖功能测试</h1>
		
		<div class="max-w-md space-y-6">
			<!-- 滑动条测试 -->
			<div class="bg-white p-4 rounded-lg shadow">
				<h2 class="text-lg font-semibold mb-3">滑动条防抖测试</h2>
				<div class="space-y-2">
					<input
						type="range"
						:min="1"
						:max="20"
						:value="sliderValue"
						class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
						@input="updateSlider"
					/>
					<div class="text-sm text-gray-600">
						当前值: {{ sliderValue }}
						<span v-if="isDebouncing" class="text-orange-500 ml-2">(防抖中...)</span>
					</div>
					<div class="text-sm text-gray-600">
						防抖后值: {{ debouncedValue }}
					</div>
				</div>
			</div>

			<!-- 按钮测试 -->
			<div class="bg-white p-4 rounded-lg shadow">
				<h2 class="text-lg font-semibold mb-3">按钮防抖测试</h2>
				<div class="space-y-2">
					<button
						@click="debouncedClick"
						class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						防抖点击 (0.2s)
					</button>
					<div class="text-sm text-gray-600">
						点击次数: {{ clickCount }}
					</div>
					<div class="text-sm text-gray-600">
						防抖状态: {{ isClickDebouncing ? '防抖中' : '就绪' }}
					</div>
				</div>
			</div>

			<!-- 输入框测试 -->
			<div class="bg-white p-4 rounded-lg shadow">
				<h2 class="text-lg font-semibold mb-3">输入框防抖测试</h2>
				<div class="space-y-2">
					<input
						type="text"
						v-model="inputValue"
						placeholder="输入内容..."
						class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
						@input="updateInput"
					/>
					<div class="text-sm text-gray-600">
						输入内容: {{ inputValue }}
					</div>
					<div class="text-sm text-gray-600">
						防抖后内容: {{ debouncedInputValue }}
					</div>
					<div class="text-sm text-gray-600">
						防抖状态: {{ isInputDebouncing ? '防抖中' : '就绪' }}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDebouncedValue, useDebounce } from '@/composables/useDebounce'

// 滑动条防抖测试
const { 
	value: sliderValue, 
	debouncedValue, 
	setValue: setSliderValue,
	isDebouncing 
} = useDebouncedValue(1, 200)

function updateSlider(event: Event) {
	const target = event.target as HTMLInputElement
	setSliderValue(parseInt(target.value))
}

// 按钮防抖测试
const clickCount = ref(0)
const { debouncedFn: debouncedClick, isDebouncing: isClickDebouncing } = useDebounce(() => {
	clickCount.value++
	console.log('防抖点击执行:', clickCount.value)
}, 200)

// 输入框防抖测试
const { 
	value: inputValue, 
	debouncedValue: debouncedInputValue,
	setValue: setInputValue,
	isDebouncing: isInputDebouncing 
} = useDebouncedValue('', 200)

function updateInput() {
	setInputValue(inputValue.value)
}
</script>

<style scoped>
.debounce-test {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	min-height: 100vh;
}

/* 滑动条样式 */
input[type="range"]::-webkit-slider-thumb {
	appearance: none;
	height: 20px;
	width: 20px;
	border-radius: 50%;
	background: #3b82f6;
	cursor: pointer;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input[type="range"]::-moz-range-thumb {
	height: 20px;
	width: 20px;
	border-radius: 50%;
	background: #3b82f6;
	cursor: pointer;
	border: none;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style> 