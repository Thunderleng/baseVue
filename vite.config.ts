import Tov from './presets'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [Tov()],
	optimizeDeps: {
		include: ['three', '@tresjs/core'],
	},
})
