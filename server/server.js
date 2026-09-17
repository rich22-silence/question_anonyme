import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { put, get } from '@vercel/blob'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const messagesPath = path.join(__dirname, 'messages.txt')

const app = express()
const PORT = process.env.PORT || 3001

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

app.get('/api/messages/download', (req, res) => {
  try {
    // Force download of the messages.txt file
    res.download(messagesPath, 'messages.txt', (err) => {
      if (err) {
        console.error('Erreur lors du téléchargement du fichier :', err)
        if (!res.headersSent) {
          res.status(500).json({ message: "Impossible de télécharger les messages." })
        }
      }
    })
  } catch (error) {
    console.error('Erreur lors de la préparation du téléchargement :', error)
    res.status(500).json({ message: 'Erreur serveur.' })
  }
})

app.post('/api/avatar/upload', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
  try {
    const filename = req.query.filename || req.headers['x-filename']
    if (!filename) {
      return res.status(400).json({ message: 'Missing filename' })
    }

    const result = await put(filename, req.body, { access: 'private' })

    return res.status(200).json(result)
  } catch (error) {
    console.error('Erreur lors de l’envoi du blob :', error)
    return res.status(500).json({ message: 'Erreur lors de l’envoi du fichier.' })
  }
})

app.get('/api/avatar/view', async (req, res) => {
  try {
    const pathname = req.query.pathname
    if (!pathname) return res.status(400).json({ error: 'Missing pathname' })

    const result = await get(pathname, { access: 'private' })
    if (result?.statusCode !== 200) {
      return res.status(404).send('Not found')
    }

    const contentType = result.blob?.contentType || 'application/octet-stream'
    res.setHeader('Content-Type', contentType)
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // result.stream may be a Node ReadableStream or a web ReadableStream
    const stream = result.stream
    if (!stream) {
      return res.status(500).json({ message: 'No stream available' })
    }

    if (typeof stream.pipe === 'function') {
      stream.pipe(res)
    } else if (typeof stream.getReader === 'function') {
      // convert web ReadableStream to async iterable and pipe
      const { Readable } = await import('stream')
      const nodeStream = Readable.from(stream)
      nodeStream.pipe(res)
    } else {
      // fallback: send as-is
      res.send(stream)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du blob :', error)
    return res.status(500).json({ message: 'Erreur lors de la récupération du fichier.' })
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
