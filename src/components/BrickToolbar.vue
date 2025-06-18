<template>
	<div class="brick-toolbar">
		<!-- 工具模式选择 -->
		<div class="tool-section">
			<h3 class="section-title">工具</h3>
			<div class="tool-buttons">
				<button
					v-for="tool in tools"
					:key="tool.mode"
					class="tool-button"
					:class="{ active: currentToolMode === tool.mode }"
					@click="setToolMode(tool.mode)"
					:title="tool.description"
				>
					<span class="tool-icon">{{ tool.icon }}</span>
					<span class="tool-label">{{ tool.label }}</span>
				</button>
			</div>
		</div>

		<!-- 积木尺寸选择 -->
		<div class="tool-section">
			<h3 class="section-title">积木尺寸</h3>
			<div class="size-buttons">
				<button
					v-for="size in brickSizes"
					:key="`${size[0]}x${size[1]}`"
					class="size-button"
					:class="{ active: isCurrentSize(size) }"
					@click="setCurrentSize(size)"
					:title="`${size[0]} x ${size[1]} 积木`"
				>
					{{ size[0] }}×{{ size[1] }}
				</button>
			</div>
		</div>

		<!-- 颜色选择器 -->
		<div class="tool-section">
			<h3 class="section-title">颜色</h3>
			<div class="color-picker">
				<div class="color-buttons">
					<button
						v-for="color in presetColors"
						:key="color"
						class="color-button"
						:class="{ active: currentColor === color }"
						:style="{ backgroundColor: color }"
						@click="setCurrentColor(color)"
						:title="color"
					></button>
				</div>
				<div class="custom-color">
					<input
						type="color"
						:value="currentColor"
						@input="setCurrentColor(($event.target as HTMLInputElement).value)"
						class="color-input"
						title="自定义颜色"
					/>
				</div>
			</div>
		</div>

		<!-- 操作按钮 -->
		<div class="tool-section">
			<h3 class="section-title">操作</h3>
			<div class="action-buttons">
				<button
					class="action-button undo"
					@click="undo"
					:disabled="!canUndo"
					title="撤销 (Ctrl+Z)"
				>
					↶ 撤销
				</button>
				<button
					class="action-button redo"
					@click="redo"
					:disabled="!canRedo"
					title="重做 (Ctrl+Y)"
				>
					↷ 重做
				</button>
				<button
					class="action-button select"
					@click="selectAll"
					title="全选 (Ctrl+A)"
				>
					☑️ 全选
				</button>
				<button
					class="action-button clear"
					@click="clearAll"
					title="清空所有积木"
				>
					��️ 清空
				</button>
			</div>
		</div>

		<!-- 导入导出 -->
		<div class="tool-section">
			<h3 class="section-title">导入导出</h3>
			<div class="import-export-buttons">
				<button
					class="action-button export"
					@click="exportData"
					title="导出积木数据 (支持积木展示器格式)"
				>
					📤 导出JSON
				</button>
				<button
					class="action-button import"
					@click="importData"
					title="导入积木数据 (支持积木展示器格式)"
				>
					📥 导入JSON
				</button>
			</div>
			<div class="format-info">
				<small>支持格式：编辑器JSON、积木展示器JSON</small>
			</div>
		</div>

		<!-- 选择工具 -->
		<div class="tool-section">
			<h3 class="section-title">选择</h3>
			<div class="selection-buttons">
				<button
					class="selection-button"
					:class="{ active: selectionMode === 'single' }"
					@click="setSelectionMode('single')"
					title="单选模式"
				>
					👆 单选
				</button>
				<button
					class="selection-button"
					:class="{ active: selectionMode === 'multiple' }"
					@click="setSelectionMode('multiple')"
					title="多选模式"
				>
					👆👆 多选
				</button>
				<button
					class="selection-button"
					:class="{ active: selectionMode === 'box' }"
					@click="setSelectionMode('box')"
					title="框选模式"
				>
					📦 框选
				</button>
			</div>
		</div>

		<!-- 快捷键提示 -->
		<div class="tool-section">
			<h3 class="section-title">快捷键</h3>
			<div class="shortcuts">
				<div class="shortcut-item">
					<span class="shortcut-key">Ctrl+Z</span>
					<span class="shortcut-desc">撤销</span>
				</div>
				<div class="shortcut-item">
					<span class="shortcut-key">Ctrl+Y</span>
					<span class="shortcut-desc">重做</span>
				</div>
				<div class="shortcut-item">
					<span class="shortcut-key">Ctrl+A</span>
					<span class="shortcut-desc">全选</span>
				</div>
				<div class="shortcut-item">
					<span class="shortcut-key">Delete</span>
					<span class="shortcut-desc">删除选中</span>
				</div>
				<div class="shortcut-item">
					<span class="shortcut-key">R</span>
					<span class="shortcut-desc">旋转选中</span>
				</div>
			</div>
		</div>

		<!-- 统计信息 -->
		<div class="tool-section">
			<h3 class="section-title">统计</h3>
			<div class="stats">
				<div class="stat-item">
					<span class="stat-label">积木数量:</span>
					<span class="stat-value">{{ brickCount }}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">选中:</span>
					<span class="stat-value">{{ selectedBrick ? '是' : '否' }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBrickEditorStore } from '@/stores/brickEditorStore'

const store = useBrickEditorStore()

// 工具定义
const tools: Array<{
	mode: 'add' | 'move' | 'delete' | 'rotate' | 'color'
	icon: string
	label: string
	description: string
}> = [
	{ mode: 'add', icon: '➕', label: '添加', description: '添加积木' },
	{ mode: 'move', icon: '✋', label: '移动', description: '移动积木' },
	{ mode: 'delete', icon: '🗑️', label: '删除', description: '删除积木' },
	{ mode: 'rotate', icon: '🔄', label: '旋转', description: '旋转积木' },
	{ mode: 'color', icon: '🎨', label: '颜色', description: '改变颜色' },
]

// 积木尺寸选项
const brickSizes: [number, number][] = [
	[1, 1],
	[1, 2],
	[1, 3],
	[1, 4],
	[2, 2],
	[2, 3],
	[2, 4],
	[3, 3],
	[3, 4],
	[4, 4],
]

// 预设颜色
const presetColors = [
	'#ff6b6b', // 红色
	'#4ecdc4', // 青色
	'#45b7d1', // 蓝色
	'#96ceb4', // 绿色
	'#feca57', // 黄色
	'#ff9ff3', // 粉色
	'#54a0ff', // 天蓝
	'#5f27cd', // 紫色
	'#00d2d3', // 青绿
	'#ff9f43', // 橙色
	'#10ac84', // 深绿
	'#ee5253', // 深红
]

// 计算属性
const currentToolMode = computed(() => store.toolMode)
const currentColor = computed(() => store.currentColor)
const currentSize = computed(() => store.currentSize)
const brickCount = computed(() => store.brickCount)
const selectedBrick = computed(() => store.selectedBrick)
const selectionMode = computed(() => store.selectionMode)
const canUndo = computed(() => store.canUndo)
const canRedo = computed(() => store.canRedo)

// 方法
function setToolMode(mode: 'add' | 'move' | 'delete' | 'rotate' | 'color') {
	store.setToolMode(mode)
}

function setCurrentColor(color: string) {
	store.setCurrentColor(color)
}

function setCurrentSize(size: [number, number]) {
	store.setCurrentSize(size)
}

function isCurrentSize(size: [number, number]): boolean {
	return currentSize.value[0] === size[0] && currentSize.value[1] === size[1]
}

function clearAll() {
	if (confirm('确定要清空所有积木吗？')) {
		store.clearAllBricks()
	}
}

function exportData() {
	const jsonData = store.exportToJSON()
	const blob = new Blob([jsonData], { type: 'application/json' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = `bricks-editor-${new Date().toISOString().slice(0, 10)}.json`
	a.click()
	URL.revokeObjectURL(url)
}

function importData() {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = '.json'
	input.onchange = (event) => {
		const file = (event.target as HTMLInputElement).files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = (e) => {
				try {
					const jsonString = e.target?.result as string
					const success = store.importFromJSON(jsonString)
					if (success) {
						alert('导入成功！')
					} else {
						alert('导入失败：不支持的文件格式')
					}
				} catch (error) {
					alert('导入失败：文件格式错误')
				}
			}
			reader.readAsText(file)
		}
	}
	input.click()
}

function setSelectionMode(mode: 'single' | 'multiple' | 'box') {
	store.setSelectionMode(mode)
}

function undo() {
	store.undo()
}

function redo() {
	store.redo()
}

function selectAll() {
	store.selectAll()
}
</script>

<style scoped>
.brick-toolbar {
	width: 280px;
	background: white;
	border-right: 1px solid #e5e7eb;
	padding: 1rem;
	overflow-y: auto;
	height: 100vh;
}

.tool-section {
	margin-bottom: 1.5rem;
}

.section-title {
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.5rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.tool-buttons {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 0.5rem;
}

.tool-button {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0.75rem 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	background: white;
	cursor: pointer;
	transition: all 0.2s;
}

.tool-button:hover {
	background: #f9fafb;
	border-color: #9ca3af;
}

.tool-button.active {
	background: #3b82f6;
	border-color: #3b82f6;
	color: white;
}

.tool-icon {
	font-size: 1.25rem;
	margin-bottom: 0.25rem;
}

.tool-label {
	font-size: 0.75rem;
	font-weight: 500;
}

.size-buttons {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 0.5rem;
}

.size-button {
	padding: 0.5rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	background: white;
	cursor: pointer;
	font-size: 0.875rem;
	font-weight: 500;
	transition: all 0.2s;
}

.size-button:hover {
	background: #f9fafb;
	border-color: #9ca3af;
}

.size-button.active {
	background: #3b82f6;
	border-color: #3b82f6;
	color: white;
}

.color-picker {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.color-buttons {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 0.5rem;
}

.color-button {
	width: 2rem;
	height: 2rem;
	border: 2px solid #d1d5db;
	border-radius: 0.375rem;
	cursor: pointer;
	transition: all 0.2s;
}

.color-button:hover {
	border-color: #9ca3af;
	transform: scale(1.1);
}

.color-button.active {
	border-color: #3b82f6;
	transform: scale(1.1);
}

.custom-color {
	display: flex;
	justify-content: center;
}

.color-input {
	width: 3rem;
	height: 3rem;
	border: 2px solid #d1d5db;
	border-radius: 0.375rem;
	cursor: pointer;
	background: none;
}

.color-input:hover {
	border-color: #9ca3af;
}

.action-buttons {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.action-button {
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	background: white;
	cursor: pointer;
	font-size: 0.875rem;
	font-weight: 500;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
}

.action-button:hover {
	background: #f9fafb;
	border-color: #9ca3af;
}

.action-button.undo:hover {
	background: #f0fdf4;
	border-color: #4ade80;
	color: #16a34a;
}

.action-button.redo:hover {
	background: #f0fdf4;
	border-color: #4ade80;
	color: #16a34a;
}

.action-button.select:hover {
	background: #f0fdf4;
	border-color: #4ade80;
	color: #16a34a;
}

.action-button.clear:hover {
	background: #fef2f2;
	border-color: #f87171;
	color: #dc2626;
}

.action-button.export:hover {
	background: #f0f9ff;
	border-color: #60a5fa;
	color: #2563eb;
}

.action-button.import:hover {
	background: #f0fdf4;
	border-color: #4ade80;
	color: #16a34a;
}

.selection-buttons {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.selection-button {
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	background: white;
	cursor: pointer;
	font-size: 0.875rem;
	font-weight: 500;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
}

.selection-button:hover {
	background: #f9fafb;
	border-color: #9ca3af;
}

.selection-button.active {
	background: #3b82f6;
	border-color: #3b82f6;
	color: white;
}

.shortcuts {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.shortcut-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem;
	background: #f9fafb;
	border-radius: 0.375rem;
}

.shortcut-key {
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
}

.shortcut-desc {
	font-size: 0.875rem;
	color: #6b7280;
}

.stats {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.stat-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem;
	background: #f9fafb;
	border-radius: 0.375rem;
}

.stat-label {
	font-size: 0.875rem;
	color: #6b7280;
}

.stat-value {
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
}

.import-export-buttons {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.format-info {
	margin-top: 0.5rem;
	padding: 0.5rem;
	background: #f0f9ff;
	border: 1px solid #bae6fd;
	border-radius: 0.375rem;
}

.format-info small {
	color: #0369a1;
	font-size: 0.75rem;
}
</style> 