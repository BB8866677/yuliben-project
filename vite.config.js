import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Actions calculates this automatically from your GitHub repository name.
// When running locally (npm run dev), it remains '/'.
const base = process.env.GITHUB_PAGES_BASE || '/';
export default defineConfig({ plugins: [react()], base, server: { open: true } });
