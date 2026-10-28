import app from './app.js'
import { connectDB } from './config/db.js'
import { ENV } from './config/env.js'
import { User } from './models/User.js'
import { seedDatabase } from '../scripts/seed.js'
import { syncAssessmentsToDatabase } from './services/assessmentSyncService.js'

async function bootstrap() {
  try {
    await connectDB()

    // Auto-seed initial sample data and demo accounts if database is empty
    const userCount = await User.countDocuments()
    if (userCount === 0) {
      console.log('[Startup] No accounts found in database. Automatically initializing demo data and accounts...')
      await seedDatabase()
    } else {
      // Ensure all available companies have their mock assessments in database without modifying user accounts
      await syncAssessmentsToDatabase()
    }

    const server = app.listen(ENV.PORT, () => {
      console.log(`====================================================`)
      console.log(`🚀 HireVerse Backend Server running on port ${ENV.PORT}`)
      console.log(`🌍 Environment: ${ENV.NODE_ENV}`)
      console.log(`📡 API Base URL: http://localhost:${ENV.PORT}/api/v1`)
      console.log(`====================================================`)
    })

    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', err)
    })

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err)
      process.exit(1)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

bootstrap()
