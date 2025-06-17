<template>
	<div class="brick-layer">
		<TresGroup v-if="bricks.length > 0">
			<template v-for="(brick, index) in bricks" :key="index">
				<!-- 立方体积木 -->
				<TresMesh
					v-if="brick.type === 'cube'"
					:position="brick.position"
					:rotation="brick.rotation"
				>
					<TresBoxGeometry :args="[brick.size, brick.size, brick.size]" />
					<TresMeshStandardMaterial
						:color="`rgb(${brick.color[0] * 255}, ${brick.color[1] * 255}, ${brick.color[2] * 255})`"
					/>
				</TresMesh>

				<!-- 板状积木 -->
				<TresMesh
					v-else-if="brick.type === 'plate'"
					:position="brick.position"
					:rotation="brick.rotation"
				>
					<TresBoxGeometry
						:args="[
							brick.size * brick.shape[0],
							brick.thickness,
							brick.size * brick.shape[1],
						]"
					/>
					<TresMeshStandardMaterial
						:color="`rgb(${brick.color[0] * 255}, ${brick.color[1] * 255}, ${brick.color[2] * 255})`"
					/>
				</TresMesh>

				<!-- 圆柱积木 -->
				<TresMesh
					v-else-if="brick.type === 'cylinder'"
					:position="brick.position"
					:rotation="brick.rotation"
				>
					<TresCylinderGeometry
						:args="[brick.size, brick.size, brick.thickness, 8]"
					/>
					<TresMeshStandardMaterial
						:color="`rgb(${brick.color[0] * 255}, ${brick.color[1] * 255}, ${brick.color[2] * 255})`"
					/>
				</TresMesh>
			</template>
		</TresGroup>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Brick } from '@/models/Brick'

interface Props {
	layerData: any[]
	visible: boolean
}

const props = defineProps<Props>()

const bricks = computed(() => {
	if (!props.visible || !props.layerData) return []

	return props.layerData.map((data: any) => {
		const brick = new Brick(data)
		return brick.getMeshData()
	})
})
</script>

<style scoped>
.brick-layer {
	width: 100%;
	height: 100%;
}
</style>
