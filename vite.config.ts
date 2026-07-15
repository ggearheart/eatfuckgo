import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deployed under https://ggearheart.github.io/eatfuckgo/
export default defineConfig({
  base: '/eatfuckgo/',
  plugins: [react()],
});
