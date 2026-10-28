import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PersistenceModule } from '../persistence/persistence.module';
import { NameMaxLengthConstraint } from './dto/decorators/name-max-length.constraint';
import { FilesController } from './controllers/files.controller';
import { FoldersController } from './controllers/folders.controller';
import { NodeErrorsFilter } from './controllers/node-errors.filter';
import { NodesController } from './controllers/nodes.controller';
import { NodesService } from './nodes.service';

@Module({
  imports: [PersistenceModule],
  controllers: [NodesController, FoldersController, FilesController],
  providers: [
    NodesService,
    NameMaxLengthConstraint,
    { provide: APP_FILTER, useClass: NodeErrorsFilter },
  ],
})
export class NodesModule {}
