import { Client } from 'minio'
import { config } from 'dotenv'
config()
const storage = new Client({
  endPoint: process.env.STORAGE_ENDPOINT!,
  port: 443,
  useSSL: true,
  accessKey: process.env.STORAGE_ACCESS_KEY!,
  secretKey: process.env.STORAGE_SECRET_KEY!,
})

export { storage }
