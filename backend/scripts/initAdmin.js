const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import User model
const User = require('../models/User');

const adminData = {
  name: 'Admin',
  email: process.env.ADMIN_EMAIL,
  password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
  role: 'admin',
  isVerified: true
};

const initAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    
    // List all databases to verify connection
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.listDatabases();
    console.log('Available databases:', result.databases.map(db => db.name));

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: process.env.ADMIN_EMAIL,
      role: 'admin'
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const admin = await User.create(adminData);

    console.log('Admin user created successfully:');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD}`);
    console.log(`Role: ${admin.role}`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

// Run the script
initAdmin(); 