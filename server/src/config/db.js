import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { ENV } from './env.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let memoryServer = null

export async function connectDB(customUri = null) {
  let uri = customUri || ENV.MONGODB_URI

  if (uri && uri.trim() !== '') {
    try {
      console.log(`[DB] Attempting connection to configured MongoDB URI...`)
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000
      })
      console.log(`[DB] Successfully connected to MongoDB: ${mongoose.connection.host}`)
      return mongoose.connection
    } catch (err) {
      console.warn(`[DB] Configured MongoDB unavailable (${err.message}). Falling back to embedded instance.`)
    }
  }

  // Automatic embedded fallback using MongoMemoryServer
  if (!memoryServer) {
    console.log(`[DB] Starting embedded database engine...`)
    const dataDir = path.resolve(__dirname, '../../.mongo-data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    const isTest = process.env.NODE_ENV === 'test'
    const serverOptions = isTest
      ? {}
      : {
          instance: {
            dbPath: dataDir,
            storageEngine: 'wiredTiger'
          }
        }

    try {
      memoryServer = await MongoMemoryServer.create(serverOptions)
    } catch (e) {
      // In case lock exists from previous process, fall back to ephemeral instance
      console.warn(`[DB] Could not acquire persistent lock (${e.message}). Starting ephemeral instance.`)
      memoryServer = await MongoMemoryServer.create()
    }

    const memoryUri = memoryServer.getUri()
    await mongoose.connect(memoryUri)
    console.log(`[DB] Successfully connected to embedded database at ${memoryUri}`)
    return mongoose.connection
  }

  return mongoose.connection
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
  if (memoryServer) {
    await memoryServer.stop()
    memoryServer = null
  }
}
