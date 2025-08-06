const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import User model
const User = require('../models/User');

const initAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: process.env.ADMIN_EMAIL,
      role: 'admin'
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      name: 'SohoJogi Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      phone: '+8801700000000',
      role: 'admin',
      location: {
        city: 'Dhaka',
        area: 'Gulshan'
      },
      isVerified: true,
      isActive: true
    };

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