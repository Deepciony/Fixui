import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
            // ส่ง request ที่ขึ้นต้นด้วย /api ไปยัง Backend
			'/api': {
				target: 'http://158.108.102.14:8001',
				changeOrigin: true,
                secure: false,
			},
            // ส่ง request ที่ขอรูปภาพ (/uploads) ไปยัง Backend
            '/uploads': {
                target: 'http://158.108.102.14:8001',
                changeOrigin: true,
                secure: false,
            }
		}
	}
});