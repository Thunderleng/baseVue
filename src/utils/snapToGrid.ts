import * as THREE from 'three'

/**
 * 网格对齐工具函数
 */

/**
 * 将坐标对齐到网格
 * @param position 原始坐标
 * @param gridSize 网格大小
 * @returns 对齐后的坐标
 */
export function snapToGrid(position: [number, number, number], gridSize: number = 1): [number, number, number] {
	return [
		Math.round(position[0] / gridSize) * gridSize,
		Math.round(position[1] / gridSize) * gridSize,
		Math.round(position[2] / gridSize) * gridSize,
	]
}

/**
 * 将坐标对齐到网格中心（考虑积木尺寸）
 * @param position 原始坐标
 * @param gridSize 网格大小
 * @param brickSize 积木尺寸 [width, length]
 * @returns 对齐后的坐标（积木中心）
 */
export function snapToGridCenter(
	position: [number, number, number], 
	gridSize: number = 1,
	brickSize: [number, number] = [1, 1]
): [number, number, number] {
	const [width, length] = brickSize
	
	// 计算积木的偏移量（使积木中心对齐到网格中心）
	const offsetX = (width - 1) * gridSize / 2
	const offsetZ = (length - 1) * gridSize / 2
	
	const snapped = snapToGrid(position, gridSize)
	
	return [
		snapped[0] + offsetX,
		snapped[1],
		snapped[2] + offsetZ,
	]
}

/**
 * 检查位置是否在网格上
 * @param position 坐标
 * @param gridSize 网格大小
 * @returns 是否对齐
 */
export function isOnGrid(position: [number, number, number], gridSize: number = 1): boolean {
	const snapped = snapToGrid(position, gridSize)
	return (
		Math.abs(position[0] - snapped[0]) < 0.01 &&
		Math.abs(position[1] - snapped[1]) < 0.01 &&
		Math.abs(position[2] - snapped[2]) < 0.01
	)
}

/**
 * 获取鼠标在3D空间中的位置（对齐到网格）
 * 参照Three.js voxel painter示例实现
 * @param mouseX 鼠标X坐标
 * @param mouseY 鼠标Y坐标
 * @param camera 相机
 * @param renderer 渲染器
 * @param gridSize 网格大小
 * @param objects 可交互的对象数组
 * @returns 对齐后的3D坐标
 */
export function getMousePositionOnGrid(
	mouseX: number,
	mouseY: number,
	camera: THREE.Camera,
	renderer: THREE.WebGLRenderer,
	gridSize: number = 1,
	objects: THREE.Object3D[] = []
): [number, number, number] | null {
	// 计算鼠标在画布中的相对位置
	const rect = renderer.domElement.getBoundingClientRect()
	const x = ((mouseX - rect.left) / rect.width) * 2 - 1
	const y = -((mouseY - rect.top) / rect.height) * 2 + 1
	
	// 创建射线
	const pointer = new THREE.Vector2(x, y)
	const raycaster = new THREE.Raycaster()
	raycaster.setFromCamera(pointer, camera)
	
	// 如果没有提供对象，使用地面平面
	if (objects.length === 0) {
		const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
		const intersectionPoint = new THREE.Vector3()
		
		if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
			// 对齐到网格中心
			const snapped = snapToGrid([intersectionPoint.x, intersectionPoint.y, intersectionPoint.z], gridSize)
			return [
				snapped[0] + gridSize / 2,
				snapped[1],
				snapped[2] + gridSize / 2
			]
		}
		return null
	}
	
	// 使用射线检测对象
	const intersects = raycaster.intersectObjects(objects, false)
	
	if (intersects.length > 0) {
		const intersect = intersects[0]
		
		// 计算网格对齐的位置
		const point = intersect.point.clone()
		const normal = intersect.face?.normal || new THREE.Vector3(0, 1, 0)
		
		// 添加法向量偏移（在面上方放置）
		point.add(normal.clone().multiplyScalar(gridSize / 2))
		
		// 对齐到网格
		const snapped = snapToGrid([point.x, point.y, point.z], gridSize)
		return [
			snapped[0] + gridSize / 2,
			snapped[1],
			snapped[2] + gridSize / 2
		]
	}
	
	return null
}

/**
 * 获取积木的边界框
 * @param position 积木位置（中心点）
 * @param size 积木尺寸 [width, length]
 * @param height 积木高度
 * @returns 边界框 {min, max}
 */
export function getBrickBoundingBox(
	position: [number, number, number],
	size: [number, number],
	height: number = 1
) {
	const [x, y, z] = position
	const [width, length] = size
	
	// 从中心点计算边界
	const halfWidth = width / 2
	const halfLength = length / 2
	
	return {
		min: [x - halfWidth, y, z - halfLength],
		max: [x + halfWidth, y + height, z + halfLength],
	}
}

/**
 * 检查两个积木是否重叠
 * @param brick1 积木1的位置和尺寸
 * @param brick2 积木2的位置和尺寸
 * @returns 是否重叠
 */
export function checkBrickOverlap(
	brick1: { position: [number, number, number]; size: [number, number] },
	brick2: { position: [number, number, number]; size: [number, number] }
): boolean {
	const box1 = getBrickBoundingBox(brick1.position, brick1.size)
	const box2 = getBrickBoundingBox(brick2.position, brick2.size)
	
	return !(
		box1.max[0] <= box2.min[0] ||
		box1.min[0] >= box2.max[0] ||
		box1.max[1] <= box2.min[1] ||
		box1.min[1] >= box2.max[1] ||
		box1.max[2] <= box2.min[2] ||
		box1.min[2] >= box2.max[2]
	)
}

/**
 * 检查位置是否被积木占用（考虑积木尺寸）
 * @param position 要检查的位置
 * @param bricks 所有积木列表
 * @param currentBrickSize 当前积木尺寸
 * @returns 是否被占用
 */
export function isPositionOccupiedByBricks(
	position: [number, number, number],
	bricks: Array<{ position: [number, number, number]; size: [number, number] }>,
	currentBrickSize: [number, number] = [1, 1]
): boolean {
	const currentBrick = { position, size: currentBrickSize }
	
	return bricks.some(brick => checkBrickOverlap(currentBrick, brick))
} 