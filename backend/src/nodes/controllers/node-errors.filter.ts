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
  NodeAlreadyExistsError,
  NodeNotFoundError,
  ParentIsNotFolderError,
  ParentNotFoundError,
} from '../domain/node.errors';

type NodeDomainError =
  | NodeAlreadyExistsError
  | NodeNotFoundError
  | ParentIsNotFolderError
  | ParentNotFoundError;

@Catch(NodeAlreadyExistsError, NodeNotFoundError, ParentIsNotFolderError, ParentNotFoundError)
export class NodeErrorsFilter extends BaseExceptionFilter {
  override catch(error: NodeDomainError, host: ArgumentsHost): void {
    super.catch(this.toHttpException(error), host);
  }

  private toHttpException(error: NodeDomainError): HttpException {
    if (error instanceof NodeAlreadyExistsError) return new ConflictException(error.message);
    if (error instanceof ParentIsNotFolderError) return new BadRequestException(error.message);
    return new NotFoundException(error.message);
  }
}
