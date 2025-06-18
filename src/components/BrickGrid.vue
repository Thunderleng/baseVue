<template>
	<div class="brick-grid">
		<!-- 网格将在这里渲染 -->
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as THREE from 'three'

interface Props {
	size?: number
	divisions?: number
	color?: string
	opacity?: number
}

const props = withDefaults(defineProps<Props>(), {
	size: 20,
	divisions: 20,
	color: '#888888',
	opacity: 0.3,
})

const gridRef = ref<THREE.GridHelper | null>(null)

// 创建网格
function createGrid() {
	if (gridRef.value) {
		// 清理旧的网格
		gridRef.value.dispose()
	}
	
	gridRef.value = new THREE.GridHelper(
		props.size,
		props.divisions,
		new THREE.Color(props.color),
		new THREE.Color(props.color)
	)
	
	// 设置透明度
	if (gridRef.value.material instanceof THREE.Material) {
		gridRef.value.material.transparent = true
		gridRef.value.material.opacity = props.opacity
	}
	
	return gridRef.value
}

// 暴露网格引用
defineExpose({
	grid: gridRef,
	createGrid,
})
</script>

<style scoped>
.brick-grid {
	width: 100%;
	height: 100%;
}
</style> 