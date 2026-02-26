import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  // Support both standard variables and Neon/Vercel specific ones
  host: process.env.POSTGRES_HOST || process.env.PGHOST || process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username:
    process.env.POSTGRES_USER || process.env.PGUSER || process.env.DB_USER,
  password:
    process.env.POSTGRES_PASSWORD ||
    process.env.PGPASSWORD ||
    process.env.DB_PASSWORD,
  database:
    process.env.POSTGRES_DATABASE ||
    process.env.PGDATABASE ||
    process.env.DB_NAME,
  synchronize: !isProduction,
  logging: false,
  entities: [path.join(__dirname, '/../entities/**/*.{ts,js}')],
  subscribers: [],
  migrations: [],
  extra: isProduction
    ? {
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {},
});
