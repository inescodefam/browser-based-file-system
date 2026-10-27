import Joi from 'joi';

export interface EnvVars {
  PORT: number;
  SEARCH_LIMIT: number;
  NAME_MAX_LENGTH: number;
  DB_DRIVER: 'memory' | 'postgres';
  DATABASE_URL?: string;
}

export const envValidationSchema = Joi.object<EnvVars>({
  PORT: Joi.number().port().default(3000),
  SEARCH_LIMIT: Joi.number().integer().min(1).max(100).default(10),
  NAME_MAX_LENGTH: Joi.number().integer().min(1).max(255).default(255),
  DB_DRIVER: Joi.string().valid('memory', 'postgres').default('memory'),
  DATABASE_URL: Joi.string().when('DB_DRIVER', {
    is: 'postgres',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});