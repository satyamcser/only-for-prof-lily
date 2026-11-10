import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * GitHub Pages serves a project repo at https://USER.github.io/<repo>/,
 * so the app must be built with base "/<repo>/". A user/organisation site
 * (<user>.github.io) or a custom domain is served from "/".
 */
function basePath(repoName: string): string {
  const name = repoName.trim().replace(/^\/+|\/+$/g, '')
  if (!name || name.toLowerCase().endsWith('.github.io')) return '/'
  return `/${name}/`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const explicitBase = env.VITE_BASE_PATH?.trim()
  return {
    base: explicitBase || basePath(env.VITE_GITHUB_REPO_NAME ?? 'only-for-prof-lily'),
    plugins: [react()],
    build: { target: 'es2022', sourcemap: false },
  }
})
