import { defineConfig } from 'bumpp'

export default defineConfig({
  files: [
    'package.json',
    'package-lock.json',
    'src-tauri/tauri.conf.json',
    'src-tauri/Cargo.toml',
    'src-tauri/Cargo.lock'
  ],
  all: true,
  execute: 'npm run release:before-commit'
})
