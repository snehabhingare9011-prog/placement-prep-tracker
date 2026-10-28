import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { ENV } from './env.js'

let memoryServer = null

/**
 * Connect to MongoDB Atlas using process.env.MONGODB_URI.
 * In test mode (NODE_ENV=test), uses an ephemeral in-memory server to prevent modifying cloud data.
 */
export async function connectDB(customUri = null) {
  // If already connected, reuse existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise()
    return mongoose.connection
  }

  const isTest = process.env.NODE_ENV === 'test' || process.argv.some(arg => /test/i.test(arg))

  // For automated tests, use an isolated ephemeral in-memory MongoDB instance
  if (isTest && !customUri) {
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create()
      const testUri = memoryServer.getUri()
      await mongoose.connect(testUri)
      return mongoose.connection
    }
    return mongoose.connection
  }

  const rawUri = customUri || process.env.MONGODB_URI || ENV.MONGODB_URI || ''
  const uri = rawUri.trim().replace(/^["']|["']$/g, '')

  // Check if URI is missing or contains placeholder markers
  if (!uri || uri.includes('<username>') || uri.includes('<password>') || uri.includes('<cluster-url>')) {
    const errorMsg =
      'MongoDB Atlas connection URI is not properly configured in server/.env.\n' +
      'Please open server/.env and set MONGODB_URI to your actual MongoDB Atlas connection string:\n' +
      '  MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/hireverse?retryWrites=true&w=majority\n\n' +
      'Atlas Setup Checklist:\n' +
      '  1. Create a database user under Security -> Database Access (with Read and write to any database).\n' +
      '  2. Whitelist your IP under Security -> Network Access (or allow access from anywhere: 0.0.0.0/0).\n' +
      '  3. Get your connection string under Deployment -> Database -> Connect -> Drivers.'
    console.error(`[DB Error] ${errorMsg}`)
    throw new Error(errorMsg)
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    const errorMsg =
      'Invalid MongoDB connection URI format in server/.env.\n' +
      'The connection string must start with "mongodb+srv://" or "mongodb://".'
    console.error(`[DB Error] ${errorMsg}`)
    throw new Error(errorMsg)
  }

  try {
    console.log('[DB] Connecting to MongoDB Atlas...')
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true
    })
    console.log(`[DB] Successfully connected to MongoDB Atlas cluster: ${mongoose.connection.host}`)
    return mongoose.connection
  } catch (err) {
    const sanitizedError = (err?.message || String(err)).replace(/:([^:@]+)@/, ':****@')
    console.error(`[DB Error] Failed to connect to MongoDB Atlas: ${sanitizedError}`)
    console.error(
      '[DB Error] Please verify:\n' +
      '  - Your current IP address is allowed in MongoDB Atlas Network Access (e.g. 0.0.0.0/0).\n' +
      '  - Your database username and password in server/.env are valid (special characters in password must be URL-encoded).\n' +
      '  - Your Atlas cluster is active and reachable.'
    )
    throw new Error(`MongoDB Atlas connection failed: ${sanitizedError}`)
  }
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
