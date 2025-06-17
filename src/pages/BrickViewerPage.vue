<template>
	<div class="brick-viewer-page">
		<div
			class="header from-blue-600 to-purple-600 bg-gradient-to-r p-6 text-white"
		>
			<div class="mx-auto max-w-7xl">
				<h1 class="mb-2 text-3xl font-bold">🧱 3D 积木模型展示器</h1>
				<p class="text-blue-100">
					基于 Vue3 + Three.js + Tres.js 构建的高性能 3D 可视化项目
				</p>
			</div>
		</div>

		<div class="content">
			<BrickViewer />
		</div>

		<div class="footer bg-gray-100 p-4 text-center text-gray-600">
			<p>支持多层积木展示、动态数据加载、3D 交互控制</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import BrickViewer from '@/components/BrickViewer.vue'
</script>

<style scoped>
.brick-viewer-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
}

.header {
	flex-shrink: 0;
}

.content {
	flex: 1;
	overflow: hidden;
}

.footer {
	flex-shrink: 0;
}
</style>
