import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { EnvVars } from '../../../config/env.validation';

@ValidatorConstraint({ name: 'nameMaxLength', async: false })
@Injectable()
export class NameMaxLengthConstraint implements ValidatorConstraintInterface {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService<EnvVars, true>,
  ) {}

  validate(value: unknown): boolean {
    return typeof value === 'string' && value.length <= this.maxLength;
  }

  defaultMessage(): string {
    return `Name must be at most ${this.maxLength} characters long.`;
  }

  private get maxLength(): number {
    return this.config.get('NAME_MAX_LENGTH', { infer: true });
  }
}

export function NameMaxLength(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyKey) => {
    registerDecorator({
      target: target.constructor,
      propertyName: propertyKey as string,
      options,
      constraints: [],
      validator: NameMaxLengthConstraint,
    });
  };
}
