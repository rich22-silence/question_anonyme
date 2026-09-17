import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || '/api'

function App() {
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedQuestion = question.trim()

    if (!trimmedQuestion) {
      setStatus({ type: 'error', message: 'Écris ta question avant d’envoyer.' })
      return
    }

    if (trimmedQuestion.length > 1000) {
      setStatus({ type: 'error', message: 'La question ne doit pas dépasser 1000 caractères.' })
      return
    }

    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      const response = await fetch(`${API_URL}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: trimmedQuestion }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue.')
      }

      setStatus({ type: 'success', message: 'Question envoyée avec succès ✅' })
      setQuestion('')
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Une erreur est survenue.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page">
      <div className="card">
        <div className="topbar">
          <span className="badge">Anonyme</span>
        </div>

        <h1>Question anonyme</h1>
        <p className="subtitle">Pose ta question anonymement 👇</p>

        <form onSubmit={handleSubmit} className="form">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Écris ta question ici..."
            aria-label="Question anonyme"
            maxLength={1000}
          />

          <div className="meta">
            <span>{question.length}/1000</span>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>

        {status.message && (
          <p className={status.type === 'success' ? 'feedback success' : 'feedback error'}>
            {status.message}
          </p>
        )}
      </div>
    </main>
  )
}

export default App
