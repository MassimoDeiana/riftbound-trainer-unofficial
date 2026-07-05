import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Dev-only "coach bridge": the app POSTs the current game state to /__coach on
 * every change; we keep the latest in memory and mirror it to .coach-state.json
 * so Claude Code can read the live board from the terminal on demand.
 */
function coachBridge(): Plugin {
  let latest = '{"state":null}'
  const file = resolve(process.cwd(), '.coach-state.json')
  return {
    name: 'coach-bridge',
    configureServer(server) {
      server.middlewares.use('/__coach', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', (c) => (body += c))
          req.on('end', () => {
            latest = body || latest
            try {
              writeFileSync(file, latest)
            } catch {
              /* ignore */
            }
            res.statusCode = 204
            res.end()
          })
        } else {
          res.setHeader('content-type', 'application/json')
          res.end(latest)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), coachBridge()],
})
