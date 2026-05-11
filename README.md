# Tenant Portal - Communication & Maintenance Request System

A full-stack application that enables tenants to communicate with landlords/property managers and submit maintenance requests, while providing administrators with tools to manage these interactions efficiently.

## 🚀 Features

### Core Features
- **User Authentication**: Role-based access (Tenant, Landlord, Property Manager)
- **Messaging System**: Send/receive messages between users with conversation threading
- **Maintenance Requests**: Submit, track, and manage maintenance issues
- **Status Tracking**: Real-time status updates for maintenance requests
- **Dashboard**: Overview of messages and maintenance statistics

### User Roles
- **Tenants**: Send messages, submit maintenance requests, view their own requests
- **Landlords**: View all messages, manage maintenance requests, update statuses
- **Property Managers**: Full access to communicate and manage maintenance

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security headers
- **morgan** - HTTP request logger

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd tenant-portal
```

### 2. Database Setup

#### Install PostgreSQL
- **Windows**: Download from [PostgreSQL官网](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

#### Create Database
```sql
psql -U postgres
CREATE DATABASE tenant_portal;
\q
```

### 3. Backend Setup

#### Navigate to Backend Directory
```bash
cd backend
```

#### Install Dependencies
```bash
npm install
```

#### Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` file with your database credentials:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
DB_NAME=tenant_portal

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=development
```

#### Initialize Database
```bash
npm run init-db
```

This will:
- Create all necessary tables
- Insert sample data for testing
- Create demo users with login credentials

#### Start Backend Server
```bash
npm run dev
```

Backend will run on `http://localhost:3001`

### 4. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd frontend
```

#### Install Dependencies
```bash
npm install
```

#### Start Frontend Development Server
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 📱 Usage

### Demo Accounts
After running `npm run init-db`, you can use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Tenant | tenant@example.com | password123 |
| Landlord | landlord@example.com | password123 |
| Property Manager | manager@example.com | password123 |

### Application Flow

1. **Login/Register**: Users authenticate with their role
2. **Dashboard**: Overview of messages and maintenance requests
3. **Messages**: Send/receive messages with other users
4. **Maintenance**: Submit and track maintenance requests

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

#### Messages
- `GET /api/messages` - Get user messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation
- `GET /api/messages/users/all` - Get all users

#### Maintenance
- `GET /api/maintenance` - Get all requests (admin)
- `GET /api/maintenance/my-requests` - Get user requests (tenant)
- `POST /api/maintenance` - Create maintenance request
- `PATCH /api/maintenance/:id/status` - Update request status

## 🏗 Architecture

### Database Schema
```
users (id, name, email, password_hash, role, phone)
messages (id, sender_id, receiver_id, subject, content, created_at)
maintenance_requests (id, tenant_id, title, description, status, assigned_to)
maintenance_updates (id, request_id, updated_by, old_status, new_status, notes)
```

### Project Structure
```
tenant-portal/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Message.js
│   │   └── MaintenanceRequest.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── messages.js
│   │   └── maintenance.js
│   ├── scripts/
│   │   └── init-database.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── Messages/
│   │   │   └── Maintenance/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── ...
│   └── package.json
└── README.md
```

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start   # Uses react-scripts for hot-reload
```

### Database Reset
```bash
cd backend
npm run init-db  # Re-initializes database with sample data
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- SQL injection prevention
- Role-based access control

## 📈 System Thinking Answers

### 1. How would you improve this system to support real-time messaging?

**WebSocket Integration:**
- Implement Socket.IO for real-time bidirectional communication
- Add online/offline status indicators
- Push notifications for new messages
- Message typing indicators
- Real-time message delivery confirmations

**Technical Implementation:**
```javascript
// Backend
const io = require('socket.io')(server);
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });
  socket.on('send_message', (data) => {
    socket.to(data.roomId).emit('receive_message', data);
  });
});
```

**Benefits:**
- Instant message delivery
- Better user experience
- Reduced server polling
- Scalable architecture

### 2. What would you change if this feature had 1,000+ users?

**Performance Optimizations:**
- **Database**: Implement connection pooling, add indexes, consider read replicas
- **Caching**: Redis for session management and frequently accessed data
- **Load Balancing**: Multiple server instances behind a load balancer
- **CDN**: Static assets served via CDN
- **Pagination**: Implement cursor-based pagination for large datasets

**Architecture Changes:**
- **Microservices**: Separate messaging, maintenance, and auth services
- **Message Queue**: RabbitMQ/Redis for background job processing
- **Database Sharding**: Split users across multiple databases
- **Monitoring**: Add application monitoring and alerting

**Code Example - Pagination:**
```javascript
// Cursor-based pagination
const getMessages = async (cursor = null, limit = 20) => {
  let query = 'SELECT * FROM messages';
  if (cursor) {
    query += ' WHERE id < ?';
  }
  query += ' ORDER BY id DESC LIMIT ?';
  return await db.execute(query, cursor ? [cursor, limit] : [limit]);
};
```

### 3. How would you ensure messages or requests are not lost?

**Data Integrity Measures:**
- **Database Transactions**: Use ACID transactions for critical operations
- **Retry Logic**: Implement exponential backoff for failed operations
- **Message Queuing**: Background processing with guaranteed delivery
- **Data Validation**: Comprehensive input validation and sanitization
- **Backups**: Regular database backups and point-in-time recovery

**Implementation Example:**
```javascript
// Transaction example
const createMessage = async (messageData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Insert message
    const [result] = await connection.execute(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [messageData.sender_id, messageData.receiver_id, messageData.content]
    );
    
    // Update message count
    await connection.execute(
      'UPDATE users SET message_count = message_count + 1 WHERE id = ?',
      [messageData.receiver_id]
    );
    
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
```

**Monitoring & Alerting:**
- Database connection monitoring
- API response time tracking
- Error rate alerts
- Data consistency checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request




