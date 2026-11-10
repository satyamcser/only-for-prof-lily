import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { loadBackend } from './lib/backend'
import { applyPrefs, loadPrefs } from './lib/prefs'
import { BootScreen } from './scenes/Gate'
import './styles/global.css'

applyPrefs(loadPrefs()) // theme/motion before first paint

const root = createRoot(document.getElementById('root')!)
root.render(<BootScreen />)

loadBackend()
  .then((backend) =>
    root.render(
      <StrictMode>
        <App backend={backend} />
      </StrictMode>,
    ),
  )
  .catch((err: unknown) => {
    console.error(err)
    root.render(<BootScreen text="DUBOT could not start. Please refresh the page." />)
  })
