const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

///////////////
// IMPORT ROUTERS
const userRouter = require('./routes/userRoutes');
const featureRouter = require('./routes/featureRoutes');

const app = express();
app.enable('trust proxy');

///////////////
// MIDDLEWARES

// TODO: Implement CORS
// app.use(cors({ credentials: true, origin: process.env.ORIGIN }));
app.use(cors());
// app.options('*', cors());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body Parser, Cookie Parser
app.use(express.json());
app.use(cookieParser());

// Set Security Headers
app.use(helmet());

// Rate Limiter
const limiter = rateLimit({
  max: 250,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Data Sanitation against NoSQL Query Injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

///////////////
// ROUTES
app.get('/', (req, res) => {
  res.send('API Working');
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/features', featureRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
