require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect to Database
connectDB();

// Security Middlewares
// Customize Helmet content security policy to allow CDNs for CSS, particles, bootstrap, and GSAP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
          "https://code.jquery.com"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "*"],
        connectSrc: ["'self'", "*"],
        frameSrc: ["'self'"]
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize data against NoSQL query injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// Specific rate limit for registration submission to prevent spam
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 registrations per hour
  message: { message: 'Too many registrations attempted from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/teams/register', registrationLimiter);

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/evaluation', require('./routes/evaluationRoutes'));

// Serve client static files if running in combined mode
app.use(express.static(path.join(__dirname, '../client')));

// Dedicated route for evaluation portal
app.get(['/evaluation', '/evaluation/'], (req, res) => {
  res.sendFile(path.join(__dirname, '../client/evaluation/index.html'));
});

// Fallback to main index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    message: err.message || 'An internal server error occurred'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
