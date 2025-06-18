<template>
	<div class="brick-viewer relative h-full w-full">
		<!-- 3D 场景容器 -->
		<div ref="containerRef" class="h-full w-full"></div>

		<!-- 控制面板 -->
		<LayerControls :current-layer="currentLayer" :max-layers="maxLayers" :visible-layers="visibleLayers"
			:is-loading="isLoading" :render-stats="layerRenderStats" :layer-loading-states="layerLoadingStates"
			@prev-layer="prevLayer" @next-layer="nextLayer" @toggle-layer="toggleLayer" @select-all="selectAll"
			@deselect-all="deselectAll" @reset-view="resetView" @fit-view="fitCameraToScene"
			@update-render-layers="updateRenderLayers" />

		<!-- 朝向控制面板 -->
		<div class="absolute right-4 top-4">
			<OrientationControls :current-orientation="globalOrientation" :rotation-x="globalRotationX"
				:rotation-y="globalRotationY" :rotation-z="globalRotationZ" @set-orientation="setGlobalOrientation"
				@set-rotation="setGlobalRotation" @reset-orientation="resetOrientation" />
		</div>
		<!-- 错误提示 -->
		<div v-if="error" class="absolute right-4 top-4 rounded-lg bg-red-500 px-4 py-2 text-white shadow-lg">
			{{ error }}
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useLayerLoader } from '@/composables/useLayerLoader'
import LayerControls from './LayerControls.vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import { BrickOrientation, RotationAxis } from '@/models/Brick'
import OrientationControls from './OrientationControls.vue'

// 配置
// const maxLayers = 2 // 最大层数，使用本地mock数据
// const baseUrl = '/mock' // 本地mock数据路径

// 远程JSON地址列表
const remoteLayerUrls = [
	'https://mp-e05e5737-efb0-40a6-9173-e3922ce84754.cdn.bspapp.com/floor/blocks_data_000001.json',
	'https://mp-e05e5737-efb0-40a6-9173-e3922ce84754.cdn.bspapp.com/floor/blocks_data_000002.json',
	'https://mp-e05e5737-efb0-40a6-9173-e3922ce84754.cdn.bspapp.com/floor/blocks_data_000003.json',
	'https://mp-e05e5737-efb0-40a6-9173-e3922ce84754.cdn.bspapp.com/floor/blocks_data_000004.json',
]
const maxLayers = remoteLayerUrls.length

// 状态管理
const currentLayer = ref(0)
const visibleLayers = ref<boolean[]>(new Array(maxLayers).fill(false))
const layersData = ref<any[]>(new Array(maxLayers).fill(null))
const layerLoadingStates = ref<boolean[]>(new Array(maxLayers).fill(false))

// 性能优化：添加层渲染统计
const layerRenderStats = ref<{
	totalBricks: number
	visibleBricks: number
	renderedLayers: number
}>({
	totalBricks: 0,
	visibleBricks: 0,
	renderedLayers: 0,
})

// Three.js 相关
const containerRef = ref<HTMLElement>()
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let layerGroups: THREE.Group[] = []

// 积木类型定义
interface BrickType {
	shape: [number, number]
	hasCylinder: boolean
	color: [number, number, number]
}

// 积木类型缓存
const brickTypeCache = new Map<string, BrickType>()
const instancedMeshes = new Map<string, THREE.InstancedMesh>()

// 新增：为每层创建独立的InstancedMesh缓存
const layerInstancedMeshes = new Map<string, THREE.InstancedMesh>()

// 使用层加载器
const { isLoading, error } = useLayerLoader()

// 朝向控制状态
const globalOrientation = ref<BrickOrientation>(BrickOrientation.EAST)
const globalRotationX = ref<number>(0)
const globalRotationY = ref<number>(0)
const globalRotationZ = ref<number>(0)

// 获取积木类型键
function getBrickTypeKey(brickData: any): string {
	const shape = brickData.shape.join('x')
	const hasCylinder = brickData.circle_radius && brickData.circle_radius > 0
	const color = brickData.color.join(',')
	const key = `${shape}_${hasCylinder ? 'cylinder' : 'base'}_${color}`

	if (hasCylinder) {
		console.log(
			`Brick with cylinder detected: shape=${shape}, radius=${brickData.circle_radius}, thickness=${brickData.cylinder_thickness}`,
		)
	}

	return key
}

// 获取积木类型
function getBrickType(brickData: any): BrickType {
	const key = getBrickTypeKey(brickData)

	if (!brickTypeCache.has(key)) {
		const brickType: BrickType = {
			shape: brickData.shape,
			hasCylinder: !!(brickData.circle_radius && brickData.circle_radius > 0),
			color: brickData.color,
		}
		brickTypeCache.set(key, brickType)
	}

	return brickTypeCache.get(key)!
}

// 创建积木几何体
function createBrickGeometry(
	brickType: BrickType,
	brickData: any,
): THREE.BufferGeometry {
	// 直接创建合并的几何体，不使用Group
	const geometries: THREE.BufferGeometry[] = []

	// 减小间隙，让积木间隔更小
	const gap = 0.0005 // 从0.001减小到0.0005，积木间隔更小

	// 1. 创建底部正方体/长方体
	const baseWidth = brickData.size * brickType.shape[0] - gap
	const baseHeight = brickData.size * brickType.shape[1] - gap
	const baseDepth = brickData.thickness

	const baseGeometry = new THREE.BoxGeometry(baseWidth, baseDepth, baseHeight)
	// 将底部几何体向上移动
	baseGeometry.translate(0, baseDepth / 2, 0)
	geometries.push(baseGeometry)

	// 2. 创建顶部圆柱体（如果存在）
	if (brickType.hasCylinder) {
		// 调整圆柱体尺寸，使其更容易看到
		const cylinderRadius = brickData.circle_radius - gap * 0.5 // 稍微减小半径
		const cylinderHeight = brickData.cylinder_thickness

		const cylinderGeometry = new THREE.CylinderGeometry(
			cylinderRadius,
			cylinderRadius,
			cylinderHeight,
			12,
		)
		// 将圆柱体向上移动
		cylinderGeometry.translate(0, baseDepth + cylinderHeight / 2, 0)
		geometries.push(cylinderGeometry)

		console.log(
			`Created cylinder for brick: radius=${cylinderRadius}, height=${cylinderHeight}, position=${baseDepth + cylinderHeight / 2}`,
		)
	}

	// 使用BufferGeometryUtils合并几何体
	if (geometries.length === 1) {
		console.log(`Single geometry for brick type: ${getBrickTypeKey(brickData)}`)
		return geometries[0]
	} else if (geometries.length > 1) {
		console.log(
			`Merged ${geometries.length} geometries for brick type: ${getBrickTypeKey(brickData)}`,
		)
		return BufferGeometryUtils.mergeGeometries(geometries)
	} else {
		console.warn('No geometries created for brick')
		return new THREE.BufferGeometry()
	}
}

// 创建或获取InstancedMesh - 修复版本，为每层创建独立实例
function getOrCreateInstancedMesh(
	brickType: BrickType,
	brickData: any,
	layerIndex: number,
): THREE.InstancedMesh {
	const key = getBrickTypeKey(brickData)
	const layerKey = `${key}_layer_${layerIndex}`

	if (!layerInstancedMeshes.has(layerKey)) {
		const geometry = createBrickGeometry(brickType, brickData)

		// 增强材质设置，让积木边界更明显
		const material = new THREE.MeshStandardMaterial({
			color: new THREE.Color(
				brickType.color[0],
				brickType.color[1],
				brickType.color[2],
			),
			roughness: 0.8, // 增加粗糙度，减少光泽，更像塑料玩具
			metalness: 0.0, // 完全去除金属感
			transparent: false,
			side: THREE.FrontSide,
			flatShading: false, // 关闭平面着色，让表面更平滑
		})

		// 创建InstancedMesh，预留足够空间
		const instancedMesh = new THREE.InstancedMesh(geometry, material, 1000)
		instancedMesh.castShadow = true
		instancedMesh.receiveShadow = true

		layerInstancedMeshes.set(layerKey, instancedMesh)
	}

	return layerInstancedMeshes.get(layerKey)!
}

// 初始化Three.js场景
function initThreeJS() {
	if (!containerRef.value) return

	// 创建场景
	scene = new THREE.Scene()
	scene.background = new THREE.Color(0x2c3e50) // 深蓝灰色背景，与积木形成更好对比

	// 创建相机 - 调整视角和距离，适应y轴平行坐标系
	camera = new THREE.PerspectiveCamera(
		35, // 减小FOV，获得更好的透视效果
		containerRef.value.clientWidth / containerRef.value.clientHeight,
		0.001, // 减小近平面距离
		1000, // 增大远平面距离
	)

	// 调整相机位置，适应新的坐标系
	camera.position.set(0.15, 0.15, 0.08) // 调整位置以适应新坐标系
	camera.lookAt(0, 0, 0)

	// 创建渲染器 - 优化渲染设置
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		alpha: true,
		logarithmicDepthBuffer: true, // 启用对数深度缓冲，改善深度精度
		powerPreference: 'high-performance', // 优先使用高性能GPU
	})
	renderer.setSize(
		containerRef.value.clientWidth,
		containerRef.value.clientHeight,
	)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 限制像素比，提高性能
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap
	renderer.outputColorSpace = THREE.SRGBColorSpace // 改善颜色显示
	renderer.toneMapping = THREE.ACESFilmicToneMapping // 使用电影级色调映射
	renderer.toneMappingExposure = 0.8 // 降低曝光度，减少亮度
	containerRef.value.appendChild(renderer.domElement)

	// 创建控制器 - 调整控制范围
	controls = new OrbitControls(camera, renderer.domElement)
	controls.enableDamping = true
	controls.dampingFactor = 0.05
	controls.enableZoom = true
	controls.enablePan = true
	controls.enableRotate = true
	controls.minDistance = 0.02 // 允许更近的缩放
	controls.maxDistance = 1.5 // 调整最大距离
	controls.target.set(0, 0, 0) // 设置控制中心点

	// 添加光源 - 玩具风格+淡光氛围
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.3) // 主环境光
	scene.add(ambientLight)

	// 添加淡蓝色环境光，模拟天空反射
	const skyLight = new THREE.AmbientLight(0xbcdfff, 0.18)
	scene.add(skyLight)

	// 主方向光 - 有阴影
	const mainDirLight = new THREE.DirectionalLight(0xffffff, 0.8)
	mainDirLight.position.set(0.8, 1.2, 1.0)
	mainDirLight.castShadow = true
	mainDirLight.shadow.mapSize.width = 1024
	mainDirLight.shadow.mapSize.height = 1024
	mainDirLight.shadow.camera.near = 0.01
	mainDirLight.shadow.camera.far = 10
	mainDirLight.shadow.camera.left = -1
	mainDirLight.shadow.camera.right = 1
	mainDirLight.shadow.camera.top = 1
	mainDirLight.shadow.camera.bottom = -1
	scene.add(mainDirLight)

	// 侧方向光 - 无阴影
	const sideDirLight = new THREE.DirectionalLight(0xffffff, 0.3)
	sideDirLight.position.set(-1, 0.5, -0.5)
	sideDirLight.castShadow = false
	scene.add(sideDirLight)

	// 初始化层组
	layerGroups = new Array(maxLayers).fill(null).map(() => new THREE.Group())
	layerGroups.forEach((group) => scene.add(group))

	// 开始渲染循环
	animate()
}

// 渲染循环
function animate() {
	requestAnimationFrame(animate)
	controls.update()
	renderer.render(scene, camera)
}

// 渲染积木层（使用InstancedMesh）- 修复版本，添加朝向控制
function renderBrickLayer(layerIndex: number, bricks: any[]) {
	if (!layerGroups[layerIndex]) {
		console.error(`Layer group ${layerIndex} not found!`)
		return
	}

	console.log(`=== Rendering Layer ${layerIndex + 1} ===`)
	console.log(`Layer group exists:`, !!layerGroups[layerIndex])
	console.log(`Layer group visible:`, layerGroups[layerIndex].visible)
	console.log(`Bricks count:`, bricks.length)
	console.log(`Global orientation:`, globalOrientation.value)

	// 清空当前层
	layerGroups[layerIndex].clear()
	console.log(`Cleared layer ${layerIndex + 1}, children count:`, layerGroups[layerIndex].children.length)

	// 按类型分组积木
	const bricksByType = new Map<string, any[]>()

	bricks.forEach((brickData) => {
		// 应用全局朝向设置
		const enhancedBrickData = {
			...brickData,
			orientation: globalOrientation.value,
			rotationX: globalRotationX.value,
			rotationY: globalRotationY.value,
			rotationZ: globalRotationZ.value,
		}

		const key = getBrickTypeKey(enhancedBrickData)
		if (!bricksByType.has(key)) {
			bricksByType.set(key, [])
		}
		bricksByType.get(key)!.push(enhancedBrickData)
	})

	console.log(
		`Layer ${layerIndex + 1} brick types:`,
		Array.from(bricksByType.entries()).map(
			([key, bricks]) => `${key}: ${bricks.length} bricks`,
		),
	)

	// 为每种类型创建InstancedMesh
	bricksByType.forEach((bricksOfType) => {
		if (bricksOfType.length === 0) return

		const firstBrick = bricksOfType[0]
		const brickType = getBrickType(firstBrick)
		// 为每层创建独立的InstancedMesh
		const instancedMesh = getOrCreateInstancedMesh(brickType, firstBrick, layerIndex)

		console.log(`Created InstancedMesh for layer ${layerIndex + 1}, type: ${getBrickTypeKey(firstBrick)}`)

		// 设置实例矩阵
		bricksOfType.forEach((brickData, index) => {
			const matrix = new THREE.Matrix4()

			// 坐标系转换：JSON [x, y, z] -> Three.js [x, z, y]
			const x = brickData.center[0]
			const y = brickData.center[2] // JSON的z轴映射到Three.js的y轴
			const z = brickData.center[1] // JSON的y轴映射到Three.js的z轴

			// 应用位置微调，让积木更紧密
			const positionOffset = 0.0002 // 微调偏移量
			matrix.setPosition(x + positionOffset, y + positionOffset, z + positionOffset)

			// 调试信息（只显示前几个积木）
			if (index < 3) {
				console.log(
					`Layer ${layerIndex + 1} Brick ${index}: JSON [${brickData.center.join(', ')}] -> Three.js [${x}, ${y}, ${z}]`,
				)
			}

			// 应用旋转矩阵
			const rotationMatrix = new THREE.Matrix4()

			// 基础旋转（Y轴旋转90度）
			rotationMatrix.makeRotationY(Math.PI / 2)

			// 朝向旋转
			const orientationRotation = new THREE.Matrix4()
			orientationRotation.makeRotationY((brickData.orientation * Math.PI) / 180)
			rotationMatrix.multiply(orientationRotation)

			// 全局旋转
			if (brickData.rotationX !== 0) {
				const xRotation = new THREE.Matrix4()
				xRotation.makeRotationX((brickData.rotationX * Math.PI) / 180)
				rotationMatrix.multiply(xRotation)
			}

			if (brickData.rotationY !== 0) {
				const yRotation = new THREE.Matrix4()
				yRotation.makeRotationY((brickData.rotationY * Math.PI) / 180)
				rotationMatrix.multiply(yRotation)
			}

			if (brickData.rotationZ !== 0) {
				const zRotation = new THREE.Matrix4()
				zRotation.makeRotationZ((brickData.rotationZ * Math.PI) / 180)
				rotationMatrix.multiply(zRotation)
			}

			matrix.multiply(rotationMatrix)

			instancedMesh.setMatrixAt(index, matrix)
		})

		// 更新实例计数
		instancedMesh.count = bricksOfType.length
		instancedMesh.instanceMatrix.needsUpdate = true

		// 添加到层组
		layerGroups[layerIndex].add(instancedMesh)
		console.log(`Added InstancedMesh to layer ${layerIndex + 1}, total children:`, layerGroups[layerIndex].children.length)
	})

	console.log(
		`=== Completed rendering layer ${layerIndex + 1} with ${bricks.length} bricks ===`,
	)
	console.log(`Final layer children count:`, layerGroups[layerIndex].children.length)
}

// 重置视角函数
function resetView() {
	if (!camera || !controls) return

	// 重置相机位置，适应新坐标系
	camera.position.set(0.15, 0.15, 0.08)
	camera.lookAt(0, 0, 0)

	// 重置控制器
	controls.target.set(0, 0, 0)
	controls.update()
}

// 自适应视角函数
function fitCameraToScene() {
	if (!scene || !camera || !controls) return

	// 计算场景边界
	const box = new THREE.Box3().setFromObject(scene)
	const center = box.getCenter(new THREE.Vector3())
	const size = box.getSize(new THREE.Vector3())

	// 计算合适的相机距离
	const maxDim = Math.max(size.x, size.y, size.z)
	const fov = camera.fov * (Math.PI / 180)
	let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))

	// 设置最小和最大距离
	cameraZ = Math.max(cameraZ * 2.2, 0.03) // 增加距离倍数，确保不会太近
	cameraZ = Math.min(cameraZ, 1.2) // 限制最大距离

	// 更新相机位置 - 使用更合理的角度，适应新坐标系
	const angle = Math.PI / 6 // 30度角，更平缓的视角
	camera.position.set(
		center.x + cameraZ * Math.cos(angle),
		center.y + cameraZ * Math.sin(angle) * 0.6, // 调整y轴缩放
		center.z + cameraZ * Math.cos(angle),
	)
	camera.lookAt(center)

	// 更新控制器目标
	controls.target.copy(center)
	controls.update()

	// 确保相机在有效范围内
	if (camera.position.distanceTo(center) < controls.minDistance) {
		camera.position.normalize().multiplyScalar(controls.minDistance)
	}
}

// 更新层可见性 - 优化版本
function updateLayerVisibility() {
	console.log('=== Updating Layer Visibility ===')
	console.log('Visible layers:', visibleLayers.value)

	let totalVisibleBricks = 0
	let renderedLayersCount = 0

	visibleLayers.value.forEach((visible, index) => {
		console.log(`Layer ${index + 1}: visible=${visible}, hasData=${!!layersData.value[index]}`)

		if (layerGroups[index]) {
			layerGroups[index].visible = visible
			console.log(`Set layer ${index + 1} visible to:`, visible)

			if (visible) {
				renderedLayersCount++
				if (layersData.value[index]) {
					// 已有数据，直接渲染
					console.log(`Rendering existing data for layer ${index + 1}`)
					renderBrickLayer(index, layersData.value[index])
					totalVisibleBricks += layersData.value[index].length
				} else {
					// 没有数据，先加载
					console.log(`Loading data for layer ${index + 1}`)
					loadLayerData(index)
				}
			}
		} else {
			console.error(`Layer group ${index} not found!`)
		}
	})

	// 更新渲染统计
	layerRenderStats.value = {
		totalBricks: layersData.value.reduce((sum, layer) => sum + (layer?.length || 0), 0),
		visibleBricks: totalVisibleBricks,
		renderedLayers: renderedLayersCount,
	}

	console.log(`=== Layer visibility update complete ===`)
	console.log(`Total visible bricks: ${totalVisibleBricks}`)
	console.log(`Rendered layers: ${renderedLayersCount}`)

	// 性能优化：如果渲染的积木数量过多，自动调整视角
	if (totalVisibleBricks > 1000) {
		console.log(`Performance warning: Rendering ${totalVisibleBricks} bricks across ${renderedLayersCount} layers`)
		// 可以在这里添加性能优化逻辑
	}
}

// 窗口大小调整处理
function handleResize() {
	if (!containerRef.value || !camera || !renderer) return

	const width = containerRef.value.clientWidth
	const height = containerRef.value.clientHeight

	camera.aspect = width / height
	camera.updateProjectionMatrix()

	renderer.setSize(width, height)
}

// 初始化
onMounted(() => {
	initThreeJS()

	// 初始化完成后，设置默认显示前4层进行测试
	nextTick(() => {
		for (let i = 0; i < 4 && i < maxLayers; i++) {
			visibleLayers.value[i] = true
		}

		// 加载所有可见层的数据
		visibleLayers.value.forEach((visible, index) => {
			if (visible) {
				loadLayerData(index)
			}
		})
	})

	// 添加窗口大小调整监听
	window.addEventListener('resize', handleResize)
})

// 监听当前层变化
watch(currentLayer, () => {
	loadCurrentLayer()
})

// 监听可见性变化
watch(
	visibleLayers,
	() => {
		updateLayerVisibility()
	},
	{ deep: true },
)

// 加载当前层数据
async function loadCurrentLayer() {
	try {
		await loadLayerData(currentLayer.value)
	} catch (err) {
		console.error('Failed to load layer:', err)
	}
}

// 优化：层导航函数
function prevLayer() {
	if (currentLayer.value > 0) {
		currentLayer.value--
		// 同步visibleLayers，前N层为true
		for (let i = 0; i < maxLayers; i++) {
			visibleLayers.value[i] = i <= currentLayer.value
		}
		// 预加载相邻层
		preloadAdjacentLayers(currentLayer.value)
	}
}

function nextLayer() {
	if (currentLayer.value < maxLayers - 1) {
		currentLayer.value++
		// 同步visibleLayers，前N层为true
		for (let i = 0; i < maxLayers; i++) {
			visibleLayers.value[i] = i <= currentLayer.value
		}
		// 预加载相邻层
		preloadAdjacentLayers(currentLayer.value)
	}
}

// 层切换
function toggleLayer(index: number) {
	visibleLayers.value[index] = !visibleLayers.value[index]

	// 如果切换的是当前层，自动加载数据
	if (visibleLayers.value[index] && !layersData.value[index]) {
		loadLayerData(index)
	}
}

// 更新渲染层数（滑动条控制）
function updateRenderLayers(newVisibleLayers: boolean[]) {
	visibleLayers.value = [...newVisibleLayers]

	// 加载所有新显示的层
	visibleLayers.value.forEach((visible, index) => {
		if (visible && !layersData.value[index]) {
			loadLayerData(index)
		}
	})
}

// 加载指定层的数据 - 优化版本
async function loadLayerData(layerIndex: number) {
	if (layerIndex < 0 || layerIndex >= maxLayers) return

	// 设置加载状态
	layerLoadingStates.value[layerIndex] = true

	try {
		const url = remoteLayerUrls[layerIndex]
		const response = await fetch(url)
		if (!response.ok) {
			console.warn(`Layer ${layerIndex + 1} not found: ${url}`)
			return
		}

		const bricks = await response.json()
		layersData.value[layerIndex] = bricks // 存储数据

		console.log(
			`Loading layer ${layerIndex + 1} with ${bricks.length} bricks from ${url}`,
		)

		// 使用InstancedMesh渲染
		renderBrickLayer(layerIndex, bricks)

		// 更新统计信息
		layerRenderStats.value.totalBricks = layersData.value.reduce(
			(sum, layer) => sum + (layer?.length || 0),
			0
		)

	} catch (error) {
		console.error(`Error loading layer ${layerIndex + 1}:`, error)
	} finally {
		layerLoadingStates.value[layerIndex] = false
	}
}

// 新增：批量层管理功能
function loadMultipleLayers(startIndex: number, endIndex: number) {
	const promises = []
	for (let i = startIndex; i <= endIndex && i < maxLayers; i++) {
		if (!layersData.value[i] && !layerLoadingStates.value[i]) {
			promises.push(loadLayerData(i))
		}
	}
	return Promise.all(promises)
}

// 新增：智能层预加载
function preloadAdjacentLayers(currentIndex: number) {
	const preloadRange = 2 // 预加载前后2层
	const startIndex = Math.max(0, currentIndex - preloadRange)
	const endIndex = Math.min(maxLayers - 1, currentIndex + preloadRange)

	loadMultipleLayers(startIndex, endIndex)
}

// 全选/取消全选
function selectAll() {
	visibleLayers.value = visibleLayers.value.map(() => true)

	// 加载所有未加载的层
	visibleLayers.value.forEach((visible, index) => {
		if (visible && !layersData.value[index]) {
			loadLayerData(index)
		}
	})
}

function deselectAll() {
	visibleLayers.value = visibleLayers.value.map(() => false)
}

// 新增：设置全局朝向
function setGlobalOrientation(orientation: BrickOrientation) {
	globalOrientation.value = orientation
	console.log(`Setting global orientation to:`, orientation)

	// 重新渲染所有可见层
	visibleLayers.value.forEach((visible, index) => {
		if (visible && layersData.value[index]) {
			renderBrickLayer(index, layersData.value[index])
		}
	})
}

// 新增：设置全局旋转
function setGlobalRotation(axis: RotationAxis, angle: number) {
	switch (axis) {
		case RotationAxis.X:
			globalRotationX.value = angle
			break
		case RotationAxis.Y:
			globalRotationY.value = angle
			break
		case RotationAxis.Z:
			globalRotationZ.value = angle
			break
	}

	console.log(`Setting global rotation ${axis} to:`, angle)

	// 重新渲染所有可见层
	visibleLayers.value.forEach((visible, index) => {
		if (visible && layersData.value[index]) {
			renderBrickLayer(index, layersData.value[index])
		}
	})
}

// 新增：重置朝向和旋转
function resetOrientation() {
	globalOrientation.value = BrickOrientation.EAST
	globalRotationX.value = 0
	globalRotationY.value = 0
	globalRotationZ.value = 0

	console.log('Reset orientation and rotation')

	// 重新渲染所有可见层
	visibleLayers.value.forEach((visible, index) => {
		if (visible && layersData.value[index]) {
			renderBrickLayer(index, layersData.value[index])
		}
	})
}

// 清理资源
onUnmounted(() => {
	// 移除事件监听
	window.removeEventListener('resize', handleResize)

	// 清理InstancedMesh
	layerInstancedMeshes.forEach((mesh) => {
		mesh.geometry.dispose()
		if (mesh.material instanceof THREE.Material) {
			mesh.material.dispose()
		}
	})
	layerInstancedMeshes.clear()

	// 清理旧的缓存（如果存在）
	instancedMeshes.forEach((mesh) => {
		mesh.geometry.dispose()
		if (mesh.material instanceof THREE.Material) {
			mesh.material.dispose()
		}
	})
	instancedMeshes.clear()

	if (renderer) {
		renderer.dispose()
	}
	if (controls) {
		controls.dispose()
	}
})
</script>

<style scoped>
.brick-viewer {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
