const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const profileRoutes = require('./routes/profile.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter');
const db = require('./config/db');

const app = express();

// Security and utility Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet protection (disabled contentSecurityPolicy in development to let frontend query resources smoothly)
app.use(helmet({
  contentSecurityPolicy: false
}));

// Apply Rate Limiter to API endpoints
app.use('/api', apiLimiter);

// Serve static frontend dashboard assets
app.use(express.static(path.join(__dirname, '../public')));

// Swagger API Documentation Configurations
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GitScope GitHub Profile Analyzer API',
      version: '1.0.0',
      description: 'A professional Node.js backend service that queries the GitHub API, computes advanced metrics (stars, forks, activity scores, ratios), and caches details in MySQL.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development Server'
      },
    ],
    paths: {
      '/api/profiles/analyze/{username}': {
        post: {
          summary: 'Analyze and Store Profile Insights',
          description: 'Hits GitHub API, aggregates metrics (follower ratio, activity score, stars, forks), and stores or updates it in the MySQL database.',
          parameters: [
            {
              name: 'username',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'GitHub account name'
            }
          ],
          responses: {
            200: { description: 'Successful analysis completed and cached.' },
            404: { description: 'GitHub user not found.' },
            500: { description: 'Server error.' }
          }
        }
      },
      '/api/profiles': {
        get: {
          summary: 'Retrieve All Stored Profiles',
          description: 'Lists cached developers profiles from database. Supports text filtering, pagination, and sorting.',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'analyzed_at' } },
            { name: 'order', in: 'query', schema: { type: 'string', default: 'desc', enum: ['asc', 'desc'] } }
          ],
          responses: {
            200: { description: 'Array list of cached profiles.' }
          }
        }
      },
      '/api/profiles/analytics': {
        get: {
          summary: 'Retrieve Database Insights Summary',
          description: 'Compiles global averages: total users, average followers, most common language, and the most followed developer in cache.',
          responses: {
            200: { description: 'Analytics object.' }
          }
        }
      },
      '/api/profiles/{username}': {
        get: {
          summary: 'Retrieve Stored Profile Details',
          description: 'Returns cached database details and calculated insights for a user.',
          parameters: [
            { name: 'username', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Profile details object.' },
            404: { description: 'Profile has not been analyzed yet.' }
          }
        },
        delete: {
          summary: 'Delete Stored Profile Analysis',
          description: 'Removes user analytics details from database and clears internal cache keys.',
          parameters: [
            { name: 'username', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Deletion result feedback.' }
          }
        }
      },
      '/api/profiles/refresh/{username}': {
        put: {
          summary: 'Force Refresh Profile Insights',
          description: 'Evicts existing memory cache, fetches latest GitHub API counts, and updates the database record.',
          parameters: [
            { name: 'username', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Refreshed analysis payload.' }
          }
        }
      }
    }
  },
  apis: [], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Bind APIs
app.use('/api/profiles', profileRoutes);

// Database and Server Health check route
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    return res.status(200).json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      error: error.message,
      timestamp: new Date()
    });
  }
});

// Fallback for API routes
app.use('/api', (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`
  });
});

// Fallback to HTML single page application
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Centralized Error Middleware
app.use(errorMiddleware);

module.exports = app;
