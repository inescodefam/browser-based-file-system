import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { NameMaxLengthConstraint } from './dto/decorators/name-max-length.constraint';
import { FilesController } from './controllers/files.controller';
import { FoldersController } from './controllers/folders.controller';
import { NodesController } from './controllers/nodes.controller';
import { NodesService } from './nodes.service';

@Module({
  imports: [PersistenceModule],
  controllers: [NodesController, FoldersController, FilesController],
  providers: [NodesService, NameMaxLengthConstraint],
})
export class NodesModule {}
