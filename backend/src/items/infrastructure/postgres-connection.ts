const LOOSE_SSLMODE = /([?&])sslmode=(?:prefer|require|verify-ca)(?=&|$)/

export const postgresConnectionString = (connectionString: string): string =>
  connectionString.replace(LOOSE_SSLMODE, '$1sslmode=verify-full')
