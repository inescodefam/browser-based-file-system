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

let backend: ReturnType<typeof installMockBackend>

beforeEach(() => {
  backend = installMockBackend(api)
  const docs = backend.add('docs', 'folder')
  backend.add('readme.md', 'file')
  backend.add('inside.txt', 'file', docs.id)
})

describe('ExplorerPage', () => {
  it('lists the top level', async () => {
    renderWithProviders(<ExplorerPage />)

    expect(await screen.findByText('readme.md')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'docs' })).toBeInTheDocument()
    expect(screen.queryByText('inside.txt')).not.toBeInTheDocument()
  })

  it('opens a folder, and goes back with the breadcrumb', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.click(await screen.findByRole('button', { name: 'docs' }))

    expect(await screen.findByText('inside.txt')).toBeInTheDocument()
    expect(screen.queryByText('readme.md')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All files' }))

    expect(await screen.findByText('readme.md')).toBeInTheDocument()
  })

  it('shows a message for an empty folder', async () => {
    backend.items = []
    renderWithProviders(<ExplorerPage />)

    expect(await screen.findByText('This folder is empty.')).toBeInTheDocument()
  })

  it('creates a folder in the current folder and refreshes the list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.click(await screen.findByRole('button', { name: 'docs' }))
    await screen.findByText('inside.txt')

    await user.type(screen.getByLabelText('Name'), 'sub')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(api.createFolder).toHaveBeenCalledWith('sub', 'id-1') 
    expect(await screen.findByRole('button', { name: 'sub' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('') 
  })

  it('creates a file at the top level', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await screen.findByText('readme.md')

    await user.click(screen.getByRole('radio', { name: 'File' })) 
    await user.type(screen.getByLabelText('Name'), 'notes.txt')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(api.createFile).toHaveBeenCalledWith('notes.txt', null)
    expect(await screen.findByText('notes.txt')).toBeInTheDocument()
  })

  it('keeps the chosen type after creating something', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await screen.findByText('readme.md')

    await user.click(screen.getByRole('radio', { name: 'File' }))
    await user.type(screen.getByLabelText('Name'), 'a.txt')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    await screen.findByText('a.txt')

    expect(screen.getByRole('radio', { name: 'File' })).toBeChecked()
  })

  it('shows the backend error, e.g. a duplicate name', async () => {
    api.createFolder.mockRejectedValue(
      new ApiError(409, 'A node named "docs" already exists in this folder'),
    )
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await screen.findByText('readme.md')

    await user.type(screen.getByLabelText('Name'), 'docs')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(
      await screen.findByText('A node named "docs" already exists in this folder'),
    ).toBeInTheDocument()
  })

  it('clears the form and its error when you open another folder', async () => {
    api.createFolder.mockRejectedValue(new ApiError(409, 'A node named "x" already exists'))
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await screen.findByText('readme.md')
    await user.type(screen.getByLabelText('Name'), 'x')
    await user.click(screen.getByRole('button', { name: 'Create' }))
    await screen.findByText('A node named "x" already exists')

    await user.click(screen.getByRole('button', { name: 'docs' }))

    await screen.findByText('inside.txt')
    expect(screen.queryByText('A node named "x" already exists')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('')
  })

  it('does not allow creating with an empty or blank name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await screen.findByText('readme.md')

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()

    await user.type(screen.getByLabelText('Name'), '   ')

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('deletes after confirmation and refreshes the list', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await screen.findByText('readme.md')

    await user.click(screen.getByRole('button', { name: 'Delete readme.md' }))

    expect(window.confirm).toHaveBeenCalledWith('Delete file "readme.md"?')
    expect(api.remove).toHaveBeenCalledWith('id-2')
    await waitFor(() => expect(screen.queryByText('readme.md')).not.toBeInTheDocument())
  })

  it('warns that deleting a folder deletes its content, and does nothing if cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await screen.findByText('readme.md')

    await user.click(screen.getByRole('button', { name: 'Delete docs' }))

    expect(window.confirm).toHaveBeenCalledWith('Delete folder "docs" and everything inside it?')
    expect(api.remove).not.toHaveBeenCalled()
    expect(within(screen.getByRole('table')).getByText('readme.md')).toBeInTheDocument()
  })

  it('offers a way back when the current folder no longer exists', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.click(await screen.findByRole('button', { name: 'docs' }))
    await screen.findByText('inside.txt')

    api.list.mockImplementation(async (parentId) => {
      if (parentId) throw new ApiError(404, 'Folder "id-1" does not exist')
      return backend.items
    })
    await user.type(screen.getByLabelText('Name'), 'x')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Folder "id-1" does not exist')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back to all files' }))
    expect(await screen.findByText('readme.md')).toBeInTheDocument()
  })
})
