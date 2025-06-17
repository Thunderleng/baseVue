<template>
	<div class="brick-layer-optimized">
		<!-- 使用 InstancedMesh 进行批量渲染 -->
		<TresGroup v-if="hasVisibleBricks">
			<!-- 立方体积木实例 -->
			<TresInstancedMesh
				v-if="cubeInstances.length > 0"
				:ref="cubeMeshRef"
				:args="[null, null, cubeInstances.length]"
			>
				<TresBoxGeometry :args="[0.008, 0.008, 0.008]" />
				<TresMeshStandardMaterial :color="0xffffff" />
			</TresInstancedMesh>

			<!-- 板状积木实例 -->
			<TresInstancedMesh
				v-if="plateInstances.length > 0"
				:ref="plateMeshRef"
				:args="[null, null, plateInstances.length]"
			>
				<TresBoxGeometry :args="[0.008, 0.004, 0.008]" />
				<TresMeshStandardMaterial :color="0xffffff" />
			</TresInstancedMesh>

			<!-- 圆柱积木实例 -->
			<TresInstancedMesh
				v-if="cylinderInstances.length > 0"
				:ref="cylinderMeshRef"
				:args="[null, null, cylinderInstances.length]"
			>
				<TresCylinderGeometry :args="[0.004, 0.004, 0.008, 8]" />
				<TresMeshStandardMaterial :color="0xffffff" />
			</TresInstancedMesh>
		</TresGroup>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { Brick } from '@/models/Brick'
import * as THREE from 'three'

interface Props {
	layerData: any[]
	visible: boolean
}

const props = defineProps<Props>()

// 实例化网格引用
const cubeMeshRef = ref()
const plateMeshRef = ref()
const cylinderMeshRef = ref()

// 检查是否有可见的积木
const hasVisibleBricks = computed(() => {
	return props.visible && props.layerData && props.layerData.length > 0
})

// 按类型分组的积木实例
const cubeInstances = computed(() => {
	if (!props.visible || !props.layerData) return []
	return props.layerData
		.map((data: any) => new Brick(data))
		.filter((brick) => brick.type === 'cube')
})

const plateInstances = computed(() => {
	if (!props.visible || !props.layerData) return []
	return props.layerData
		.map((data: any) => new Brick(data))
		.filter((brick) => brick.type === 'plate')
})

const cylinderInstances = computed(() => {
	if (!props.visible || !props.layerData) return []
	return props.layerData
		.map((data: any) => new Brick(data))
		.filter((brick) => brick.type === 'cylinder')
})

// 更新实例化网格
function updateInstancedMesh() {
	// 更新立方体实例
	if (cubeMeshRef.value && cubeInstances.value.length > 0) {
		const mesh = cubeMeshRef.value
		const matrix = new THREE.Matrix4()

		cubeInstances.value.forEach((brick, index) => {
			matrix.setPosition(
				brick.position[0],
				brick.position[1],
				brick.position[2],
			)
			mesh.setMatrixAt(index, matrix)

			// 设置颜色
			const color = new THREE.Color(
				brick.color[0],
				brick.color[1],
				brick.color[2],
			)
			mesh.setColorAt(index, color)
		})

		mesh.instanceMatrix.needsUpdate = true
		if (mesh.instanceColor) {
			mesh.instanceColor.needsUpdate = true
		}
	}

	// 更新板状实例
	if (plateMeshRef.value && plateInstances.value.length > 0) {
		const mesh = plateMeshRef.value
		const matrix = new THREE.Matrix4()

		plateInstances.value.forEach((brick, index) => {
			matrix.setPosition(
				brick.position[0],
				brick.position[1],
				brick.position[2],
			)
			mesh.setMatrixAt(index, matrix)

			const color = new THREE.Color(
				brick.color[0],
				brick.color[1],
				brick.color[2],
			)
			mesh.setColorAt(index, color)
		})

		mesh.instanceMatrix.needsUpdate = true
		if (mesh.instanceColor) {
			mesh.instanceColor.needsUpdate = true
		}
	}

	// 更新圆柱实例
	if (cylinderMeshRef.value && cylinderInstances.value.length > 0) {
		const mesh = cylinderMeshRef.value
		const matrix = new THREE.Matrix4()

		cylinderInstances.value.forEach((brick, index) => {
			matrix.setPosition(
				brick.position[0],
				brick.position[1],
				brick.position[2],
			)
			mesh.setMatrixAt(index, matrix)

			const color = new THREE.Color(
				brick.color[0],
				brick.color[1],
				brick.color[2],
			)
			mesh.setColorAt(index, color)
		})

		mesh.instanceMatrix.needsUpdate = true
		if (mesh.instanceColor) {
			mesh.instanceColor.needsUpdate = true
		}
	}
}

// 监听数据变化
watch(
	[cubeInstances, plateInstances, cylinderInstances],
	() => {
		updateInstancedMesh()
	},
	{ deep: true },
)

// 组件挂载后初始化
onMounted(() => {
	updateInstancedMesh()
})
</script>

<style scoped>
.brick-layer-optimized {
	width: 100%;
	height: 100%;
}
</style>
