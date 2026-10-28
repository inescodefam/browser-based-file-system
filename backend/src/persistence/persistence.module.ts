import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { EnvVars } from '../config/env.validation';
import { ITEM_REPOSITORY, type ItemRepository } from '../items/domain/item.repository';
import { InMemoryItemRepository } from '../items/infrastructure/in-memory-item.repository';
import { PostgresItemRepository } from '../items/infrastructure/postgres-item.repository';

@Module({
  providers: [
    {
      provide: ITEM_REPOSITORY,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars, true>): ItemRepository => {
        const driver = config.get('DB_DRIVER', { infer: true });
        switch (driver) {
          case 'memory':
            return new InMemoryItemRepository();
          case 'postgres': {
            const connectionString = config.get('DATABASE_URL', { infer: true });
            return new PostgresItemRepository(new Pool({ connectionString }));
          }
        }
      },
    },
  ],
  exports: [ITEM_REPOSITORY],
})
export class PersistenceModule {}
