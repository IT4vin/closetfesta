const bcrypt = require('bcrypt');

const up = async (database) => {
  await database.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `);

  await database.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)
  `);

  await database.query(`
    CREATE INDEX IF NOT EXISTS idx_users_deleted ON users (deleted_at)
  `);

  try {
    const existingAdmin = await database.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@closetfesta.com']
    );

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await database.query(
        `
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        `,
        [
          'Administrador',
          'admin@closetfesta.com',
          hashedPassword,
          'admin'
        ]
      );

      console.log('✅ Usuário administrador padrão criado');
    }
  } catch (error) {
    console.log('⚠️ Usuário admin pode já existir...');
  }

  console.log('✅ Migração executada: Tabela de usuários criada');
};

const down = async (database) => {
  await database.query('DROP TABLE IF EXISTS users');
  console.log('✅ Rollback executado: Tabela de usuários removida');
};

module.exports = { up, down };