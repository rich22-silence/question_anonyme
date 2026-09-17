import { get, put } from '@vercel/blob'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()

  const filename = 'messages/messages.txt'

  try {
    if (req.method === 'GET') {
      const download = req.query?.download === '1' || req.query?.download === 'true'

      const result = await get(filename, { access: 'private' })
      if (result?.statusCode !== 200) {
        return res.status(404).json({ error: 'Not found' })
      }

      const text = await streamToString(result.stream)

      if (download) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.setHeader('Content-Disposition', 'attachment; filename="messages.txt"')
        return res.status(200).send(text)
      }

      // Default: return JSON to avoid client-side JSON parse errors
      return res.status(200).json({ content: text })
    }

    if (req.method === 'POST') {
      const { question } = req.body || {}
      if (typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ message: 'Invalid question' })
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

      const entry = `---\nDate : ${formattedDate}\nQuestion : ${question.trim()}\n\n---\n\n`

      // Try to read existing messages (file may not exist yet)
      let existing = ''
      try {
        const r = await get(filename, { access: 'private' })
        if (r?.statusCode === 200) existing = await streamToString(r.stream)
      } catch (e) {
        existing = ''
      }

      const newContent = existing + entry
      await put(filename, newContent, { access: 'private', contentType: 'text/plain; charset=utf-8' })

      return res.status(201).json({ message: 'Question enregistrée' })
    }

    res.setHeader('Allow', 'GET,POST,OPTIONS')
    return res.status(405).end()
  } catch (err) {
    console.error('messages API error:', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

async function streamToString(stream) {
  if (!stream) return ''

  // Node Readable stream
  if (typeof stream.on === 'function' && typeof stream.pipe === 'function') {
    return new Promise((resolve, reject) => {
      let data = ''
      stream.setEncoding && stream.setEncoding('utf8')
      stream.on('data', (chunk) => (data += chunk))
      stream.on('end', () => resolve(data))
      stream.on('error', reject)
    })
  }

  // Web ReadableStream
  if (typeof stream.getReader === 'function') {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let result = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      result += decoder.decode(value, { stream: true })
    }
    return result
  }

  return String(stream)
}
