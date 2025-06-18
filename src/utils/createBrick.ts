import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { BrickItem } from '@/stores/brickEditorStore'

/**
 * 积木工厂方法
 */

// 积木几何体缓存
const geometryCache = new Map<string, THREE.BufferGeometry>()

/**
 * 创建积木几何体
 * @param size 积木尺寸 [width, length]
 * @returns 积木几何体
 */
export function createBrickGeometry(size: [number, number]): THREE.BufferGeometry {
	const [width, length] = size
	const cacheKey = `${width}x${length}`
	
	if (geometryCache.has(cacheKey)) {
		return geometryCache.get(cacheKey)!.clone()
	}
	
	// 创建底部立方体几何体（以中心为原点）
	const boxGeometry = new THREE.BoxGeometry(width, 1, length)
	
	// 创建顶部圆柱体几何体（凸点）
	const cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8)
	cylinderGeometry.translate(0, 0.55, 0) // 将圆柱体移到立方体顶部
	
	// 合并几何体
	const mergedGeometry = mergeGeometries([
		boxGeometry,
		cylinderGeometry,
	])
	
	// 缓存几何体
	geometryCache.set(cacheKey, mergedGeometry)
	
	return mergedGeometry.clone()
}

/**
 * 创建积木材质
 * @param color 颜色
 * @returns 积木材质
 */
export function createBrickMaterial(color: string): THREE.Material {
	return new THREE.MeshLambertMaterial({
		color: new THREE.Color(color),
		transparent: true,
		opacity: 0.9,
	})
}

/**
 * 创建积木网格
 * @param brick 积木数据
 * @returns 积木网格
 */
export function createBrickMesh(brick: BrickItem): THREE.Mesh {
	const geometry = createBrickGeometry(brick.size)
	const material = createBrickMaterial(brick.color)
	const mesh = new THREE.Mesh(geometry, material)
	
	// 设置位置
	mesh.position.set(brick.position[0], brick.position[1], brick.position[2])
	
	// 设置旋转
	mesh.rotation.y = THREE.MathUtils.degToRad(brick.rotation)
	
	// 添加用户数据
	mesh.userData = {
		brickId: brick.id,
		brickData: brick,
	}
	
	return mesh
}

/**
 * 创建选中状态的积木网格（高亮边框）
 * @param brick 积木数据
 * @returns 选中状态的积木网格
 */
export function createSelectedBrickMesh(brick: BrickItem): THREE.Group {
	const group = new THREE.Group()
	
	// 添加原始积木
	const originalMesh = createBrickMesh(brick)
	group.add(originalMesh)
	
	// 添加高亮边框
	const [width, length] = brick.size
	const outlineGeometry = new THREE.BoxGeometry(width + 0.1, 1.1, length + 0.1)
	const outlineMaterial = new THREE.MeshBasicMaterial({
		color: 0xffff00,
		wireframe: true,
		transparent: true,
		opacity: 0.8,
	})
	const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial)
	outlineMesh.position.set(brick.position[0], brick.position[1], brick.position[2])
	outlineMesh.rotation.y = THREE.MathUtils.degToRad(brick.rotation)
	
	group.add(outlineMesh)
	
	return group
}

/**
 * 创建积木实例化网格（用于批量渲染）
 * @param bricks 积木列表
 * @returns 实例化网格
 */
export function createInstancedBrickMesh(bricks: BrickItem[]): THREE.InstancedMesh | null {
	if (bricks.length === 0) return null
	
	// 按尺寸分组
	const sizeGroups = new Map<string, BrickItem[]>()
	bricks.forEach(brick => {
		const key = `${brick.size[0]}x${brick.size[1]}`
		if (!sizeGroups.has(key)) {
			sizeGroups.set(key, [])
		}
		sizeGroups.get(key)!.push(brick)
	})
	
	// 为每种尺寸创建实例化网格
	const meshes: THREE.InstancedMesh[] = []
	
	sizeGroups.forEach((bricksInGroup) => {
		const [width, length] = bricksInGroup[0].size
		const geometry = createBrickGeometry([width, length])
		
		// 创建实例化网格
		const instancedMesh = new THREE.InstancedMesh(geometry, undefined, bricksInGroup.length)
		
		// 设置每个实例的变换矩阵
		bricksInGroup.forEach((brick, index) => {
			const matrix = new THREE.Matrix4()
			
			// 创建变换矩阵
			const position = new THREE.Vector3(brick.position[0], brick.position[1], brick.position[2])
			const rotation = new THREE.Euler(0, THREE.MathUtils.degToRad(brick.rotation), 0)
			const scale = new THREE.Vector3(1, 1, 1)
			
			matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
			instancedMesh.setMatrixAt(index, matrix)
			
			// 设置颜色
			const color = new THREE.Color(brick.color)
			instancedMesh.setColorAt(index, color)
		})
		
		meshes.push(instancedMesh)
	})
	
	// 如果有多个尺寸，返回一个组
	if (meshes.length === 1) {
		return meshes[0]
	} else {
		const group = new THREE.Group()
		meshes.forEach(mesh => group.add(mesh))
		return group as any // 类型转换，实际返回Group
	}
} 