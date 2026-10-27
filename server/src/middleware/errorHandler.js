import { ENV } from '../config/env.js'

export function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode
  if (err.statusCode) statusCode = err.statusCode

  let message = err.message || 'Internal Server Error'

  // Handle Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400
    message = `Resource not found with specified identifier: ${err.value}`
  }

  // Handle Mongoose Duplicate Key
  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    message = `An entry with this ${field} already exists.`
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400
    const errors = Object.values(err.errors).map(val => val.message)
    message = errors.join(', ')
  }

  console.error(`[Error] [${req.method}] ${req.originalUrl} - ${message}`)

  res.status(statusCode).json({
    success: false,
    message,
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack })
  })
}
