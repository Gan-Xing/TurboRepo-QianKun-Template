import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		port: 3004,
		cors: true,
		origin: 'http://localhost:3004'
	},
	plugins: [vue()]
});
