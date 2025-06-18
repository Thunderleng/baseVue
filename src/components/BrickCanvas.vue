<template>
	<div ref="canvasRef" class="brick-canvas">
		<!-- 3D场景将在这里渲染 -->

		<!-- 状态提示 -->
		<div class="status-overlay">
			<div class="status-item">
				<span class="status-label">模式:</span>
				<span class="status-value">{{ isShiftDown ? '删除' : '添加' }}</span>
			</div>
			<div class="status-item">
				<span class="status-label">积木数量:</span>
				<span class="status-value">{{ brickCount }}</span>
			</div>
			<div class="status-item">
				<span class="status-label">当前颜色:</span>
				<span class="status-value" :style="{ color: currentColor }">■</span>
			</div>
			<div class="status-item">
				<span class="status-label">当前尺寸:</span>
				<span class="status-value"
					>{{ currentSize[0] }}x{{ currentSize[1] }}</span
				>
			</div>
		</div>

		<!-- 工具栏 -->
		<div class="toolbar">
			<div class="tool-group">
				<label>积木颜色:</label>
				<input
					v-model="currentColor"
					type="color"
					@change="updateCurrentColor"
				/>
			</div>

			<div class="tool-group">
				<label>积木尺寸:</label>
				<select
					v-model="currentSizeIndex"
					class="size-select"
					@change="updateCurrentSize"
				>
					<option
						v-for="(size, index) in availableSizes"
						:key="index"
						:value="index"
					>
						{{ size[0] }}x{{ size[1] }}
					</option>
				</select>
			</div>

			<div class="tool-group">
				<button class="btn btn-import" @click="importJSON">📥 导入JSON</button>
				<button class="btn btn-export" @click="exportJSON">📤 导出JSON</button>
				<button class="btn btn-export" @click="exportViewerFormat">
					📤 导出展示器格式
				</button>
			</div>
		</div>

		<!-- 隐藏的文件输入 -->
		<input
			ref="fileInput"
			type="file"
			accept=".json"
			style="display: none"
			@change="handleFileSelect"
		/>

		<!-- 操作提示 -->
		<div class="help-overlay">
			<div class="help-content">
				<h3>积木编辑器操作指南</h3>
				<ul>
					<li><strong>鼠标左键</strong>: 放置积木</li>
					<li><strong>Shift + 左键</strong>: 删除积木</li>
					<li><strong>鼠标滚轮</strong>: 缩放视角</li>
					<li><strong>鼠标拖拽</strong>: 旋转视角</li>
					<li><strong>右键点击积木</strong>: 更改颜色</li>
					<li><strong>工具栏</strong>: 选择积木尺寸和颜色</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useBrickEditorStore } from '@/stores/brickEditorStore'
import {
	ViewerBrickData,
	EditorBrickData,
	parseBrickData,
	exportToViewerFormat,
	createStandardBrick,
} from '@/utils/brickDataConverter'

const store = useBrickEditorStore()

// 引用
const canvasRef = ref<HTMLDivElement>()
const fileInput = ref<HTMLInputElement>()

// 状态
const isShiftDown = ref(false)
const brickCount = computed(() => store.brickCount)

// 积木属性
const currentColor = ref('#ff0000')
const currentSizeIndex = ref(0)

// 可用的积木尺寸选项
const availableSizes: [number, number][] = [
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
]

const currentSize = computed(() => availableSizes[currentSizeIndex.value])

// Three.js 对象
let camera: THREE.PerspectiveCamera
let scene: THREE.Scene
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let grid: THREE.GridHelper
let plane: THREE.Mesh
let rollOverMesh: THREE.Mesh
let rollOverMaterial: THREE.MeshBasicMaterial
let objects: THREE.Object3D[] = []
let pointer: THREE.Vector2
let raycaster: THREE.Raycaster

// 积木网格映射
const brickMeshes = new Map<string, THREE.Mesh>()

// 标准积木几何体缓存
const geometryCache = new Map<string, THREE.BufferGeometry>()

// 更新当前颜色
function updateCurrentColor() {
	rollOverMaterial.color.setHex(parseInt(currentColor.value.slice(1), 16))
}

// 更新当前尺寸
function updateCurrentSize() {
	// 更新store中的当前尺寸
	store.setCurrentSize(currentSize.value)

	// 更新预览网格的几何体
	if (rollOverMesh) {
		// 移除旧的预览网格
		scene.remove(rollOverMesh)
		rollOverMesh.geometry.dispose()

		// 创建新的预览网格
		rollOverMesh = new THREE.Mesh(
			createStandardBrickGeometry(currentSize.value),
			rollOverMaterial,
		)
		scene.add(rollOverMesh)
	}
}

// 创建标准积木几何体
function createStandardBrickGeometry(
	size: [number, number] = [1, 1],
): THREE.BufferGeometry {
	const [width, length] = size
	const cacheKey = `${width}x${length}`

	// 检查缓存
	if (geometryCache.has(cacheKey)) {
		return geometryCache.get(cacheKey)!.clone()
	}

	// 正方体部分（根据尺寸调整）
	const boxGeometry = new THREE.BoxGeometry(width * 50, 50, length * 50)

	// 圆柱体部分（顶部凸点）
	const cylinderGeometry = new THREE.CylinderGeometry(8, 8, 8, 12)
	cylinderGeometry.translate(0, 29, 0) // 将圆柱体移到正方体顶部

	// 合并几何体
	const geometries = [boxGeometry, cylinderGeometry]
	const mergedGeometry = mergeGeometries(geometries)

	// 缓存几何体
	geometryCache.set(cacheKey, mergedGeometry)

	return mergedGeometry.clone()
}

// 导入JSON
function importJSON() {
	fileInput.value?.click()
}

// 处理文件选择
async function handleFileSelect(event: Event) {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]

	if (!file) return

	try {
		const text = await file.text()
		const editorBricks = parseBrickData(text)

		// 清空当前场景
		clearScene()

		// 添加导入的积木
		editorBricks.forEach((brick) => {
			addBrickToScene(brick)
		})

		// 更新store
		store.importBricks(editorBricks)

		console.log(`成功导入 ${editorBricks.length} 个积木`)
	} catch (error) {
		console.error('导入失败:', error)
		alert('导入失败: ' + error)
	}

	// 清空文件输入
	target.value = ''
}

// 导出JSON
function exportJSON() {
	const data = store.exportToJSON()
	downloadFile(data, 'bricks_editor.json')
}

// 导出展示器格式
function exportViewerFormat() {
	const viewerData = exportToViewerFormat(store.bricks)
	downloadFile(viewerData, 'bricks_viewer.json')
}

// 下载文件
function downloadFile(content: string, filename: string) {
	const blob = new Blob([content], { type: 'application/json' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}

// 清空场景
function clearScene() {
	// 移除所有积木网格
	brickMeshes.forEach((mesh) => {
		scene.remove(mesh)
		mesh.geometry.dispose()
		;(mesh.material as THREE.Material).dispose()
	})
	brickMeshes.clear()

	// 清空对象数组（保留地面）
	objects = objects.filter((obj) => obj === plane)
}

// 添加积木到场景
function addBrickToScene(brick: EditorBrickData) {
	const material = new THREE.MeshLambertMaterial({
		color: parseInt(brick.color.slice(1), 16),
	})
	const mesh = new THREE.Mesh(createStandardBrickGeometry(brick.size), material)

	// 设置位置（积木中心对齐到网格中心）
	mesh.position.set(
		brick.position[0] * 50 + 25, // 网格坐标转换为世界坐标，加上25偏移到网格中心
		brick.position[1] * 50 + 25,
		brick.position[2] * 50 + 25,
	)

	// 设置旋转
	mesh.rotation.y = THREE.MathUtils.degToRad(brick.rotation)

	// 添加到场景
	scene.add(mesh)
	objects.push(mesh)

	// 存储到映射中
	brickMeshes.set(brick.id, mesh)
}

// 从场景中移除积木
function removeBrickFromScene(brickId: string) {
	const mesh = brickMeshes.get(brickId)
	if (mesh) {
		scene.remove(mesh)
		mesh.geometry.dispose()
		;(mesh.material as THREE.Material).dispose()
		brickMeshes.delete(brickId)
		objects = objects.filter((obj) => obj !== mesh)
	}
}

// 更改积木颜色
function changeBrickColor(brickId: string, color: string) {
	const mesh = brickMeshes.get(brickId)
	if (mesh && mesh.material instanceof THREE.Material) {
		;(mesh.material as THREE.MeshLambertMaterial).color.setHex(
			parseInt(color.slice(1), 16),
		)
	}
}

// 创建标准积木数据
function createBrickData(position: [number, number, number]): ViewerBrickData {
	return createStandardBrick(
		position,
		currentSize.value, // 使用当前选择的尺寸
		currentColor.value,
		true, // 包含圆柱体
	)
}

// 初始化场景
function initScene() {
	if (!canvasRef.value) return

	const container = canvasRef.value
	const width = container.clientWidth
	const height = container.clientHeight

	// 创建场景
	scene = new THREE.Scene()
	scene.background = new THREE.Color(0xf0f0f0)

	// 创建相机
	camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000)
	camera.position.set(500, 500, 500)

	// 创建渲染器
	renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setSize(width, height)
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap
	container.appendChild(renderer.domElement)

	// 创建控制器
	controls = new OrbitControls(camera, renderer.domElement)
	controls.enableDamping = true
	controls.dampingFactor = 0.05

	// 创建网格
	grid = new THREE.GridHelper(1000, 20, 0x888888, 0x888888)
	grid.position.y = 0
	scene.add(grid)

	// 创建地面平面
	const planeGeometry = new THREE.PlaneGeometry(1000, 1000)
	const planeMaterial = new THREE.MeshBasicMaterial({
		color: 0xcccccc,
		transparent: true,
		opacity: 0.3,
		side: THREE.DoubleSide,
	})
	plane = new THREE.Mesh(planeGeometry, planeMaterial)
	plane.rotation.x = -Math.PI / 2
	plane.position.y = 0
	scene.add(plane)
	objects.push(plane)

	// 创建预览网格
	const previewGeometry = createStandardBrickGeometry(currentSize.value)
	rollOverMaterial = new THREE.MeshBasicMaterial({
		color: parseInt(currentColor.value.slice(1), 16),
		transparent: true,
		opacity: 0.5,
	})
	rollOverMesh = new THREE.Mesh(previewGeometry, rollOverMaterial)
	scene.add(rollOverMesh)

	// 创建指针和射线检测器
	pointer = new THREE.Vector2()
	raycaster = new THREE.Raycaster()

	// 添加事件监听器
	renderer.domElement.addEventListener('pointermove', onPointerMove)
	renderer.domElement.addEventListener('pointerdown', onPointerDown)
	renderer.domElement.addEventListener('contextmenu', onContextMenu)
	document.addEventListener('keydown', onDocumentKeyDown)
	document.addEventListener('keyup', onDocumentKeyUp)
	window.addEventListener('resize', onWindowResize)

	// 开始动画循环
	animate()
}

// 鼠标移动事件
function onPointerMove(event: PointerEvent) {
	const rect = renderer.domElement.getBoundingClientRect()
	pointer.set(
		((event.clientX - rect.left) / rect.width) * 2 - 1,
		(-(event.clientY - rect.top) / rect.height) * 2 + 1,
	)

	raycaster.setFromCamera(pointer, camera)

	const intersects = raycaster.intersectObjects(objects, false)

	if (intersects.length > 0) {
		const intersect = intersects[0]

		// 计算网格对齐的位置
		const [width, length] = currentSize.value
		const isWidthEven = width % 2 === 0
		const isLengthEven = length % 2 === 0

		const clickedGridX = Math.floor(intersect.point.x / 50)
		const clickedGridY = Math.floor(intersect.point.y / 50)
		const clickedGridZ = Math.floor(intersect.point.z / 50)

		let centerGridX = clickedGridX
		let centerGridZ = clickedGridZ

		// 对于偶数尺寸，调整中心位置让边界对齐到网格线
		if (isWidthEven) {
			centerGridX = clickedGridX + (width - 1) / 2
		}
		if (isLengthEven) {
			centerGridZ = clickedGridZ + (length - 1) / 2
		}

		const centerGridY = clickedGridY

		// 转换为世界坐标
		const worldX = centerGridX * 50 + 25
		const worldY = centerGridY * 50 + 25
		const worldZ = centerGridZ * 50 + 25

		// 更新预览网格位置
		rollOverMesh.position.set(worldX, worldY, worldZ)

		// 检查位置是否被占用或没有支撑
		const position: [number, number, number] = [
			centerGridX,
			centerGridY,
			centerGridZ,
		]
		const isOccupied = store.isPositionOccupied(position, currentSize.value)
		const hasSupport = store.hasSupport(position, currentSize.value)

		// 根据状态设置预览颜色
		if (isOccupied || !hasSupport) {
			rollOverMaterial.color.setHex(0xff0000) // 红色表示不能放置
		} else {
			rollOverMaterial.color.setHex(parseInt(currentColor.value.slice(1), 16)) // 正常颜色
		}
	}

	render()
}

// 鼠标点击事件
function onPointerDown(event: PointerEvent) {
	const rect = renderer.domElement.getBoundingClientRect()
	pointer.set(
		((event.clientX - rect.left) / rect.width) * 2 - 1,
		(-(event.clientY - rect.top) / rect.height) * 2 + 1,
	)

	raycaster.setFromCamera(pointer, camera)

	const intersects = raycaster.intersectObjects(objects, false)

	if (intersects.length > 0) {
		const intersect = intersects[0]

		// 删除积木
		if (isShiftDown.value) {
			if (intersect.object !== plane) {
				// 找到对应的积木ID
				const brickId = Array.from(brickMeshes.entries()).find(
					([, mesh]) => mesh === intersect.object,
				)?.[0]

				if (brickId) {
					removeBrickFromScene(brickId)
					store.deleteBrick(brickId)
				}
			}
		} else {
			// 计算网格对齐的位置（积木边界对齐到网格线）
			const [width, length] = currentSize.value

			// 获取鼠标点击的网格坐标
			const clickedGridX = Math.floor(intersect.point.x / 50)
			const clickedGridY = Math.floor(intersect.point.y / 50)
			const clickedGridZ = Math.floor(intersect.point.z / 50)

			// 计算积木中心位置
			// 对于奇数尺寸：中心对齐到网格中心
			// 对于偶数尺寸：边界对齐到网格线
			const isWidthEven = width % 2 === 0
			const isLengthEven = length % 2 === 0

			let centerGridX = clickedGridX
			let centerGridZ = clickedGridZ

			// 对于偶数尺寸，调整中心位置让边界对齐到网格线
			if (isWidthEven) {
				// 偶数宽度：让左边界对齐到网格线
				// 如果点击在网格[1]，2x1积木应该占据网格[1,2]，中心在1.5
				centerGridX = clickedGridX + (width - 1) / 2
			}
			if (isLengthEven) {
				// 偶数长度：让前边界对齐到网格线
				// 如果点击在网格[1]，1x2积木应该占据网格[1,2]，中心在1.5
				centerGridZ = clickedGridZ + (length - 1) / 2
			}

			const centerGridY = clickedGridY

			// 转换为世界坐标（积木中心对齐到计算出的网格中心）
			const worldX = centerGridX * 50 + 25 // 网格中心
			const worldY = centerGridY * 50 + 25 // 网格中心
			const worldZ = centerGridZ * 50 + 25 // 网格中心

			// 转换为网格坐标
			const position: [number, number, number] = [
				centerGridX,
				centerGridY,
				centerGridZ,
			]

			// 调试信息
			console.log('积木放置调试信息:')
			console.log('点击位置:', intersect.point)
			console.log('网格坐标:', [clickedGridX, clickedGridY, clickedGridZ])
			console.log('积木尺寸:', currentSize.value)
			console.log('宽度偶数:', isWidthEven, '长度偶数:', isLengthEven)
			console.log('积木中心网格坐标:', [centerGridX, centerGridY, centerGridZ])
			console.log('世界坐标:', [worldX, worldY, worldZ])
			console.log('最终位置:', position)

			// 检查位置是否被占用（碰撞检测）
			if (store.isPositionOccupied(position, currentSize.value)) {
				console.log('位置被占用，无法放置积木')
				// 可以在这里添加视觉反馈，比如显示红色预览
				return
			}

			// 检查积木是否有支撑（地面检测）
			if (!store.hasSupport(position, currentSize.value)) {
				console.log('积木没有支撑，无法放置')
				return
			}

			// 创建标准积木数据
			createBrickData(position)

			// 转换为编辑器格式
			const editorBrick: EditorBrickData = {
				id:
					'brick_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
				position,
				rotation: 0,
				size: currentSize.value, // 使用当前选择的尺寸
				color: currentColor.value,
			}

			// 添加到场景和store
			addBrickToScene(editorBrick)
			store.addBrick(position)
		}

		render()
	}
}

// 右键菜单事件
function onContextMenu(event: Event) {
	event.preventDefault()

	const rect = renderer.domElement.getBoundingClientRect()
	pointer.set(
		(((event as MouseEvent).clientX - rect.left) / rect.width) * 2 - 1,
		(-((event as MouseEvent).clientY - rect.top) / rect.height) * 2 + 1,
	)

	raycaster.setFromCamera(pointer, camera)

	const intersects = raycaster.intersectObjects(objects, false)

	if (intersects.length > 0) {
		const intersect = intersects[0]

		if (intersect.object !== plane) {
			// 找到对应的积木ID
			const brickId = Array.from(brickMeshes.entries()).find(
				([, mesh]) => mesh === intersect.object,
			)?.[0]

			if (brickId) {
				// 更改积木颜色
				changeBrickColor(brickId, currentColor.value)

				// 更新store中的颜色
				const brick = store.bricks.find((b) => b.id === brickId)
				if (brick) {
					store.changeBrickColor(brickId, currentColor.value)
				}
			}
		}
	}
}

// 键盘按下事件
function onDocumentKeyDown(event: KeyboardEvent) {
	switch (event.keyCode) {
		case 16: // Shift
			isShiftDown.value = true
			break
	}
}

// 键盘释放事件
function onDocumentKeyUp(event: KeyboardEvent) {
	switch (event.keyCode) {
		case 16: // Shift
			isShiftDown.value = false
			break
	}
}

// 窗口大小改变事件
function onWindowResize() {
	if (!canvasRef.value) return

	const width = canvasRef.value.clientWidth
	const height = canvasRef.value.clientHeight

	camera.aspect = width / height
	camera.updateProjectionMatrix()
	renderer.setSize(width, height)
	render()
}

// 渲染循环
function render() {
	renderer.render(scene, camera)
}

// 动画循环
function animate() {
	requestAnimationFrame(animate)
	controls.update()
	render()
}

// 组件挂载
onMounted(() => {
	initScene()
})

// 组件卸载
onUnmounted(() => {
	// 清理资源
	if (renderer) {
		renderer.dispose()
	}
})
</script>

<style scoped>
.brick-canvas {
	width: 100%;
	height: 100vh;
	position: relative;
	background-color: #f0f0f0;
	overflow: hidden;
}

.brick-canvas canvas {
	display: block;
	position: absolute;
	top: 0;
	left: 0;
}

.toolbar {
	position: absolute;
	top: 20px;
	left: 50%;
	transform: translateX(-50%);
	background: rgba(0, 0, 0, 0.8);
	color: white;
	padding: 15px;
	border-radius: 8px;
	z-index: 1000;
	display: flex;
	gap: 20px;
	align-items: center;
}

.tool-group {
	display: flex;
	align-items: center;
	gap: 8px;
}

.tool-group label {
	font-size: 14px;
	font-weight: bold;
}

.tool-group input[type='color'] {
	padding: 4px 8px;
	border: none;
	border-radius: 4px;
	background: white;
	color: black;
	width: 50px;
	height: 30px;
}

.size-select {
	padding: 4px 8px;
	border: none;
	border-radius: 4px;
	background: white;
	color: black;
	font-size: 14px;
	font-weight: bold;
	min-width: 80px;
}

.btn {
	padding: 8px 16px;
	border: none;
	border-radius: 4px;
	cursor: pointer;
	font-size: 14px;
	font-weight: bold;
	transition: background-color 0.2s;
}

.btn-import {
	background: #4ade80;
	color: white;
}

.btn-import:hover {
	background: #22c55e;
}

.btn-export {
	background: #3b82f6;
	color: white;
}

.btn-export:hover {
	background: #2563eb;
}

.status-overlay {
	position: absolute;
	top: 20px;
	left: 20px;
	background: rgba(0, 0, 0, 0.7);
	color: white;
	padding: 10px;
	border-radius: 5px;
	z-index: 1000;
}

.status-item {
	margin-bottom: 5px;
}

.status-label {
	font-weight: bold;
	margin-right: 10px;
}

.help-overlay {
	position: absolute;
	top: 20px;
	right: 20px;
	background: rgba(0, 0, 0, 0.7);
	color: white;
	padding: 15px;
	border-radius: 5px;
	z-index: 1000;
	max-width: 300px;
}

.help-content h3 {
	margin: 0 0 10px 0;
	font-size: 16px;
}

.help-content ul {
	margin: 0;
	padding-left: 20px;
}

.help-content li {
	margin-bottom: 5px;
	font-size: 14px;
}

.help-content strong {
	color: #4ade80;
}
</style>
