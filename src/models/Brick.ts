export interface BrickData {
	center: [number, number, number]
	shape: [number, number]
	size: number
	thickness: number
	circle_radius: number
	cylinder_thickness: number
	color: [number, number, number]
}

export class Brick {
	type: string
	position: [number, number, number]
	rotation: [number, number, number]
	color: [number, number, number]
	size: number
	thickness: number
	shape: [number, number]

	constructor(data: BrickData) {
		this.type = this.determineType(data)
		this.position = data.center
		this.rotation = [0, 0, 0]
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

	getMeshData() {
		return {
			type: this.type,
			position: this.position,
			rotation: this.rotation,
			color: this.color,
			size: this.size,
			thickness: this.thickness,
			shape: this.shape,
		}
	}
}
