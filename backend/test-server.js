const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.post('/api/auth/login', (req, res) => {
  console.log('Test login request received:', req.body);
  const { email, password, role } = req.body;
  
  if (role === 'admin' && email === 'admin.shohojogi@gmail.com' && password === 'admin123') {
    console.log('Admin login successful');
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: 'test-token-123',
      user: {
        _id: 'default-admin-id',
        name: 'Admin User',
        email: 'admin.shohojogi@gmail.com',
        role: 'admin',
      }
    });
  }
  
  console.log('Login failed');
  return res.status(401).json({
    success: false,
    message: 'Invalid credentials'
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
