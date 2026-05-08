require('dotenv').config();
const { Pool } = require('pg');

async function initializeDatabase() {
  const connection = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres' // Connect to default database first
  });

  try {
    console.log('🗄️  Creating PostgreSQL database...');
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE ${process.env.DB_NAME || 'tenant_portal'}`);
    console.log('✅ Database created successfully');
    
    // Close connection to default database
    await connection.end();
    
    // Connect to the new database
    const db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'tenant_portal'
    });
    
    console.log('📋 Creating tables...');

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('tenant', 'landlord', 'property_manager')),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255),
        content TEXT NOT NULL,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Messages table created');

    // Create maintenance_requests table
    await db.query(`
      CREATE TABLE IF NOT EXISTS maintenance_requests (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'pending', 'in_progress', 'completed')),
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Maintenance requests table created');

    // Create maintenance_updates table
    await db.query(`
      CREATE TABLE IF NOT EXISTS maintenance_updates (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
        updated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        old_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Maintenance updates table created');

    console.log('🎉 PostgreSQL database initialization completed successfully!');
    
    // Create sample data
    await createSampleData(db);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function createSampleData(db) {
  console.log('📝 Creating sample data...');
  
  const bcrypt = require('bcryptjs');
  
  try {
    // Create sample users
    const passwordHash = await bcrypt.hash('password123', 12);

    const userResult = await db.query(`
      INSERT INTO users (name, email, password_hash, role, phone) VALUES
      ($1, $2, $3, $4, $5),
      ($6, $7, $8, $9, $10),
      ($11, $12, $13, $14, $15)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [
      'John Tenant', 'tenant@example.com', passwordHash, 'tenant', '+1234567890',
      'Jane Landlord', 'landlord@example.com', passwordHash, 'landlord', '+1234567891',
      'Mike Manager', 'manager@example.com', passwordHash, 'property_manager', '+1234567892'
    ]);

    console.log('✅ Sample users created');

    // Get user IDs
    const users = await db.query('SELECT id, email FROM users ORDER BY id');
    const tenantId = users.rows.find(u => u.email === 'tenant@example.com')?.id;
    const landlordId = users.rows.find(u => u.email === 'landlord@example.com')?.id;
    const managerId = users.rows.find(u => u.email === 'manager@example.com')?.id;

    if (tenantId && landlordId) {
      // Create sample messages
      await db.query(`
        INSERT INTO messages (sender_id, receiver_id, subject, content) VALUES
        ($1, $2, 'Leak in bathroom', 'There is a water leak in the bathroom that needs immediate attention.'),
        ($2, $1, 'Re: Leak in bathroom', 'I will send a plumber to fix the leak tomorrow morning.')
        ON CONFLICT DO NOTHING
      `, [tenantId, landlordId]);
      console.log('✅ Sample messages created');
    }

    if (tenantId) {
      // Create sample maintenance requests
      await db.query(`
        INSERT INTO maintenance_requests (tenant_id, title, description, status, assigned_to) VALUES
        ($1, 'Broken Air Conditioner', 'The AC unit in the living room is not cooling properly. It makes strange noises.', 'in_progress', $2),
        ($1, 'Kitchen Sink Clog', 'The kitchen sink is draining very slowly and sometimes backs up.', 'open', NULL)
        ON CONFLICT DO NOTHING
      `, [tenantId, managerId]);
      console.log('✅ Sample maintenance requests created');
    }

    console.log('🎉 Sample data created successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('Tenant: tenant@example.com / password123');
    console.log('Landlord: landlord@example.com / password123');
    console.log('Property Manager: manager@example.com / password123');
    
  } catch (error) {
    console.error('⚠️  Warning: Could not create sample data:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase, createSampleData };
