<template>
	<div class="brick-viewer relative h-full w-full">
		<!-- 3D 场景容器 -->
		<div ref="containerRef" class="h-full w-full"></div>

		<!-- 控制面板 -->
		<LayerControls
			:current-layer="currentLayer"
			:max-layers="maxLayers"
			:visible-layers="visibleLayers"
			:is-loading="isLoading"
			@prev-layer="prevLayer"
			@next-layer="nextLayer"
			@toggle-layer="toggleLayer"
			@select-all="selectAll"
			@deselect-all="deselectAll"
			@reset-view="resetView"
			@fit-view="fitCameraToScene"
			@update-render-layers="updateRenderLayers"
		/>

		<!-- 错误提示 -->
		<div
			v-if="error"
			class="absolute right-4 top-4 rounded-lg bg-red-500 px-4 py-2 text-white shadow-lg"
		>
			{{ error }}
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useLayerLoader } from '@/composables/useLayerLoader'
import LayerControls from './LayerControls.vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'

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

// 使用层加载器
const { isLoading, error } = useLayerLoader()

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

	// 添加小的间隙来增强分割效果
	const gap = 0.001 // 1mm的间隙

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

// 创建或获取InstancedMesh
function getOrCreateInstancedMesh(
	brickType: BrickType,
	brickData: any,
): THREE.InstancedMesh {
	const key = getBrickTypeKey(brickData)

	if (!instancedMeshes.has(key)) {
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

		instancedMeshes.set(key, instancedMesh)
	}

	return instancedMeshes.get(key)!
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

// 渲染积木层（使用InstancedMesh）
function renderBrickLayer(layerIndex: number, bricks: any[]) {
	if (!layerGroups[layerIndex]) return

	// 清空当前层
	layerGroups[layerIndex].clear()

	// 按类型分组积木
	const bricksByType = new Map<string, any[]>()

	bricks.forEach((brickData) => {
		const key = getBrickTypeKey(brickData)
		if (!bricksByType.has(key)) {
			bricksByType.set(key, [])
		}
		bricksByType.get(key)!.push(brickData)
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
		const instancedMesh = getOrCreateInstancedMesh(brickType, firstBrick)

		// 设置实例矩阵
		bricksOfType.forEach((brickData, index) => {
			const matrix = new THREE.Matrix4()

			// 坐标系转换：JSON [x, y, z] -> Three.js [x, z, y]
			const x = brickData.center[0]
			const y = brickData.center[2] // JSON的z轴映射到Three.js的y轴
			const z = brickData.center[1] // JSON的y轴映射到Three.js的z轴

			// 设置位置
			matrix.setPosition(x, y, z)

			// 调试信息（只显示前几个积木）
			if (index < 3) {
				console.log(
					`Brick ${index}: JSON [${brickData.center.join(', ')}] -> Three.js [${x}, ${y}, ${z}]`,
				)
			}

			// 设置旋转（Y轴旋转90度）
			const rotationMatrix = new THREE.Matrix4()
			rotationMatrix.makeRotationY(Math.PI / 2)
			matrix.multiply(rotationMatrix)

			instancedMesh.setMatrixAt(index, matrix)
		})

		// 更新实例计数
		instancedMesh.count = bricksOfType.length
		instancedMesh.instanceMatrix.needsUpdate = true

		// 添加到层组
		layerGroups[layerIndex].add(instancedMesh)
	})

	console.log(
		`Rendered layer ${layerIndex + 1} with ${bricks.length} bricks using InstancedMesh`,
	)
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

// 更新层可见性
function updateLayerVisibility() {
	visibleLayers.value.forEach((visible, index) => {
		if (layerGroups[index]) {
			layerGroups[index].visible = visible
		}
		if (visible) {
			if (layersData.value[index]) {
				// 已有数据，直接渲染
				renderBrickLayer(index, layersData.value[index])
			} else {
				// 没有数据，先加载
				loadLayerData(index)
			}
		}
	})
	// 不再自动调整视角
	// fitCameraToScene()
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
	// 默认显示第一层
	visibleLayers.value[0] = true
	initThreeJS()
	loadCurrentLayer()

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

// 层导航
function prevLayer() {
	if (currentLayer.value > 0) {
		currentLayer.value--
		// 同步visibleLayers，前N层为true
		for (let i = 0; i < maxLayers; i++) {
			visibleLayers.value[i] = i <= currentLayer.value
		}
	}
}

function nextLayer() {
	if (currentLayer.value < maxLayers - 1) {
		currentLayer.value++
		// 同步visibleLayers，前N层为true
		for (let i = 0; i < maxLayers; i++) {
			visibleLayers.value[i] = i <= currentLayer.value
		}
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

// 加载指定层的数据
async function loadLayerData(layerIndex: number) {
	if (layerIndex < 0 || layerIndex >= maxLayers) return

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

		// 不再自动调整视角
		// nextTick(() => {
		//   fitCameraToScene()
		// })
	} catch (error) {
		console.error(`Error loading layer ${layerIndex + 1}:`, error)
	}
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

// 清理资源
onUnmounted(() => {
	// 移除事件监听
	window.removeEventListener('resize', handleResize)

	// 清理InstancedMesh
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
