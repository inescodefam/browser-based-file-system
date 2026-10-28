import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from './http'

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a GET with the query string and returns the parsed JSON', async () => {
    const fetchMock = mockFetch(json([{ id: '1' }]))

    const result = await request('/files/search', { query: { name: 'a b.txt', parentId: undefined } })

    expect(result).toEqual([{ id: '1' }])
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/files\/search\?name=a\+b\.txt$/) // undefined parentId is left out
    expect(init.method).toBe('GET')
  })

  it('sends a JSON body with a POST', async () => {
    const fetchMock = mockFetch(json({ id: '1' }, 201))

    await request('/folders', { method: 'POST', body: { name: 'docs' } })

    const init = fetchMock.mock.calls[0][1]
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(init.body).toBe('{"name":"docs"}')
  })

  it('returns undefined for 204 No Content', async () => {
    mockFetch(new Response(null, { status: 204 }))

    await expect(request('/nodes/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('throws an ApiError with the status and a joined validation message', async () => {
    mockFetch(json({ message: ['Name is too long', 'Name is empty'], statusCode: 400 }, 400))

    const error = await request('/folders', { method: 'POST', body: {} }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, message: 'Name is too long. Name is empty' })
  })

  it('uses the backend message for a conflict', async () => {
    mockFetch(json({ message: 'A node named "docs" already exists in this folder' }, 409))

    await expect(request('/folders', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 409,
      message: 'A node named "docs" already exists in this folder',
    })
  })

  it('falls back to a generic message when the body is not JSON', async () => {
    mockFetch(new Response('Bad gateway', { status: 502 }))

    await expect(request('/nodes')).rejects.toMatchObject({
      status: 502,
      message: 'Request failed (502)',
    })
  })
})
