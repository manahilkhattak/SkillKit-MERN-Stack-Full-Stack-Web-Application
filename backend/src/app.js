require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { apiLimiter } = require('./middlewares/misc');
const { errorHandler, notFound } = require('./middlewares/error');
const routes = require('./routes/index');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded docs via authenticated path (simple — proper auth check in route)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', apiLimiter, routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
