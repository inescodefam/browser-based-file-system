import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fileSystemItemsApi } from '../../api/fileSystemItems'
import { ApiError } from '../../api/http'
import { installMockBackend } from '../../test/mockBackend'
import { renderWithProviders } from '../../test/renderWithProviders'
import { ExplorerPage } from './ExplorerPage'

vi.mock('../../api/fileSystemItems')
const api = vi.mocked(fileSystemItemsApi)

const AFTER_DEBOUNCE = { timeout: 3000 }

let backend: ReturnType<typeof installMockBackend>

beforeEach(() => {
  backend = installMockBackend(api)
  const docs = backend.add('docs', 'folder')
  backend.add('report.pdf', 'file')
  backend.add('report.pdf', 'file', docs.id)
  backend.add('report-2.pdf', 'file')
  backend.add('Report.txt', 'file')
  backend.add('notes.txt', 'file')
})

const searchInput = () => screen.getByRole('combobox', { name: 'Search files' })

describe('search box', () => {
  it('waits for the user to stop typing before asking for suggestions', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'rep')

    expect(api.suggest).not.toHaveBeenCalled()
    await waitFor(() => expect(api.suggest).toHaveBeenCalledTimes(1), AFTER_DEBOUNCE)
    expect(api.suggest).toHaveBeenCalledWith('rep', expect.anything())
  })

  it('shows each suggested name once, in the order the backend returned them', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'report')

    const options = await screen.findAllByRole('option', undefined, AFTER_DEBOUNCE)
    expect(options.map((option) => option.textContent)).toEqual(['report-2.pdf', 'report.pdf'])
  })

  it('does not ask for suggestions when the box is empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'a')
    await user.clear(searchInput())

    await new Promise((resolve) => setTimeout(resolve, 700))
    expect(api.suggest).not.toHaveBeenCalledWith('', expect.anything())
  })

  it('runs the exact-name search when a suggestion is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.type(searchInput(), 'report')

    await user.click(await screen.findByRole('option', { name: 'report.pdf' }, AFTER_DEBOUNCE))

    expect(api.searchByName).toHaveBeenCalledWith('report.pdf', null, expect.anything())
    expect(await screen.findByText('Files named "report.pdf" everywhere')).toBeInTheDocument()
    const rows = within(screen.getByRole('table', { name: 'Search results' })).getAllByRole('row')
    expect(rows).toHaveLength(3)
  })

  it('runs the exact-name search on Enter', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'notes.txt{Enter}')

    expect(await screen.findByText('Files named "notes.txt" everywhere')).toBeInTheDocument()
    expect(api.searchByName).toHaveBeenCalledWith('notes.txt', null, expect.anything())
  })

  it('finds nothing for a name that only matches in another case', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'REPORT.TXT{Enter}')

    expect(await screen.findByText('No file with exactly this name.')).toBeInTheDocument()
  })

  it('can limit the search to the folder you are in', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.click(await screen.findByRole('button', { name: 'docs' }))
    await screen.findByText('report.pdf')

    await user.click(screen.getByRole('checkbox', { name: 'Only search in "docs"' }))
    await user.type(searchInput(), 'report.pdf{Enter}')

    expect(await screen.findByText('Files named "report.pdf" in the selected folder')).toBeInTheDocument()
    expect(api.searchByName).toHaveBeenCalledWith('report.pdf', 'id-1', expect.anything())
    expect(within(screen.getByRole('table', { name: 'Search results' })).getAllByRole('row')).toHaveLength(2)
  })

  it('only offers the folder checkbox when you are inside a folder', async () => {
    renderWithProviders(<ExplorerPage />)
    await screen.findByText('notes.txt')

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('shows the backend error when the search fails', async () => {
    api.searchByName.mockRejectedValue(new ApiError(400, 'Name must be at most 255 characters long.'))
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'x{Enter}')

    expect(await screen.findByText('Name must be at most 255 characters long.')).toBeInTheDocument()
  })

  it('hides the results when the search is cleared', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.type(searchInput(), 'notes.txt{Enter}')
    await screen.findByText('Files named "notes.txt" everywhere')

    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(screen.queryByText('Files named "notes.txt" everywhere')).not.toBeInTheDocument()
  })

  it('refreshes the results after something is created', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.type(searchInput(), 'notes.txt{Enter}')
    const resultsTable = await screen.findByRole('table', { name: 'Search results' })
    expect(within(resultsTable).getAllByRole('row')).toHaveLength(2)

    backend.add('notes.txt', 'file', 'id-1')
    await user.click(screen.getByRole('radio', { name: 'File' }))
    await user.type(screen.getByLabelText('Name'), 'new.txt')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(api.searchByName).toHaveBeenCalledTimes(2))
  })
})
