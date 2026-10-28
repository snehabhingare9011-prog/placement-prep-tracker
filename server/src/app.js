import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import apiRoutes from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { ENV } from './config/env.js'

const app = express()

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false
}))

// Cross-Origin Resource Sharing
const staticOrigins = [
  ENV.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || staticOrigins.includes(origin) || (ENV.NODE_ENV === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
      return callback(null, true)
    }
    return callback(new Error(`CORS blocked request from origin: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Request Body Parsing with size limits
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// Mount API v1
app.use('/api/v1', apiRoutes)

// Root welcome message
app.get('/', (req, res) => {
  res.json({
    name: 'HireVerse API',
    tagline: 'Company-Wise Placement Preparation & Interview Readiness Platform',
    version: '1.0.0',
    apiDocumentation: '/api/v1/health'
  })
})

// Error Handling Middlewares
app.use(notFound)
app.use(errorHandler)

export default app
