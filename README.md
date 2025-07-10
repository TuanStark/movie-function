# 🎬 Movie Booking System API

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white" alt="Cloudinary" />
</p>

## 📖 Description

A comprehensive movie booking system backend API built with NestJS, featuring user authentication, movie management, theater seat booking, and dynamic pricing with student discounts and peak hour surcharges.

## ✨ Features

### 🎭 **Core Features**
- **User Management**: Registration, authentication with JWT
- **Movie Management**: CRUD operations with genres, cast, and reviews
- **Theater Management**: Multiple theaters with seat configurations
- **Booking System**: Real-time seat booking with conflict prevention
- **Image Upload**: Cloudinary integration for movie posters and booking receipts
- **Article System**: News and blog management

### 💰 **Dynamic Pricing**
- **Student Discount**: 20% off for users with "student" role
- **Peak Hour Surcharge**: +20,000 VND for weekends or after 6 PM
- **Real-time Price Calculation**: Automatic price adjustment based on user type and showtime

### 🔐 **Security & Validation**
- JWT-based authentication
- Role-based access control
- Input validation with class-validator
- File upload validation (images only, size limits)

### 📊 **Advanced Features**
- **Transaction Support**: Database consistency with Prisma transactions
- **Seat Availability**: Real-time seat status checking
- **Booking Status**: PENDING, CONFIRMED, CANCELLED states
- **Search & Pagination**: Efficient data retrieval
- **Error Handling**: Comprehensive error responses

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (Passport)
- **File Upload**: Multer + Cloudinary
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Cloudinary account (for image uploads)

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd movie-function
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/movie_booking"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Server
PORT=8000
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed database
npx prisma db seed
```

### 5. Run the application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at `http://localhost:8000`

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 📚 API Documentation

### Authentication Endpoints
```
POST /auth/register     # User registration
POST /auth/login        # User login
GET  /auth/profile      # Get user profile (JWT required)
```

### Movie Management
```
GET    /movies          # Get all movies (with pagination)
POST   /movies          # Create movie (JWT required)
GET    /movies/:id      # Get movie details
PATCH  /movies/:id      # Update movie (JWT required)
DELETE /movies/:id      # Delete movie (JWT required)
```

### Booking System
```
POST   /booking         # Create booking (JWT required)
GET    /booking         # Get all bookings (JWT required)
GET    /booking/:id     # Get booking details (JWT required)
PATCH  /booking/:id     # Update booking (JWT required)
DELETE /booking/:id     # Cancel booking (JWT required)
GET    /booking/showtime/:showtimeId/seats  # Get available seats
```

### Theater & Seats
```
GET    /theaters        # Get all theaters
GET    /theaters/:id    # Get theater details
GET    /seats/theater/:theaterId  # Get seats by theater
```

### File Upload
All endpoints that support file upload accept `multipart/form-data` with:
- **Image field name**: `file`
- **Supported formats**: JPG, JPEG, PNG, GIF
- **Max file size**: 3MB

## 💰 Pricing Logic

### Student Discount (20% off)
```typescript
if (user.role === "student") {
  totalPrice *= 0.8; // 20% discount
}
```

### Peak Hour Surcharge (+20,000 VND)
```typescript
const isPeakHour = showtimeDate.getDay() >= 5 || showtimeTime > "18:00";
if (isPeakHour) {
  totalPrice += 20000; // Weekend or after 6 PM
}
```

### Pricing Examples
| User Type | Time | Base Price | Final Price |
|-----------|------|------------|-------------|
| Student | Weekday 2 PM | 100,000 VND | 80,000 VND |
| Regular | Weekday 2 PM | 100,000 VND | 100,000 VND |
| Student | Weekend 8 PM | 100,000 VND | 100,000 VND |
| Regular | Weekend 8 PM | 100,000 VND | 120,000 VND |

## 🗄️ Database Schema

### Key Models
- **User**: Authentication and profile data
- **Movie**: Film information with genres and cast
- **Theater**: Cinema locations with seat configurations
- **Showtime**: Movie screening schedules
- **Booking**: Reservation records with pricing
- **Seat**: Individual seat information and pricing
- **BookingSeat**: Junction table for seat reservations

## 🔧 Development

### Project Structure
```
src/
├── auth/           # Authentication module
├── users/          # User management
├── movies/         # Movie CRUD operations
├── theaters/       # Theater management
├── seats/          # Seat configuration
├── booking/        # Booking system
├── showtimes/      # Showtime scheduling
├── genres/         # Movie genres
├── actors/         # Cast management
├── article/        # News/blog system
├── cloudinary/     # File upload service
├── prisma/         # Database service
└── global/         # Shared utilities
```

### Key Commands
```bash
# Database operations
npm run db:migrate      # Run migrations
npm run db:reset        # Reset database
npm run db:seed         # Seed sample data
npm run db:studio       # Open Prisma Studio

# Code quality
npm run lint            # ESLint check
npm run format          # Prettier format
npm run build           # Build for production
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL="your-production-db-url"
JWT_SECRET="strong-production-secret"
CLOUDINARY_CLOUD_NAME="production-cloud-name"
CLOUDINARY_API_KEY="production-api-key"
CLOUDINARY_API_SECRET="production-api-secret"
```

### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8000
CMD ["npm", "run", "start:prod"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **TuanStark** - *Initial work* - [GitHub](https://github.com/TuanStark)

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- Prisma team for the excellent ORM
- Cloudinary for image management services
