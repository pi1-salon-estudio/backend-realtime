import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Igual que en backend-api: applicationDefault() busca la llave en GOOGLE_APPLICATION_CREDENTIALS.
// En local apunta a C:\secrets\... y en Render al Secret File /etc/secrets/firebase-admin.json.
const app = getApps()[0] ?? initializeApp({ credential: applicationDefault() })

export const auth = getAuth(app)
export const db = getFirestore(app)
