<template>
	<div class="brick-component">
		<!-- 这个组件主要用于类型定义，实际渲染在BrickCanvas中处理 -->
	</div>
</template>

<script setup lang="ts">
import type { BrickItem } from '@/stores/brickEditorStore'

interface Props {
	brick: BrickItem
	isSelected?: boolean
}

defineProps<Props>()
</script>

<style scoped>
.brick-component {
	/* 这个组件主要用于类型定义，实际渲染在BrickCanvas中处理 */
}
</style> 