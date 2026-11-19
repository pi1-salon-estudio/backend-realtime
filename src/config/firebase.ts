import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Igual que en backend-api: applicationDefault() busca la llave en GOOGLE_APPLICATION_CREDENTIALS.
// En local apunta a C:\secrets\... y en Render al Secret File /etc/secrets/firebase-admin.json.
// Este servicio solo usa Auth para verificar el ID token; no lee ni escribe Firestore.
const app = getApps()[0] ?? initializeApp({ credential: applicationDefault() })

export const auth = getAuth(app)
