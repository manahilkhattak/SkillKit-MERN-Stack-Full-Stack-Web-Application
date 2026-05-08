require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✓ MongoDB connected');
    app.listen(PORT, () => console.log(`✓ SkillKit server on port ${PORT} [${process.env.NODE_ENV || 'dev'}]`));
  })
  .catch(err => { console.error('DB connection failed:', err.message); process.exit(1); });
