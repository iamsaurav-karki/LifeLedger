import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { Injectable } from '@nestjs/common';

config();

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'lifeledger',
      password: process.env.DB_PASSWORD || 'lifeledger_password',
      database: process.env.DB_DATABASE || 'lifeledger_db',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
      synchronize: false, // Disabled - tables will be created manually
      logging: process.env.NODE_ENV === 'development',
    };
  }
}

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'lifeledger',
  password: process.env.DB_PASSWORD || 'lifeledger_password',
  database: process.env.DB_DATABASE || 'lifeledger_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false, // Disabled - tables will be created manually
  logging: process.env.NODE_ENV === 'development',
};

export default new DataSource(databaseConfig as DataSourceOptions);
