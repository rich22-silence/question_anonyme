import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const messagesPath = path.join(__dirname, 'messages.txt')

const app = express()
const PORT = 3001

if (!fs.existsSync(messagesPath)) {
  fs.writeFileSync(messagesPath, '', 'utf8')
}

app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.get('/api/messages', (req, res) => {
  try {
    const content = fs.readFileSync(messagesPath, 'utf8')
    res.type('text/plain').send(content)
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier :', error)
    res.status(500).json({ message: 'Impossible de lire les messages.' })
  }
})

app.post('/api/questions', (req, res) => {
  const { question } = req.body || {}

  if (typeof question !== 'string') {
    return res.status(400).json({ message: 'Question invalide.' })
  }

  const cleanQuestion = question.trim()

  if (!cleanQuestion) {
    return res.status(400).json({ message: 'La question ne peut pas être vide.' })
  }

  if (cleanQuestion.length > 1000) {
    return res.status(400).json({ message: 'La question ne doit pas dépasser 1000 caractères.' })
  }

  const now = new Date()
  const formattedDate = now
    .toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', '')

  const entry = `---\nDate : ${formattedDate}\nQuestion : ${cleanQuestion}\n\n---\n\n`

  try {
    fs.appendFileSync(messagesPath, entry, 'utf8')
    console.log('Question enregistrée dans messages.txt')
    return res.status(201).json({ message: 'Question envoyée avec succès ✅' })
  } catch (error) {
    console.error('Erreur lors de l’écriture dans le fichier :', error)
    return res.status(500).json({ message: 'Erreur lors de l’enregistrement.' })
  }
})

app.listen(PORT, () => {
  console.log(`Backend actif sur http://localhost:${PORT}`)
})
