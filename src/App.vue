<template>
	<div class="app">
		<header class="border-b bg-white shadow-sm">
			<div class="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
				<div class="flex items-center justify-between py-4">
					<h1 class="text-2xl text-gray-900 font-bold">🧱 3D 积木模型展示器</h1>
					<div class="flex items-center gap-4">
						<nav class="flex items-center gap-2">
							<button
								class="nav-button"
								:class="{ active: currentView === 'viewer' }"
								@click="currentView = 'viewer'"
							>
								👁️ 展示器
							</button>
							<button
								class="nav-button"
								:class="{ active: currentView === 'editor' }"
								@click="currentView = 'editor'"
							>
								✏️ 编辑器
							</button>
						</nav>
						<div class="text-sm text-gray-500">
							基于 Vue3 + Three.js + Tres.js
						</div>
					</div>
				</div>
			</div>
		</header>

		<main class="flex-1">
			<BrickViewer v-if="currentView === 'viewer'" />
			<BrickEditor v-else-if="currentView === 'editor'" />
		</main>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BrickViewer from '@/components/BrickViewer.vue'
import BrickEditor from '@/views/BrickEditor.vue'

const currentView = ref<'viewer' | 'editor'>('viewer')
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

.nav-button {
	padding: 0.5rem 1rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	background: white;
	color: #374151;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
}

.nav-button:hover {
	background: #f9fafb;
	border-color: #9ca3af;
}

.nav-button.active {
	background: #3b82f6;
	border-color: #3b82f6;
	color: white;
}
</style>
