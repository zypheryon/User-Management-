const { initDatabase, User } = require('../database');
const bcrypt = require('bcryptjs');

let db;

beforeAll(async () => {
  // Use in-memory SQLite for testing
  process.env.NODE_ENV = 'test';
  db = await initDatabase();
});

afterAll(async () => {
  await db.close();
});

describe('Database', () => {
  it('should create a user', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const user = await User.create(userData);
    
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
  });
  
  it('should find a user by email', async () => {
    const email = 'test@example.com';
    const user = await User.findByEmail(email);
    
    expect(user).toBeDefined();
    expect(user.email).toBe(email);
  });
  
  it('should correctly compare passwords', async () => {
    const email = 'test@example.com';
    const user = await User.findByEmail(email);
    
    const isValid = await User.comparePassword(user, 'password123');
    expect(isValid).toBe(true);
    
    const isInvalid = await User.comparePassword(user, 'wrongpassword');
    expect(isInvalid).toBe(false);
  });
  
  it('should update a user', async () => {
    const user = await User.findByEmail('test@example.com');
    
    const updatedUser = await User.update(user.id, {
      name: 'Updated Name',
      email: user.email,
      role: user.role
    });
    
    expect(updatedUser.name).toBe('Updated Name');
  });
  
  it('should delete a user', async () => {
    const user = await User.findByEmail('test@example.com');
    
    await User.delete(user.id);
    
    const deletedUser = await User.findById(user.id);
    expect(deletedUser).toBeUndefined();
  });
});
