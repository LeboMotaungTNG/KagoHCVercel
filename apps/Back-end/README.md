# KagoHC Backend API

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop (for MongoDB & Redis)
- npm or yarn

### Setup

1. **Clone and install**
   \\\ash
   npm install
   \\\

2. **Start infrastructure**
   \\\ash
   docker-compose up -d
   \\\

3. **Set environment variables**
   \\\ash
   cp .env.example .env
   # Edit .env with your values
   \\\

4. **Run development server**
   \\\ash
   npm run dev
   \\\

## 📁 Project Structure

\\\
apps/api/src/
├── modules/           # Feature modules
│   ├── auth/         # Authentication & authorization
│   ├── employees/    # Employee management
│   ├── attendance/   # Time tracking
│   ├── leave/        # Leave requests
│   ├── payroll/      # Salary processing
│   ├── performance/  # Performance reviews
│   ├── assets/       # Company assets
│   ├── chat/         # Real-time messaging
│   ├── meetings/     # Video meetings
│   └── announcements/# Company announcements
├── core/             # Shared infrastructure
│   ├── middleware/   # Global middleware
│   ├── utils/        # Utilities
│   ├── config/       # Configuration
│   └── events/       # Event bus
├── websocket/        # WebSocket handlers
├── integrations/     # Third-party services
└── app.ts           # Main application
\\\

## 🔐 Authentication API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | \/api/v1/auth/register\ | Register new user |
| POST | \/api/v1/auth/login\ | Login user |
| POST | \/api/v1/auth/refresh\ | Refresh access token |
| POST | \/api/v1/auth/logout\ | Logout user |

### Example Requests

**Register**
\\\ash
curl -X POST http://localhost:4000/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
\\\

**Login**
\\\ash
curl -X POST http://localhost:4000/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password123"}'
\\\

##  Docker Commands

\\\ash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and delete data
docker-compose down -v

# Access MongoDB shell
docker exec -it kagohc-mongodb mongosh

# Access Redis CLI
docker exec -it kagohc-redis redis-cli
\\\

##  Testing

\\\ash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test
npm test -- auth.service
\\\

##  Available Scripts

- \
pm run dev\ - Start development server
- \
pm run build\ - Build for production
- \
pm start\ - Start production server
- \
pm test\ - Run tests
- \
pm run lint\ - Lint code
- \
pm run format\ - Format code

## 🔧 Environment Variables

See \.env.example\ for all required variables.

