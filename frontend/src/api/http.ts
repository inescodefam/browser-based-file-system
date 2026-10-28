import { API_URL } from '../config'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  query?: Record<string, string | undefined> 
  signal?: AbortSignal 
}

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const { message } = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(message)) return message.join('. ')
    if (message) return message
  } catch {
  }
  return `Request failed (${response.status})`
}

export const request = async <T>(path: string, options: RequestOptions): Promise<T> => {
  const { method, body, query = {}, signal } = options

  const url = new URL(path, API_URL)
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
