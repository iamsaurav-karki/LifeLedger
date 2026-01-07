# 🧾 LifeLedger

**Personal Finance & Food Tracking System**

A comprehensive full-stack application for tracking personal finances, investments, lending/borrowing, and food consumption with detailed analytics and admin management.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Local Development](#-local-development)
- [Production Deployment](#-production-deployment)
- [Database Setup](#-database-setup)
- [Admin User Creation](#-admin-user-creation)
- [Project Structure](#️-project-structure)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Docker Commands](#-docker-commands)
- [Troubleshooting](#-troubleshooting)
- [Security Notes](#-security-notes)

---

## 🎯 Features

### Finance Management
- ✅ **Expenses Tracking** - Record expenses with categories, payment methods, and tags
- ✅ **Income Tracking** - Track income sources with detailed descriptions
- ✅ **Investment Management** - Track various investment types (SIP, CID, SSF, Stocks, Fixed Deposits, etc.)
- ✅ **Lending & Borrowing** - Manage money to pay and money to receive with status tracking
- ✅ **Financial Analytics** - Comprehensive dashboards with charts and summaries
- ✅ **Date Range Filtering** - Filter transactions by day, week, month, or custom ranges
- ✅ **Pagination** - Efficient data display with pagination support

### Food Tracking
- ✅ **Food Logs** - Record meals with cost, calories, and meal types
- ✅ **Category Management** - Create and manage custom food categories
- ✅ **Food Analytics** - Track spending, calories, and meal patterns
- ✅ **Day/Week/Month Filtering** - Filter food logs by time periods
- ✅ **Visual Statistics** - Beautiful cards and charts for food insights

### Admin Features
- ✅ **User Management** - Full CRUD operations for user accounts
- ✅ **User Analytics** - Platform-wide statistics and user activity metrics
- ✅ **Password Reset** - Admin can reset user passwords
- ✅ **Account Status Management** - Activate, deactivate, or suspend accounts
- ✅ **Role Management** - Assign USER or ADMIN roles
- ✅ **Audit Logs** - Track all admin actions
- ✅ **System Settings** - Manage application-wide settings

### User Features
- ✅ **Dashboard** - Comprehensive overview of all financial data
- ✅ **Analytics** - Advanced graphical analytics for all data types
- ✅ **Multi-currency Support** - Single currency (NPR) for simplified tracking
- ✅ **Secure Authentication** - JWT-based authentication with refresh tokens
- ✅ **Responsive Design** - Works seamlessly on desktop and mobile

---

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS 10
- **Language**: TypeScript
- **Database**: PostgreSQL 15
- **ORM**: TypeORM
- **Cache**: Redis 7
- **Authentication**: JWT + Passport
- **Validation**: class-validator, class-transformer
- **API Documentation**: Swagger/OpenAPI
- **Rate Limiting**: @nestjs/throttler

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **UI Components**: Headless UI

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 15 Alpine
- **Cache**: Redis 7 Alpine
- **Node Version**: 18 LTS

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** (for cloning the repository)

**Optional for local development:**
- **Node.js** 18 LTS
- **npm** or **yarn**
- **PostgreSQL** 15 (if running database locally)
- **Redis** 7 (if running cache locally)

---

## 🚀 Quick Start

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd LifeLedger
```

### Step 2: Configure Environment Variables

```bash
cp env.example .env
```

Edit `.env` and configure the following (at minimum):

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=lifeledger
DB_PASSWORD=your-secure-db-password
DB_DATABASE=lifeledger_db

# JWT Configuration (IMPORTANT: Change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Application Configuration
NODE_ENV=production
FRONTEND_URL=http://localhost:7000

# Admin User Configuration (Required for automatic admin creation)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Admin User  # Optional
```

### Step 3: Build and Start Services

```bash
docker-compose up -d --build
```

This will:
- Build Docker images for backend and frontend
- Start PostgreSQL database
- Start Redis cache
- Start backend API server
- Start frontend application

Wait for all services to be healthy (about 30-60 seconds).

### Step 4: Setup Database

Execute the database schema:

```bash
# Copy schema file into PostgreSQL container
docker cp database-schema.sql lifeledger-postgres:/tmp/schema.sql

# Execute the schema
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db -f /tmp/schema.sql
```

**OR** exec into PostgreSQL and paste the schema:

```bash
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db
```

Then copy and paste the entire contents of `database-schema.sql`.

### Step 5: Configure Admin User (Automatic - No Manual Setup!)

**The admin user is automatically created on backend startup!** Just ensure your `.env` has:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Admin User  # Optional
```

**What happens automatically:**
- ✅ Admin user is created if it doesn't exist
- ✅ Password is updated if user exists (so you can change it in `.env`)
- ✅ Role set to `ADMIN`, status to `ACTIVE`, `emailVerified` to `true`
- ✅ No manual database operations needed!

**If you just added these to `.env`, restart the backend:**
```bash
docker-compose restart backend
```

**Check logs to verify:**
```bash
docker-compose logs backend | grep -i admin
```

You should see: `✅ Admin user created successfully: admin@example.com`

### Step 6: Access the Application

- **Frontend**: http://localhost:7000
- **Backend API**: http://localhost:7001
- **API Documentation (Swagger)**: http://localhost:7001/api/docs
- **Health Check**: http://localhost:7001/health

---

## 💻 Local Development

### Prerequisites

- Node.js 18 LTS
- PostgreSQL 15
- Redis 7

### Backend Setup

```bash
cd backend
npm install
cp ../env.example .env
# Edit .env with your local database credentials
npm run start:dev
```

Backend will run on `http://localhost:7001`

### Frontend Setup

```bash
cd frontend
npm install
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:7001
npm run dev
```

Frontend will run on `http://localhost:7000`

### Database Setup (Local)

1. Create a PostgreSQL database:
```bash
createdb lifeledger_db
```

2. Execute the schema:
```bash
psql -U your_username -d lifeledger_db -f database-schema.sql
```

---

## 🚢 Production Deployment

### Building Docker Images

**Important**: Since `docker-compose.yml` uses pre-built images (production-ready), you must build images manually before starting services.

#### Build Individual Images

```bash
# Build backend image
docker build -t lifeledger-backend:latest ./backend

# Build frontend image
docker build -t lifeledger-frontend:latest ./frontend
```

#### Build All Images (Recommended)

```bash
# Build both images
docker build -t lifeledger-backend:latest ./backend
docker build -t lifeledger-frontend:latest ./frontend
```

**Note**: After making code changes, rebuild the images before starting containers to see the changes reflected.

### Production Environment Variables

Create a `.env` file with production values:

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=lifeledger_prod
DB_PASSWORD=STRONG_PRODUCTION_PASSWORD
DB_DATABASE=lifeledger_prod

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Configuration (CRITICAL: Use strong, random secrets)
JWT_SECRET=GENERATE_STRONG_RANDOM_SECRET_HERE
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=GENERATE_STRONG_RANDOM_SECRET_HERE
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
PORT=7001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### Starting Production Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### Production Checklist

- [ ] Change all default passwords
- [ ] Use strong, random JWT secrets
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS (use reverse proxy like Nginx)
- [ ] Set up database backups
- [ ] Configure Redis persistence
- [ ] Set up monitoring and logging
- [ ] Review security settings
- [ ] Test all functionality

### Reverse Proxy Setup (Nginx Example)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:7000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:7001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🗄️ Database Setup

### Schema Execution

The `database-schema.sql` file contains the complete database schema including:

- All table definitions
- ENUM types
- Indexes
- Foreign key constraints
- User deletion behavior documentation

### Execute Schema

**Option 1: Using Docker (Recommended)**

```bash
docker cp database-schema.sql lifeledger-postgres:/tmp/schema.sql
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db -f /tmp/schema.sql
```

**Option 2: Direct PostgreSQL Connection**

```bash
psql -U lifeledger -d lifeledger_db -f database-schema.sql
```

**Option 3: Interactive PostgreSQL**

```bash
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db
```

Then copy and paste the entire contents of `database-schema.sql`.

### Verify Schema

```bash
# List all tables
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db -c "\dt"

# Check specific table structure
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db -c "\d users"
```

### Database Tables

The schema includes the following tables:

1. **users** - User accounts with roles (USER, ADMIN)
2. **categories** - Categories for expenses, food, and investments
3. **expenses** - Expense records
4. **incomes** - Income records
5. **investments** - Investment records with various types
6. **food_logs** - Food tracking records
7. **lendings** - Lending/borrowing records
8. **admin_audit_logs** - Admin action audit trail
9. **system_settings** - System configuration
10. **recurring_transactions** - Recurring transaction templates
11. **budgets** - Budget tracking

---

## 👤 Admin User Setup & Management

> **💡 Quick Start**: Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then start the backend. The admin user will be created automatically! See details below.

### 🚀 Automatic Admin User Creation (Recommended)

The system **automatically creates or updates** the primary admin user on backend startup using credentials from your `.env` file. This is the **easiest and recommended method**.

#### Step 1: Configure Admin Credentials in `.env`

Add these variables to your `.env` file:

```env
# Admin User Configuration (Required for automatic admin creation)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Admin User  # Optional, defaults to "Admin User"
```

**Important Notes:**
- `ADMIN_EMAIL`: The email address for the admin user (must be unique)
- `ADMIN_PASSWORD`: The **actual password** you'll use to log in (not a hash)
- `ADMIN_NAME`: Display name for the admin user (optional)

#### Step 2: Start the Backend

```bash
# If using Docker Compose
docker-compose up -d --build

# Or restart the backend
docker-compose restart backend
```

#### Step 3: Verify Admin Creation

Check the backend logs to confirm admin user was created:

```bash
docker-compose logs backend | grep -i admin
```

You should see:
```
✅ Admin user created successfully: admin@example.com
```

Or if the user already existed:
```
✅ Admin user updated: admin@example.com
```

#### Step 4: Login

Use the credentials from your `.env` file:
- **Email**: Value from `ADMIN_EMAIL`
- **Password**: Value from `ADMIN_PASSWORD`

Go to: http://localhost:7000/login and click "Admin Login"

#### How Automatic Creation Works

On backend startup, the system:

1. ✅ **Checks** if a user exists with the email from `ADMIN_EMAIL`
2. ✅ **Creates** the admin user if it doesn't exist
3. ✅ **Updates** the password hash if the user exists (so you can change password in `.env`)
4. ✅ **Promotes** existing users to admin if they're not already admin
5. ✅ **Sets** role to `ADMIN`, status to `ACTIVE`, and `emailVerified` to `true`

**Benefits:**
- 🎯 No manual database operations required
- 🔄 Password updates automatically when you change `ADMIN_PASSWORD` in `.env`
- 🔒 Secure password hashing handled automatically
- 📝 Simple configuration via `.env` file

---

### 👥 Creating Additional Admin Users

After the primary admin is created, you can create additional admin users through:

#### Method 1: Admin Panel (Easiest)

1. Log in as the primary admin
2. Navigate to `/admin/users`
3. Click "Add User" button
4. Fill in the form:
   - Name: User's full name
   - Email: User's email address
   - Password: User's password
   - Role: Select `ADMIN`
   - Status: Select `ACTIVE`
5. Click "Create User"

The new admin user can immediately log in with the credentials you provided.

#### Method 2: API Endpoint (For Automation)

```bash
curl -X POST http://localhost:7001/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "name": "Another Admin",
    "email": "admin2@example.com",
    "password": "secure-password",
    "role": "ADMIN",
    "status": "ACTIVE"
  }'
```

#### Method 3: Register and Promote (Alternative)

1. Register a user via frontend or API:
```bash
curl -X POST http://localhost:7001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Admin",
    "email": "newadmin@example.com",
    "password": "secure-password"
  }'
```

2. Log in as primary admin and promote the user:
   - Go to `/admin/users`
   - Find the user
   - Click "Edit"
   - Change role to `ADMIN`
   - Save

---

### 🔧 Changing Admin Password

#### Method 1: Update `.env` and Restart (Primary Admin)

1. Update `ADMIN_PASSWORD` in `.env`:
```env
ADMIN_PASSWORD=new-secure-password
```

2. Restart the backend:
```bash
docker-compose restart backend
```

The password will be automatically updated on startup.

#### Method 2: Admin Panel (Any Admin User)

1. Log in as admin
2. Go to `/admin/users`
3. Find the user whose password you want to change
4. Click "Reset Password"
5. Enter and confirm the new password
6. Click "Reset Password"

#### Method 3: API Endpoint

```bash
curl -X POST http://localhost:7001/admin/users/USER_ID/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "newPassword": "new-secure-password"
  }'
```

---

### 🐛 Troubleshooting

#### Admin User Not Created

**Check backend logs:**
```bash
docker-compose logs backend | grep -i admin
```

**Verify `.env` configuration:**
```bash
cat .env | grep ADMIN
```

**Ensure variables are set:**
- `ADMIN_EMAIL` must be set
- `ADMIN_PASSWORD` must be set
- Both must be non-empty

**Restart backend to trigger initialization:**
```bash
docker-compose restart backend
```

#### Login Fails with "Invalid credentials"

1. **Verify credentials match `.env`:**
   - Email must match `ADMIN_EMAIL` exactly
   - Password must match `ADMIN_PASSWORD` exactly

2. **Check user exists in database:**
```bash
docker exec lifeledger-postgres psql -U lifeledger -d lifeledger_db -c "SELECT email, role, status FROM users WHERE email = 'your-admin@email.com';"
```

3. **Verify user status:**
   - `role` should be `ADMIN`
   - `status` should be `ACTIVE`
   - `emailVerified` should be `true`

4. **Update password via `.env`:**
   - Change `ADMIN_PASSWORD` in `.env`
   - Restart backend: `docker-compose restart backend`
   - Try logging in again

#### User Exists But Not Admin

If a user with the email exists but isn't an admin:

1. **Automatic promotion:** On backend startup, if `ADMIN_EMAIL` matches an existing user, they will be automatically promoted to admin and password updated.

2. **Manual promotion via Admin Panel:**
   - Log in as primary admin
   - Go to `/admin/users`
   - Find the user
   - Click "Edit"
   - Change role to `ADMIN`
   - Save

---

### 📋 Summary

| Method | Use Case | Difficulty |
|--------|----------|------------|
| **Automatic (`.env`)** | Primary admin setup | ⭐ Easy |
| **Admin Panel** | Additional admins | ⭐ Easy |
| **API Endpoint** | Automation/scripts | ⭐⭐ Medium |
| **Register + Promote** | Alternative method | ⭐⭐ Medium |

**Recommended Workflow:**
1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` for primary admin
2. Start backend (admin created automatically)
3. Log in as primary admin
4. Create additional admins via Admin Panel at `/admin/users`

---

## 📁 Project Structure

```
LifeLedger/
├── backend/                 # NestJS Backend API
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── admin/      # Admin management
│   │   │   ├── auth/       # Authentication
│   │   │   ├── finance/    # Finance tracking
│   │   │   ├── food/       # Food tracking
│   │   │   └── users/      # User management
│   │   ├── entities/       # TypeORM entities
│   │   ├── config/         # Configuration files
│   │   └── database/       # Database seeds
│   ├── Dockerfile          # Production Dockerfile
│   ├── .dockerignore       # Docker ignore patterns
│   └── package.json
├── frontend/               # Next.js Frontend
│   ├── app/               # Next.js app directory
│   │   ├── admin/         # Admin pages
│   │   ├── dashboard/     # User dashboard
│   │   ├── finance/       # Finance pages
│   │   ├── food/          # Food pages
│   │   └── analytics/     # Analytics pages
│   ├── components/        # React components
│   ├── lib/               # Utilities and API client
│   ├── Dockerfile          # Production Dockerfile
│   ├── .dockerignore       # Docker ignore patterns
│   └── package.json
├── docker-compose.yml      # Docker Compose configuration
├── database-schema.sql     # Complete database schema
├── env.example            # Environment variables template
├── .env                   # Your environment variables (create this)
├── .dockerignore          # Root Docker ignore patterns
└── README.md              # This file
```

---

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:7001/api/docs

The Swagger UI provides:
- Complete API endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication testing

### Authentication

All protected endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are automatically managed via HTTP-only cookies in the frontend.

---

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `postgres` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database username | `lifeledger` |
| `DB_PASSWORD` | Database password | `secure_password` |
| `DB_DATABASE` | Database name | `lifeledger_db` |
| `JWT_SECRET` | JWT signing secret | `strong-random-secret` |
| `JWT_REFRESH_SECRET` | JWT refresh secret | `strong-random-secret` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `PORT` | Backend port | `7001` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:7000` |
| `JWT_EXPIRES_IN` | JWT expiration | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh expiration | `7d` |
| `THROTTLE_TTL` | Rate limit window | `60` |
| `THROTTLE_LIMIT` | Rate limit max requests | `100` |

See `env.example` for a complete template.

---

## 🐳 Docker Commands

### Basic Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Rebuild and start
docker-compose up -d --build

# Remove everything (including volumes)
docker-compose down -v
```

### Service Management

```bash
# Check service status
docker-compose ps

# Execute command in container
docker exec -it lifeledger-backend npm run build
docker exec -it lifeledger-frontend npm run build

# Access container shell
docker exec -it lifeledger-backend sh
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db
```

### Database Commands

```bash
# Exec into PostgreSQL
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db

# List all tables
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db -c "\dt"

# View users
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db -c "SELECT * FROM users;"

# Backup database
docker exec lifeledger-postgres pg_dump -U lifeledger lifeledger_db > backup.sql

# Restore database
docker exec -i lifeledger-postgres psql -U lifeledger -d lifeledger_db < backup.sql
```

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check logs
docker-compose logs backend

# Check if database is ready
docker-compose ps postgres

# Verify environment variables
docker exec -it lifeledger-backend env | grep DB_
```

### Database Connection Errors

```bash
# Verify database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db -c "SELECT 1;"

# Verify credentials in .env file
cat .env | grep DB_
```

### Frontend Can't Connect to Backend

```bash
# Check backend is running
curl http://localhost:7001/health

# Verify frontend environment
docker exec -it lifeledger-frontend env | grep NEXT_PUBLIC_API_URL

# Check CORS configuration
docker-compose logs backend | grep CORS
```

### Tables Don't Exist

```bash
# Execute schema
docker cp database-schema.sql lifeledger-postgres:/tmp/schema.sql
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db -f /tmp/schema.sql

# Verify tables
docker exec -it lifeledger-postgres psql -U lifeledger -d lifeledger_db -c "\dt"
```

### Build Failures

```bash
# Clean build
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check for syntax errors
docker-compose logs backend | grep -i error
docker-compose logs frontend | grep -i error
```

### Port Already in Use

```bash
# Find process using port
lsof -i :7001
lsof -i :7000
lsof -i :5432

# Kill process (replace PID with actual process ID)
kill -9 <PID>

# Or change ports in docker-compose.yml
```

---



### Generating Strong Secrets

```bash
# Generate random JWT secret (32 characters)
openssl rand -base64 32

# Generate random database password
openssl rand -base64 24
```


---

## 📝 License

This project is licensed under the MIT License.

---

## 🆘 Support

For issues, questions, or contributions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the [API Documentation](#-api-documentation)
3. Open an issue on GitHub
4. Check existing issues for solutions

---

## 🙏 Acknowledgments

Built with:
- [NestJS](https://nestjs.com/)
- [Next.js](https://nextjs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)
- [Docker](https://www.docker.com/)

---

**Built  for personal finance management**
