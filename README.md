# Question anonyme

Application simple de questions anonymes avec React + Vite + Express.

## Lancer localement

```bash
npm install
npm run dev
```

Le frontend est servi sur :

```text
http://localhost:5173
```

Le backend est servi sur :

```text
http://localhost:3001
```

## Déploiement

### Backend (Render / Railway / VPS)

- Déployer le dossier racine
- Exécuter :

```bash
npm install
npm start
```

Le serveur écoute sur `PORT` si défini, sinon sur `3001`.

### Frontend (Vercel)

Dans les variables d’environnement Vercel, ajouter :

```env
VITE_API_URL=https://ton-backend-url/api
```

### Route pour récupérer les messages

Le backend expose :

```text
GET /api/messages
```

Cette route lit directement le fichier `server/messages.txt`.

## Structure

- `src/` : frontend React
- `server/server.js` : backend Express
- `server/messages.txt` : stockage des questions

