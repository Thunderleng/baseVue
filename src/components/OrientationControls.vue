<template>
	<div class="orientation-controls rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur-sm">
		<div class="flex flex-col gap-4">
			<!-- 朝向控制 -->
			<div class="border-b pb-4">
				<h3 class="mb-3 text-lg text-gray-700 font-semibold">积木朝向</h3>
				<div class="grid grid-cols-2 gap-2">
					<button
						v-for="orientation in orientations"
						:key="orientation.value"
						:class="[
							'rounded px-3 py-2 text-sm transition-colors',
							currentOrientation === orientation.value
								? 'bg-blue-500 text-white'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						]"
						@click="$emit('set-orientation', orientation.value)"
					>
						{{ orientation.label }}
					</button>
				</div>
			</div>

			<!-- 旋转控制 -->
			<div class="border-b pb-4">
				<h3 class="mb-3 text-lg text-gray-700 font-semibold">旋转控制</h3>
				
				<!-- X轴旋转 -->
				<div class="mb-3">
					<label class="block text-sm text-gray-600 mb-2">X轴旋转: {{ rotationX }}°</label>
					<div class="flex items-center gap-2">
						<button
							class="rounded bg-orange-500 px-2 py-1 text-xs text-white hover:bg-orange-600"
							@click="adjustRotation('x', -15)"
						>
							-15°
						</button>
						<input
							type="range"
							:min="-180"
							:max="180"
							:value="rotationX"
							class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
							@input="updateRotation('x', $event)"
						/>
						<button
							class="rounded bg-orange-500 px-2 py-1 text-xs text-white hover:bg-orange-600"
							@click="adjustRotation('x', 15)"
						>
							+15°
						</button>
					</div>
				</div>

				<!-- Y轴旋转 -->
				<div class="mb-3">
					<label class="block text-sm text-gray-600 mb-2">Y轴旋转: {{ rotationY }}°</label>
					<div class="flex items-center gap-2">
						<button
							class="rounded bg-orange-500 px-2 py-1 text-xs text-white hover:bg-orange-600"
							@click="adjustRotation('y', -15)"
						>
							-15°
						</button>
						<input
							type="range"
							:min="-180"
							:max="180"
							:value="rotationY"
							class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
							@input="updateRotation('y', $event)"
						/>
						<button
							class="rounded bg-orange-500 px-2 py-1 text-xs text-white hover:bg-orange-600"
							@click="adjustRotation('y', 15)"
						>
							+15°
						</button>
					</div>
				</div>

				<!-- Z轴旋转 -->
				<div class="mb-3">
					<label class="block text-sm text-gray-600 mb-2">Z轴旋转: {{ rotationZ }}°</label>
					<div class="flex items-center gap-2">
						<button
							class="rounded bg-orange-500 px-2 py-1 text-xs text-white hover:bg-orange-600"
							@click="adjustRotation('z', -15)"
						>
							-15°
						</button>
						<input
							type="range"
							:min="-180"
							:max="180"
							:value="rotationZ"
							class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
							@input="updateRotation('z', $event)"
						/>
						<button
							class="rounded bg-orange-500 px-2 py-1 text-xs text-white hover:bg-orange-600"
							@click="adjustRotation('z', 15)"
						>
							+15°
						</button>
					</div>
				</div>
			</div>

			<!-- 快速旋转 -->
			<div class="border-b pb-4">
				<h3 class="mb-3 text-lg text-gray-700 font-semibold">快速旋转</h3>
				<div class="grid grid-cols-2 gap-2">
					<button
						v-for="quickRotation in quickRotations"
						:key="quickRotation.label"
						class="rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"
						@click="applyQuickRotation(quickRotation)"
					>
						{{ quickRotation.label }}
					</button>
				</div>
			</div>

			<!-- 重置按钮 -->
			<div>
				<button
					class="w-full rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
					@click="$emit('reset-orientation')"
				>
					重置朝向和旋转
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BrickOrientation, RotationAxis } from '@/models/Brick'

interface Props {
	currentOrientation: BrickOrientation
	rotationX: number
	rotationY: number
	rotationZ: number
}

const props = defineProps<Props>()

// 朝向选项
const orientations = [
	{ value: BrickOrientation.EAST, label: '东 (90°)' },
	{ value: BrickOrientation.NORTH, label: '北 (0°)' },
	{ value: BrickOrientation.SOUTH, label: '南 (180°)' },
	{ value: BrickOrientation.WEST, label: '西 (270°)' },
]

// 快速旋转选项
const quickRotations = [
	{ label: '水平翻转', axis: 'y', angle: 180 },
	{ label: '垂直翻转', axis: 'x', angle: 180 },
	{ label: '顺时针90°', axis: 'y', angle: 90 },
	{ label: '逆时针90°', axis: 'y', angle: -90 },
]

// 更新旋转角度
function updateRotation(axis: string, event: Event) {
	const target = event.target as HTMLInputElement
	const angle = parseInt(target.value)
	
	switch (axis) {
		case 'x':
			emit('set-rotation', RotationAxis.X, angle)
			break
		case 'y':
			emit('set-rotation', RotationAxis.Y, angle)
			break
		case 'z':
			emit('set-rotation', RotationAxis.Z, angle)
			break
	}
}

// 调整旋转角度
function adjustRotation(axis: string, delta: number) {
	let currentAngle = 0
	
	switch (axis) {
		case 'x':
			currentAngle = props.rotationX
			break
		case 'y':
			currentAngle = props.rotationY
			break
		case 'z':
			currentAngle = props.rotationZ
			break
	}
	
	const newAngle = (currentAngle + delta + 360) % 360 - 180
	
	switch (axis) {
		case 'x':
			emit('set-rotation', RotationAxis.X, newAngle)
			break
		case 'y':
			emit('set-rotation', RotationAxis.Y, newAngle)
			break
		case 'z':
			emit('set-rotation', RotationAxis.Z, newAngle)
			break
	}
}

// 应用快速旋转
function applyQuickRotation(quickRotation: any) {
	switch (quickRotation.axis) {
		case 'x':
			emit('set-rotation', RotationAxis.X, quickRotation.angle)
			break
		case 'y':
			emit('set-rotation', RotationAxis.Y, quickRotation.angle)
			break
		case 'z':
			emit('set-rotation', RotationAxis.Z, quickRotation.angle)
			break
	}
}

const emit = defineEmits<{
	'set-orientation': [orientation: BrickOrientation]
	'set-rotation': [axis: RotationAxis, angle: number]
	'reset-orientation': []
}>()
</script>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
	appearance: none;
	height: 16px;
	width: 16px;
	border-radius: 50%;
	background: #3b82f6;
	cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
	height: 16px;
	width: 16px;
	border-radius: 50%;
	background: #3b82f6;
	cursor: pointer;
	border: none;
}
</style> 