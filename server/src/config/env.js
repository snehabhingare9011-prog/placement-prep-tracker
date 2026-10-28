import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load server/.env first, then fallback to root .env if present
const serverEnvPath = path.resolve(__dirname, '../../.env')
const rootEnvPath = path.resolve(__dirname, '../../../.env')

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath })
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath })
} else {
  dotenv.config()
}

export const ENV = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: (process.env.MONGODB_URI || '').trim(),
  JWT_SECRET: process.env.JWT_SECRET || 'hireverse_super_secret_jwt_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
}
