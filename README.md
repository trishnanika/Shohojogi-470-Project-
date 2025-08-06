# SohoJogi - Connecting Hands, Simplifying Life

A modern service marketplace platform for Bangladesh, built with the MERN stack (MongoDB, Express.js, React.js, Node.js) following MVC architecture.

## 🚀 Features

### Sprint 1 Features (Implemented)
- ✅ **User Authentication System**
  - JWT-based authentication
  - Role-based registration (Seeker/Provider)
  - Hardcoded admin login
  - Secure password hashing

- ✅ **User Profile Management**
  - Complete profile editing
  - Role-specific fields (skills, experience, preferences)
  - Location-based profiles

- ✅ **Service Posting (Providers)**
  - Create, edit, delete services
  - Category-based service organization
  - Price and availability management

- ✅ **Search & Filter (Seekers)**
  - Category-based filtering
  - Location-based search
  - Price range filtering
  - Rating-based sorting

### User Roles
1. **Admin** - Platform management and oversight
2. **Service Seeker** - Find and hire service providers
3. **Service Provider** - Offer services and manage listings

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **SCSS** - Styling
- **React Icons** - Icon library
- **React Hot Toast** - Notifications
- **Framer Motion** - Animations

## 📁 Project Structure

```
SohoJogi/
├── backend/
│   ├── config/
│   │   └── config.env
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── serviceController.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   └── Service.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── services.js
│   │   └── admin.js
│   ├── scripts/
│   │   └── initAdmin.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── layout/
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   └── Home.js
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.scss
│   └── package.json
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SohoJogi
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` file in backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/sohojogi
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   ADMIN_EMAIL=admin.shohojogi@gmail.com
   ADMIN_PASSWORD=admin123
   ```

4. **Initialize Admin User**
   ```bash
   cd backend
   node scripts/initAdmin.js
   ```

5. **Start the application**
   ```bash
   # From root directory
   npm run dev
   
   # Or start separately
   # Backend
   cd backend && npm run dev
   
   # Frontend
   cd frontend && npm start
   ```

### Default Admin Credentials
- **Email**: admin.shohojogi@gmail.com
- **Password**: admin123

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/profile` - Update profile
- `GET /api/users/providers` - Get providers with filters
- `DELETE /api/users/:id` - Delete user (admin)
- `PUT /api/users/:id/toggle-status` - Toggle user status (admin)

### Services
- `GET /api/services` - Get all services with filters
- `GET /api/services/:id` - Get single service
- `POST /api/services` - Create service (provider)
- `PUT /api/services/:id` - Update service (provider)
- `DELETE /api/services/:id` - Delete service (provider)
- `GET /api/services/my-services` - Get my services (provider)
- `PUT /api/services/:id/toggle-availability` - Toggle availability (provider)

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/services` - All services (admin view)
- `PUT /api/admin/services/:id/toggle-featured` - Toggle featured status
- `DELETE /api/admin/services/:id` - Delete service (admin)

## 🎨 Design Features

### Color Palette (Pastel Theme)
- **Primary**: #667eea (Blue)
- **Secondary**: #f093fb (Pink)
- **Accent**: #fda085 (Orange)
- **Success**: #4ade80 (Green)
- **Warning**: #fbbf24 (Yellow)
- **Error**: #f87171 (Red)

### Responsive Design
- Mobile-first approach
- Breakpoints: 480px, 768px, 1024px
- Modern UI with smooth animations
- Accessibility compliant

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Security headers with helmet
- Rate limiting
- Role-based access control

## 📱 Supported Cities

- Dhaka
- Chittagong
- Sylhet
- Rajshahi
- Khulna
- Barisal
- Rangpur
- Mymensingh
- Comilla
- Noakhali

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm start
```

### Database
- MongoDB Compass recommended for database management
- Collections: `users`, `services`

## 🚀 Deployment

### Backend Deployment
1. Set environment variables
2. Build the application
3. Deploy to your preferred platform (Heroku, Vercel, etc.)

### Frontend Deployment
1. Update API base URL
2. Build the application: `npm run build`
3. Deploy to your preferred platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email info@sohojogi.com or create an issue in the repository.

---

**SohoJogi** - Connecting Hands, Simplifying Life 