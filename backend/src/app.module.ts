import { Module } from '@nestjs/common';
import { envValidationSchema } from './config/env.validation.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
      validationSchema: envValidationSchema,
    }),
  ],
  
})
export class AppModule {}
