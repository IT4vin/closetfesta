const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const up = async (database) => {
  await database.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      last_login TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    )
  `);

  // Índices para performance
  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_users_deleted ON users (deleted_at)
  `);

  // Criar usuário admin padrão se não existir
  try {
    const existingAdmin = await database.query(
      'SELECT id FROM users WHERE email = ?',
      ['admin@closetfesta.com']
    );

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminId = uuidv4();
      const now = new Date().toISOString();

      await database.query(`
        INSERT INTO users (id, name, email, password, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        adminId,
        'Administrador',
        'admin@closetfesta.com',
        hashedPassword,
        'admin',
        now,
        now
      ]);

      console.log('✅ Usuário administrador padrão criado: admin@closetfesta.com / admin123');
    }
  } catch (error) {
    console.log('⚠️  Usuário admin pode já existir, pulando criação...');
  }

  console.log('✅ Migração executada: Tabela de usuários criada');
};

const down = async (database) => {
  await database.query('DROP TABLE IF EXISTS users');
  console.log('✅ Rollback executado: Tabela de usuários removida');
};

module.exports = { up, down }; 