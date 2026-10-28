import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fileSystemItemsApi } from '../../../api/fileSystemItems'
import { ApiError } from '../../../api/http'
import { installMockBackend } from '../../../test/mockBackend'
import { renderWithProviders } from '../../../test/renderWithProviders'
import { SEARCH_FOLDER_PARAM, SEARCH_MATCH_PARAM, SEARCH_QUERY_PARAM } from './constants'
import { ExplorerPage } from '../ExplorerPage'

vi.mock('../../../api/fileSystemItems')
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
const searchTree = () => screen.getByRole('tree', { name: 'Search results' })
const folderTree = () => screen.getByRole('tree', { name: 'Files and folders' })
const folderCheckbox = () => screen.findByRole('checkbox', { name: 'Only search in "docs"' })

const searchTreeNames = () =>
  within(searchTree())
    .getAllByRole('button', { name: /Delete / })
    .map((button) => button.getAttribute('aria-label')!.replace(/^Delete /, ''))

describe('search box', () => {
  it('has no Search button', () => {
    renderWithProviders(<ExplorerPage />)

    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument()
  })

  it('waits for the user to stop typing before asking for suggestions', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'rep')

    expect(api.suggest).not.toHaveBeenCalled()
    await waitFor(() => expect(api.suggest).toHaveBeenCalledTimes(1), AFTER_DEBOUNCE)
    expect(api.suggest).toHaveBeenCalledWith('rep', undefined, expect.anything())
  })

  it('shows each suggested name once in the box, in the order the backend returned them', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'report')

    const options = await screen.findAllByRole('option', undefined, AFTER_DEBOUNCE)
    expect(options.map((option) => option.textContent)).toEqual(['report-2.pdf', 'report.pdf'])
  })

  it('replaces the folder tree with the top 10 files that start with what was typed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'report')

    expect(await screen.findByText('Files starting with "report"', undefined, AFTER_DEBOUNCE)).toBeInTheDocument()
    expect(searchTreeNames()).toEqual(['report-2.pdf', 'report.pdf', 'report.pdf'])
    expect(screen.queryByRole('tree', { name: 'Files and folders' })).not.toBeInTheDocument()
  })

  it('does not ask for suggestions when the box is empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'a')
    await user.clear(searchInput())

    await new Promise((resolve) => setTimeout(resolve, 700))
    expect(api.suggest).not.toHaveBeenCalledWith('', expect.anything())
    expect(api.suggest).not.toHaveBeenCalledWith('', undefined, expect.anything())
  })

  it('runs the exact-name search when a suggestion is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.type(searchInput(), 'report')

    await user.click(await screen.findByRole('option', { name: 'report.pdf' }, AFTER_DEBOUNCE))

    await waitFor(() =>
      expect(api.searchByName).toHaveBeenCalledWith('report.pdf', undefined, expect.anything()),
    )
    expect(await screen.findByText('Files named "report.pdf" in all files')).toBeInTheDocument()
    expect(searchTreeNames()).toEqual(['report.pdf', 'report.pdf'])
  })

  it('runs the exact-name search on Enter', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'notes.txt{Enter}')

    expect(await screen.findByText('Files named "notes.txt" in all files')).toBeInTheDocument()
    expect(api.searchByName).toHaveBeenCalledWith('notes.txt', undefined, expect.anything())
    expect(searchTreeNames()).toEqual(['notes.txt'])
  })

  it('finds nothing for a name that only matches in another case', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'REPORT.TXT{Enter}')

    expect(await screen.findByText('No file with exactly this name.')).toBeInTheDocument()
  })

  it('limits prefix results to the folder when the checkbox is checked while typing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.dblClick(await screen.findByText('docs'))
    await user.click(await folderCheckbox())
    await user.type(searchInput(), 'report')

    expect(
      await screen.findByText('Files starting with "report" in the selected folder', undefined, AFTER_DEBOUNCE),
    ).toBeInTheDocument()
    expect(api.suggest).toHaveBeenCalledWith('report', 'id-1', expect.anything())
    expect(searchTreeNames()).toEqual(['report.pdf'])
  })

  it('scopes the current prefix results when the checkbox is checked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.dblClick(await screen.findByText('docs'))
    await user.type(searchInput(), 'report')
    expect(await screen.findByText('Files starting with "report"', undefined, AFTER_DEBOUNCE)).toBeInTheDocument()
    expect(searchTreeNames()).toEqual(['report-2.pdf', 'report.pdf', 'report.pdf'])

    await user.click(await folderCheckbox())

    await waitFor(() => expect(searchTreeNames()).toEqual(['report.pdf']))
    expect(screen.getByText('Files starting with "report" in the selected folder')).toBeInTheDocument()
  })

  it('can limit the exact search to the folder you are in', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.dblClick(await screen.findByText('docs'))
    await screen.findByRole('checkbox', { name: 'Only search in "docs"' })

    await user.click(await folderCheckbox())
    await user.type(searchInput(), 'report.pdf{Enter}')

    expect(await screen.findByText('Files named "report.pdf" in the selected folder')).toBeInTheDocument()
    expect(api.searchByName).toHaveBeenCalledWith('report.pdf', 'id-1', expect.anything())
    expect(searchTreeNames()).toEqual(['report.pdf'])
  })

  it('shows exact matches in all files again when the checkbox is unchecked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.dblClick(await screen.findByText('docs'))
    await user.click(await folderCheckbox())
    await user.type(searchInput(), 'report.pdf{Enter}')
    expect(await screen.findByText('Files named "report.pdf" in the selected folder')).toBeInTheDocument()
    expect(searchTreeNames()).toEqual(['report.pdf'])

    await user.click(await folderCheckbox())

    expect(await screen.findByText('Files named "report.pdf" in all files')).toBeInTheDocument()
    expect(api.searchByName).toHaveBeenCalledWith('report.pdf', undefined, expect.anything())
    await waitFor(() => expect(searchTreeNames()).toEqual(['report.pdf', 'report.pdf']))
  })

  it('disables the folder checkbox at All items', async () => {
    renderWithProviders(<ExplorerPage />)
    await screen.findByText('notes.txt')

    expect(screen.getByRole('checkbox', { name: 'Searching all items' })).toBeDisabled()
  })

  it('shows the backend error when the search fails', async () => {
    api.searchByName.mockRejectedValue(new ApiError(400, 'Name must be at most 255 characters long.'))
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'x{Enter}')

    expect(await screen.findByText('Name must be at most 255 characters long.')).toBeInTheDocument()
  })

  it('restores the folder tree when the box is cleared', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.type(searchInput(), 'notes.txt{Enter}')
    await screen.findByText('Files named "notes.txt" in all files')

    await user.clear(searchInput())

    await waitFor(() => expect(folderTree()).toBeInTheDocument())
    expect(screen.queryByRole('tree', { name: 'Search results' })).not.toBeInTheDocument()
  })

  it('clears the search from the X in the box', async () => {
    const user = userEvent.setup()
    const { router } = renderWithProviders(<ExplorerPage />)
    await user.type(searchInput(), 'notes.txt{Enter}')
    await screen.findByText('Files named "notes.txt" in all files')

    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    await waitFor(() => expect(folderTree()).toBeInTheDocument())
    expect(searchInput()).toHaveValue('')
    expect(router.state.location.search).toBe('')
  })

  it('refreshes the results after something is created', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.type(searchInput(), 'notes.txt{Enter}')
    await screen.findByText('Files named "notes.txt" in all files')
    expect(searchTreeNames()).toEqual(['notes.txt'])

    backend.add('notes.txt', 'file', 'id-1')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    const modal = within(await screen.findByRole('dialog'))
    await user.type(modal.getByLabelText('Name'), 'new-folder')
    await user.click(modal.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(api.searchByName).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(searchTreeNames()).toEqual(['notes.txt', 'notes.txt']))
  })
})

describe('search in the url', () => {
  it('writes the typed prefix after the debounce', async () => {
    const user = userEvent.setup()
    const { router } = renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'rep')

    expect(router.state.location.search).toBe('')
    await waitFor(
      () => expect(router.state.location.search).toBe(`?${SEARCH_QUERY_PARAM}=rep`),
      AFTER_DEBOUNCE,
    )
  })

  it('writes match=exact as soon as Enter is pressed', async () => {
    const user = userEvent.setup()
    const { router } = renderWithProviders(<ExplorerPage />)

    await user.type(searchInput(), 'notes.txt{Enter}')

    await waitFor(() =>
      expect(router.state.location.search).toBe(
        `?${SEARCH_QUERY_PARAM}=notes.txt&${SEARCH_MATCH_PARAM}=exact`,
      ),
    )
  })

  it('writes match=exact when a suggestion is selected', async () => {
    const user = userEvent.setup()
    const { router } = renderWithProviders(<ExplorerPage />)
    await user.type(searchInput(), 'report')

    await user.click(await screen.findByRole('option', { name: 'report.pdf' }, AFTER_DEBOUNCE))

    await waitFor(() =>
      expect(router.state.location.search).toBe(
        `?${SEARCH_QUERY_PARAM}=report.pdf&${SEARCH_MATCH_PARAM}=exact`,
      ),
    )
  })

  it('writes the selected folder into the url', async () => {
    const user = userEvent.setup()
    const { router } = renderWithProviders(<ExplorerPage />)
    await user.dblClick(await screen.findByText('docs'))
    await user.click(await folderCheckbox())
    await user.type(searchInput(), 'report.pdf{Enter}')

    expect(router.state.location.pathname).toBe('/folders/id-1')
    await waitFor(() =>
      expect(router.state.location.search).toBe(
        `?${SEARCH_QUERY_PARAM}=report.pdf&${SEARCH_MATCH_PARAM}=exact&${SEARCH_FOLDER_PARAM}=id-1`,
      ),
    )
  })

  it('restores a prefix search from the address bar', async () => {
    renderWithProviders(<ExplorerPage />, { initialUrl: `/?${SEARCH_QUERY_PARAM}=rep` })

    expect(searchInput()).toHaveValue('rep')
    expect(await screen.findByText('Files starting with "rep"')).toBeInTheDocument()
    expect(api.suggest).toHaveBeenCalledWith('rep', undefined, expect.anything())
  })

  it('restores an exact search from the address bar', async () => {
    renderWithProviders(<ExplorerPage />, {
      initialUrl: `/?${SEARCH_QUERY_PARAM}=notes.txt&${SEARCH_MATCH_PARAM}=exact`,
    })

    expect(searchInput()).toHaveValue('notes.txt')
    expect(await screen.findByText('Files named "notes.txt" in all files')).toBeInTheDocument()
    expect(api.searchByName).toHaveBeenCalledWith('notes.txt', undefined, expect.anything())
  })
})
