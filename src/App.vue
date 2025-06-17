<template>
	<div class="app">
		<header class="border-b bg-white shadow-sm">
			<div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
				<div class="flex items-center justify-between py-4">
					<h1 class="text-2xl text-gray-900 font-bold">🧱 3D 积木模型展示器</h1>
					<div class="text-sm text-gray-500">
						基于 Vue3 + Three.js + Tres.js
					</div>
				</div>
			</div>
		</header>

		<main class="flex-1">
			<BrickViewer />
		</main>
	</div>
</template>

<script setup lang="ts">
import BrickViewer from '@/components/BrickViewer.vue'
</script>

<style>
/* a {
	color: rgba(37, 99, 235);
} */

p {
	padding: 0 10px;
}

html,
body {
	margin: 0;
	padding: 0;
	height: 100%;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app {
	display: flex;
	flex-direction: column;
	height: 100vh;
}

main {
	flex: 1;
	overflow: hidden;
}
</style>
