<template>
	<div class="brick-editor">
		<!-- 工具栏 -->
		<!-- <BrickToolbar /> -->
		
		<!-- 主画布 -->
		<BrickCanvas />
	</div>
</template>

<script setup lang="ts">
import BrickCanvas from '@/components/BrickCanvas.vue'
</script>

<style scoped>
.brick-editor {
	display: flex;
	width: 100vw;
	height: 100vh;
	overflow: hidden;
}
</style> 