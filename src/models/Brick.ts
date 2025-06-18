// 积木朝向枚举
export enum BrickOrientation {
	NORTH = 0,    // 北 (0度)
	EAST = 90,    // 东 (90度)
	SOUTH = 180,  // 南 (180度)
	WEST = 270,   // 西 (270度)
}

// 积木旋转轴枚举
export enum RotationAxis {
	X = 'x',
	Y = 'y',
	Z = 'z',
}

export interface BrickData {
	center: [number, number, number]
	shape: [number, number]
	size: number
	thickness: number
	circle_radius: number
	cylinder_thickness: number
	color: [number, number, number]
	orientation?: BrickOrientation // 新增：朝向
	rotationX?: number // 新增：X轴旋转角度
	rotationY?: number // 新增：Y轴旋转角度
	rotationZ?: number // 新增：Z轴旋转角度
}

export class Brick {
	type: string
	position: [number, number, number]
	rotation: [number, number, number]
	color: [number, number, number]
	size: number
	thickness: number
	shape: [number, number]
	orientation: BrickOrientation // 新增：朝向

	constructor(data: BrickData) {
		this.type = this.determineType(data)
		this.position = data.center
		this.orientation = data.orientation || BrickOrientation.EAST // 默认朝向改为东(90度)
		
		// 计算旋转角度
		this.rotation = this.calculateRotation(data)
		
		this.color = data.color
		this.size = data.size
		this.thickness = data.thickness
		this.shape = data.shape
	}

	private determineType(data: BrickData): string {
		// 根据数据特征判断积木类型
		if (data.circle_radius > 0) {
			return 'cylinder'
		} else if (data.shape[0] === 1 && data.shape[1] === 1) {
			return 'cube'
		} else {
			return 'plate'
		}
	}

	// 计算旋转角度
	private calculateRotation(data: BrickData): [number, number, number] {
		const rotationX = data.rotationX || 0
		const rotationY = data.rotationY || 0
		const rotationZ = data.rotationZ || 0
		
		// 基础旋转（Y轴旋转90度，适应坐标系）
		const baseRotationY = Math.PI / 2
		
		// 朝向旋转（Y轴）
		const orientationRotationY = (this.orientation * Math.PI) / 180
		
		return [
			rotationX * Math.PI / 180, // 转换为弧度
			baseRotationY + orientationRotationY + (rotationY * Math.PI / 180),
			rotationZ * Math.PI / 180
		]
	}

	// 设置朝向
	setOrientation(orientation: BrickOrientation): void {
		this.orientation = orientation
		this.rotation = this.calculateRotation({
			center: this.position,
			shape: this.shape,
			size: this.size,
			thickness: this.thickness,
			circle_radius: 0,
			cylinder_thickness: 0,
			color: this.color,
			orientation: this.orientation,
			rotationX: this.rotation[0] * 180 / Math.PI,
			rotationY: this.rotation[1] * 180 / Math.PI,
			rotationZ: this.rotation[2] * 180 / Math.PI,
		})
	}

	// 设置旋转角度
	setRotation(axis: RotationAxis, angle: number): void {
		const angleRad = angle * Math.PI / 180
		
		switch (axis) {
			case RotationAxis.X:
				this.rotation[0] = angleRad
				break
			case RotationAxis.Y:
				this.rotation[1] = angleRad
				break
			case RotationAxis.Z:
				this.rotation[2] = angleRad
				break
		}
	}

	// 获取朝向名称
	getOrientationName(): string {
		switch (this.orientation) {
			case BrickOrientation.NORTH:
				return '北'
			case BrickOrientation.EAST:
				return '东'
			case BrickOrientation.SOUTH:
				return '南'
			case BrickOrientation.WEST:
				return '西'
			default:
				return '未知'
		}
	}

	// 获取旋转角度（度）
	getRotationDegrees(): [number, number, number] {
		return [
			this.rotation[0] * 180 / Math.PI,
			this.rotation[1] * 180 / Math.PI,
			this.rotation[2] * 180 / Math.PI,
		]
	}

	getMeshData() {
		return {
			type: this.type,
			position: this.position,
			rotation: this.rotation,
			color: this.color,
			size: this.size,
			thickness: this.thickness,
			shape: this.shape,
			orientation: this.orientation,
		}
	}
}
