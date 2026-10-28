import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PersistenceModule } from '../persistence/persistence.module';
import { NameMaxLengthConstraint } from './dto/decorators/name-max-length.constraint';
import { FilesController } from './controllers/files.controller';
import { FoldersController } from './controllers/folders.controller';
import { ItemErrorsFilter } from './controllers/item-errors.filter';
import { ItemsController } from './controllers/items.controller';
import { ItemsService } from './items.service';

@Module({
  imports: [PersistenceModule],
  controllers: [ItemsController, FoldersController, FilesController],
  providers: [
    ItemsService,
    NameMaxLengthConstraint,
    { provide: APP_FILTER, useClass: ItemErrorsFilter },
  ],
})
export class ItemsModule {}
