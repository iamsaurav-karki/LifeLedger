-- LifeLedger Database Schema
-- Execute this script inside PostgreSQL to create all tables

-- Create ENUM types
CREATE TYPE users_role_enum AS ENUM ('USER', 'ADMIN');
CREATE TYPE users_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE categories_type_enum AS ENUM ('expense', 'food', 'investment');
CREATE TYPE investments_type_enum AS ENUM ('stock', 'bond', 'mutual_fund', 'sip', 'cid', 'ssf', 'crypto', 'real_estate', 'fixed_deposit', 'other');
CREATE TYPE payment_method_enum AS ENUM ('cash', 'card', 'bank_transfer', 'upi', 'digital_wallet', 'cheque', 'other');
CREATE TYPE recurring_frequency_enum AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');

-- ============================================
-- USERS TABLE
-- ============================================
-- Note: When a user is deleted, all related data (expenses, incomes, investments, etc.)
-- will be automatically deleted due to CASCADE constraints.
-- Admin users are protected from deletion at the application level.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    "passwordHash" VARCHAR NOT NULL,
    role users_role_enum NOT NULL DEFAULT 'USER',
    status users_status_enum NOT NULL DEFAULT 'ACTIVE',
    "lastLogin" TIMESTAMP,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type categories_type_enum NOT NULL,
    name VARCHAR NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR,
    "paymentMethod" payment_method_enum,
    tags VARCHAR[], -- Array of tags
    date DATE NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- CASCADE: When user is deleted, all their expenses are automatically deleted
    CONSTRAINT fk_expenses_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_expenses_category FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE INDEX idx_expenses_user_date ON expenses("userId", date);
CREATE INDEX idx_expenses_date ON expenses(date);

-- ============================================
-- INCOMES TABLE
-- ============================================
CREATE TABLE incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    source VARCHAR,
    description VARCHAR,
    "paymentMethod" payment_method_enum,
    tags VARCHAR[], -- Array of tags
    date DATE NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- CASCADE: When user is deleted, all their incomes are automatically deleted
    CONSTRAINT fk_incomes_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_incomes_user_date ON incomes("userId", date);
CREATE INDEX idx_incomes_date ON incomes(date);

-- ============================================
-- INVESTMENTS TABLE
-- ============================================
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "categoryId" UUID,
    type investments_type_enum NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    "currentValue" DECIMAL(10, 2),
    name VARCHAR,
    description VARCHAR,
    date DATE NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- CASCADE: When user is deleted, all their investments are automatically deleted
    CONSTRAINT fk_investments_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_investments_category FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_investments_user_date ON investments("userId", date);
CREATE INDEX idx_investments_date ON investments(date);

-- ============================================
-- FOOD_LOGS TABLE
-- ============================================
CREATE TABLE food_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "categoryId" UUID,
    cost DECIMAL(10, 2), -- Optional: Can be NULL for home-cooked meals or free meals
    "foodName" VARCHAR,
    "mealType" VARCHAR,
    calories INTEGER,
    date DATE NOT NULL,
    description VARCHAR,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- CASCADE: When user is deleted, all their food logs are automatically deleted
    CONSTRAINT fk_food_logs_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_food_logs_category FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_food_logs_user_date ON food_logs("userId", date);
CREATE INDEX idx_food_logs_date ON food_logs(date);

-- ============================================
-- ADMIN_AUDIT_LOGS TABLE
-- ============================================
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "adminId" UUID NOT NULL,
    action VARCHAR NOT NULL,
    target VARCHAR,
    ip VARCHAR,
    metadata JSONB,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- CASCADE: When admin user is deleted, all their audit logs are automatically deleted
    CONSTRAINT fk_admin_audit_logs_admin FOREIGN KEY ("adminId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_audit_logs_admin_created ON admin_audit_logs("adminId", "createdAt");

-- ============================================
-- SYSTEM_SETTINGS TABLE
-- ============================================
CREATE TABLE system_settings (
    key VARCHAR PRIMARY KEY,
    value TEXT NOT NULL,
    "updatedBy" UUID,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- SET NULL: When user is deleted, the updatedBy field is set to NULL (preserves setting history)
    CONSTRAINT fk_system_settings_updated_by FOREIGN KEY ("updatedBy") REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- LENDINGS TABLE (Lending/Borrowing Tracking)
-- ============================================
CREATE TYPE lendings_type_enum AS ENUM ('lend', 'borrow');
CREATE TYPE lendings_status_enum AS ENUM ('pending', 'partially_paid', 'paid', 'cancelled');

CREATE TABLE lendings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    type lendings_type_enum NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    "paidAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "personName" VARCHAR NOT NULL,
    description VARCHAR,
    "workDescription" VARCHAR,
    date DATE NOT NULL,
    "dueDate" DATE,
    status lendings_status_enum NOT NULL DEFAULT 'pending',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- CASCADE: When user is deleted, all their lending/borrowing records are automatically deleted
    CONSTRAINT fk_lendings_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_lendings_user_date ON lendings("userId", date);
CREATE INDEX idx_lendings_date ON lendings(date);

-- ============================================
-- RECURRING TRANSACTIONS TABLE
-- ============================================
CREATE TYPE transaction_type_enum AS ENUM ('expense', 'income');

CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    type transaction_type_enum NOT NULL,
    "categoryId" UUID, -- For expenses
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR,
    source VARCHAR, -- For income
    "paymentMethod" payment_method_enum,
    frequency recurring_frequency_enum NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE, -- NULL means no end date
    "nextDueDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- CASCADE: When user is deleted, all their recurring transactions are automatically deleted
    CONSTRAINT fk_recurring_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_recurring_category FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_recurring_user ON recurring_transactions("userId");
CREATE INDEX idx_recurring_next_due ON recurring_transactions("nextDueDate");

-- ============================================
-- BUDGETS TABLE
-- ============================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "spentAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- CASCADE: When user is deleted, all their budgets are automatically deleted
    CONSTRAINT fk_budgets_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_budgets_category FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_budgets_user ON budgets("userId");
CREATE INDEX idx_budgets_dates ON budgets("startDate", "endDate");

-- ============================================
-- USER DELETION BEHAVIOR
-- ============================================
-- When a user is deleted (hard delete):
-- 1. All expenses, incomes, investments, food_logs, lendings, recurring_transactions,
--    and budgets are automatically deleted (CASCADE)
-- 2. Admin audit logs created by that user are automatically deleted (CASCADE)
-- 3. System settings updatedBy field is set to NULL (SET NULL)
-- 4. Admin users are protected from deletion at the application level
--
-- IMPORTANT: User deletion is permanent and cannot be undone.
-- All user data and related records will be permanently removed.

-- ============================================
-- ADMIN USER CREATION
-- ============================================
-- After creating the schema, you need to create an admin user.
-- IMPORTANT: The password hash in the database must match the password you use to log in.
-- Follow these steps:

-- STEP 1: Enable pgcrypto extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- STEP 2: Generate password hash for your desired password
-- Example: To generate hash for password '@Saurav@123':
-- SELECT crypt('@Saurav@123', gen_salt('bf', 10));
-- 
-- Copy the generated hash (it will look like: $2a$10$...)
-- IMPORTANT: Remember the password you used - you'll need it to log in!

-- STEP 3: Create admin user with the generated hash
-- INSERT INTO users (
--     name,
--     email,
--     "passwordHash",
--     role,
--     status,
--     "emailVerified",
--     "createdAt",
--     "updatedAt"
-- ) VALUES (
--     'Admin User',
--     'admin@example.com',
--     'PASTE_GENERATED_HASH_FROM_STEP_2_HERE',  -- Use the hash from step 2
--     'ADMIN',
--     'ACTIVE',
--     true,
--     CURRENT_TIMESTAMP,
--     CURRENT_TIMESTAMP
-- );

-- STEP 4: Verify admin user was created
-- SELECT id, name, email, role, status FROM users WHERE role = 'ADMIN';

-- NOTE: When logging in, use the SAME password you used in STEP 2 to generate the hash.
-- The authentication system compares your entered password with the stored hash.

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these commands to verify tables were created:
-- \dt
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

