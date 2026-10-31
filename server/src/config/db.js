const { Sequelize } = require('sequelize');

// Neon (Postgres). Use the POOLED connection string (host contains "-pooler")
// for the running app. Set DB_SSL=false only for a local Postgres without TLS.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const useSsl = process.env.DB_SSL !== 'false';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: useSsl
    ? { ssl: { require: true, rejectUnauthorized: true } }
    : {},
  pool: {
    max:     10,
    min:     0,
    acquire: 30000,
    idle:    10000,
  },
});

module.exports = sequelize;
