import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import {
  ItemAlreadyExistsError,
  ItemNotFoundError,
  ParentIsNotFolderError,
  ParentNotFoundError,
} from './domain/item.errors';

type ItemDomainError =
  | ItemAlreadyExistsError
  | ItemNotFoundError
  | ParentIsNotFolderError
  | ParentNotFoundError;

@Catch(ItemAlreadyExistsError, ItemNotFoundError, ParentIsNotFolderError, ParentNotFoundError)
export class ItemErrorsFilter extends BaseExceptionFilter {
  override catch(error: ItemDomainError, host: ArgumentsHost): void {
    super.catch(this.toHttpException(error), host);
  }

  private toHttpException(error: ItemDomainError): HttpException {
    if (error instanceof ItemAlreadyExistsError) return new ConflictException(error.message);
    if (error instanceof ParentIsNotFolderError) return new BadRequestException(error.message);
    return new NotFoundException(error.message);
  }
}
