const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const User = require('./models/User');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts')); // Unified posts route
app.use('/api/services', require('./routes/services'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/hires', require('./routes/hire'));
app.use('/api/messages', require('./routes/messages'));
// Legacy routes (to be deprecated)
app.use('/api/provider-posts', require('./routes/providerPosts'));
app.use('/api/seeker-posts', require('./routes/seekerPosts'));

// Error handler middleware
app.use(errorHandler);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
