const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

// Database connection
let db;

// Initialize database
async function initDatabase() {
  // Use in-memory database for testing
  const dbPath = process.env.NODE_ENV === 'test' 
    ? ':memory:' 
    : path.join(__dirname, 'database.sqlite');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create initial admin user if not exists
  const adminUser = await db.get('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
  
  if (!adminUser && process.env.NODE_ENV !== 'test') {
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    await db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Admin User', 'admin@example.com', hashedPassword, 'admin']
    );
    console.log('Admin user created');
  }
  
  return db;
}

// Get database instance
function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

// User model methods
const User = {
  findByEmail: async (email) => {
    return await getDb().get('SELECT * FROM users WHERE email = ?', [email]);
  },
  
  findById: async (id) => {
    return await getDb().get('SELECT * FROM users WHERE id = ?', [id]);
  },
  
  findAll: async () => {
    return await getDb().all('SELECT id, name, email, role, created_at, updated_at FROM users');
  },
  
  create: async (userData) => {
    const { name, email, password, role = 'user' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await getDb().run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    
    if (result.lastID) {
      return { id: result.lastID, name, email, role };
    }
    return null;
  },
  
  update: async (id, userData) => {
    const { name, email, role } = userData;
    await getDb().run(
      'UPDATE users SET name = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email, role, id]
    );
    return await User.findById(id);
  },
  
  delete: async (id) => {
    await getDb().run('DELETE FROM users WHERE id = ?', [id]);
    return { id };
  },
  
  comparePassword: async (user, candidatePassword) => {
    return await bcrypt.compare(candidatePassword, user.password);
  },
  
  // Format user object to remove password
  formatUser: (user) => {
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};

module.exports = { initDatabase, getDb, User };
