const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const testAdminCreation = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sohojogi');
    console.log('Connected to MongoDB');

    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin.shohojogi@gmail.com' });
    console.log('Admin exists:', !!adminExists);

    if (!adminExists) {
      // Create admin user
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin.shohojogi@gmail.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Admin user created:', admin.email);
    }

    // Test login credentials
    const admin = await User.findOne({ email: 'admin.shohojogi@gmail.com' }).select('+password');
    if (admin) {
      const isValidPassword = await admin.comparePassword('admin123');
      console.log('Password validation:', isValidPassword);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testAdminCreation();
