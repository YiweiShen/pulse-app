import { defineConfig } from 'bumpp'

export default defineConfig({
  files: [
    'package.json',
    'package-lock.json',
    'src-tauri/tauri.conf.json',
    'src-tauri/Cargo.toml'
  ],
  commit: true,
  tag: true,
  push: true
})
