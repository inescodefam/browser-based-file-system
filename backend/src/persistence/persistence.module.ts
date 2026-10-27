import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from '../config/env.validation';
import { NODE_REPOSITORY, type NodeRepository } from '../nodes/domain/node.repository';
import { InMemoryNodeRepository } from '../nodes/infrastructure/in-memory-node.repository';

@Module({
  providers: [
    {
      provide: NODE_REPOSITORY,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars, true>): NodeRepository => {
        const driver = config.get('DB_DRIVER', { infer: true });
        switch (driver) {
          case 'memory':
            return new InMemoryNodeRepository();
          case 'postgres':
            throw new Error('DB_DRIVER=postgres is not implemented yet');
        }
      },
    },
  ],
  exports: [NODE_REPOSITORY],
})
export class PersistenceModule {}
