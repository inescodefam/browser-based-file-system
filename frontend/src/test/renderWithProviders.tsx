import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

export const renderWithProviders = (
  ui: ReactElement,
  { initialUrl = '/' }: { initialUrl?: string } = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const router = createMemoryRouter(
    [
      { path: '/', element: ui },
      { path: '/folders/:folderId', element: ui },
    ],
    { initialEntries: [initialUrl] },
  )

  return {
    ...render(
      <MantineProvider env="test">
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </MantineProvider>,
    ),
    router,
  }
}
