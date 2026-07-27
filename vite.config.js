import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// Library build. React (and its JSX runtime) stay external so each consuming app
// supplies its own — the apps span React 18.2 through 19.2 and must not end up
// with a second copy of React in the bundle.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.js'),
      name: 'ApPimsSharedUI',
      formats: ['es'],
      fileName: () => 'ap-pims-shared-ui.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    // dist/ is committed so `npm i github:...` needs no install-time build step.
    emptyOutDir: true,
    minify: false,
  },
})
