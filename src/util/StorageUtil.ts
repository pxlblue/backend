import { Storage } from '@google-cloud/storage'
import { config } from 'dotenv'
config()
const storage = new Storage({
  projectId: process.env.STORAGE_PROJECT,
  credentials: {
    client_email: process.env.STORAGE_EMAIL,
    private_key: process.env.STORAGE_KEY!.replace(/\\n/gi, '\n'),
  },
})

const bucket = storage.bucket(process.env.STORAGE_BUCKET!)
export { bucket }
