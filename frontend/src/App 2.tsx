import { useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState<string>('Checking...')

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setStatus(`✅ Backend: ${data.status} - ${data.service}`)
    } catch (error) {
      setStatus('❌ Backend not connected')
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 MayanConnect</h1>
        <p>Architecture documentaire sécurisée avec IA</p>

        <div className="status-card">
          <h2>System Status</h2>
          <p>{status}</p>
          <button onClick={checkBackendHealth}>
            Check Backend Health
          </button>
        </div>

        <div className="info-card">
          <h3>📦 Services</h3>
          <ul>
            <li>✓ Frontend (React + Vite)</li>
            <li>✓ Backend (Node.js + Express)</li>
            <li>✓ Mayan EDMS</li>
            <li>✓ PostgreSQL x2</li>
            <li>✓ Redis</li>
            <li>✓ Ollama AI</li>
          </ul>
        </div>

        <div className="next-steps">
          <h3>🎯 Next Steps</h3>
          <ol>
            <li>Implement authentication system</li>
            <li>Build document management UI</li>
            <li>Integrate AI analysis</li>
            <li>Add temporary access control</li>
            <li>(BONUS) Implement SSO</li>
          </ol>
        </div>
      </header>
    </div>
  )
}

export default App
