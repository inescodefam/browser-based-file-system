import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { NodesModule } from './nodes/nodes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
      validationSchema: envValidationSchema,
    }),
    NodesModule,
  ],
})
export class AppModule {}
