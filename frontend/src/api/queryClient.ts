import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './http'

const THIRTY_SECONDS = 30_000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: THIRTY_SECONDS,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 1,
    },
  },
})
