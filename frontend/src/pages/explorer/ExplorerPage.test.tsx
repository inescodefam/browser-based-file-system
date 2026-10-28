import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fileSystemItemsApi } from '../../api/fileSystemItems'
import { ApiError } from '../../api/http'
import { NAME_MAX_LENGTH } from '../../config'
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

const openCreateModal = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: 'Create' }))
  return within(await screen.findByRole('dialog'))
}

const createThroughModal = async (user: UserEvent, name: string, type: 'Folder' | 'File' = 'Folder') => {
  const modal = await openCreateModal(user)
  if (type === 'File') await user.click(modal.getByRole('radio', { name: 'File' }))
  await user.type(modal.getByLabelText('Name'), name)
  await user.click(modal.getByRole('button', { name: 'Create' }))
}

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

    await user.click(screen.getByRole('button', { name: 'All items' }))

    expect(await screen.findByText('readme.md')).toBeInTheDocument()
  })

  it('shows a message for an empty folder', async () => {
    backend.items = []
    renderWithProviders(<ExplorerPage />)

    expect(await screen.findByText('This folder is empty.')).toBeInTheDocument()
  })

  describe('create modal', () => {
    it('opens from the Create button next to the breadcrumbs and names the target', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await screen.findByText('readme.md')

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      await openCreateModal(user)

      expect(screen.getByRole('dialog')).toHaveTextContent('Create in All items')
    })

    it('names the current folder as the target', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await user.click(await screen.findByRole('button', { name: 'docs' }))
      await screen.findByText('inside.txt')

      await openCreateModal(user)

      expect(screen.getByRole('dialog')).toHaveTextContent('Create in "docs"')
    })

    it('creates a folder in the current folder, closes, and refreshes the list', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await user.click(await screen.findByRole('button', { name: 'docs' }))
      await screen.findByText('inside.txt')

      await createThroughModal(user, 'sub')

      expect(api.createFolder).toHaveBeenCalledWith('sub', 'id-1')
      expect(await screen.findByRole('button', { name: 'sub' })).toBeInTheDocument()
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('creates a file at the top level', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await screen.findByText('readme.md')

      await createThroughModal(user, 'notes.txt', 'File')

      expect(api.createFile).toHaveBeenCalledWith('notes.txt', null)
      expect(await screen.findByText('notes.txt')).toBeInTheDocument()
    })

    it('stays open and shows the backend error, e.g. a duplicate name', async () => {
      api.createFolder.mockRejectedValue(
        new ApiError(409, 'A node named "docs" already exists in this folder'),
      )
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await screen.findByText('readme.md')

      await createThroughModal(user, 'docs')

      expect(
        await screen.findByText('A node named "docs" already exists in this folder'),
      ).toBeInTheDocument()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('starts empty again when reopened', async () => {
      api.createFolder.mockRejectedValue(new ApiError(409, 'A node named "x" already exists'))
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await screen.findByText('readme.md')
      await createThroughModal(user, 'x')
      await screen.findByText('A node named "x" already exists')

      await user.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      const modal = await openCreateModal(user)

      expect(modal.getByLabelText('Name')).toHaveValue('')
      expect(screen.queryByText('A node named "x" already exists')).not.toBeInTheDocument()
    })
  })

  describe('name validation before calling the backend', () => {
    it.each([
      ['an empty name', '', 'Name is required'],
      ['a name with a slash', 'a/b', 'Name must not contain'],
      ['a dot', '..', 'Name must not contain'],
    ])('rejects %s without calling the backend', async (_label, name, message) => {
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await screen.findByText('readme.md')
      const modal = await openCreateModal(user)

      if (name) await user.type(modal.getByLabelText('Name'), name)
      await user.click(modal.getByRole('button', { name: 'Create' }))

      expect(await modal.findByText(new RegExp(message))).toBeInTheDocument()
      expect(api.createFolder).not.toHaveBeenCalled()
    })

    it('rejects a name that is too long', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await screen.findByText('readme.md')
      const modal = await openCreateModal(user)

      await user.click(modal.getByLabelText('Name'))
      await user.paste('a'.repeat(NAME_MAX_LENGTH + 1))
      await user.click(modal.getByRole('button', { name: 'Create' }))

      expect(await modal.findByText(/at most/)).toBeInTheDocument()
      expect(api.createFolder).not.toHaveBeenCalled()
    })

    it('requires an extension for files, but not for folders', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await screen.findByText('readme.md')
      const modal = await openCreateModal(user)

      await user.click(modal.getByRole('radio', { name: 'File' }))
      await user.type(modal.getByLabelText('Name'), 'report')
      await user.click(modal.getByRole('button', { name: 'Create' }))

      expect(await modal.findByText(/must have an extension/)).toBeInTheDocument()
      expect(api.createFile).not.toHaveBeenCalled()

      await user.click(modal.getByRole('radio', { name: 'Folder' }))

      await waitFor(() => expect(modal.queryByText(/must have an extension/)).not.toBeInTheDocument())
    })

    it('shows no error until Create is pressed, even after using the Folder/File toggle', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await screen.findByText('readme.md')
      const modal = await openCreateModal(user)

      await user.click(modal.getByRole('radio', { name: 'File' }))
      await user.click(modal.getByRole('radio', { name: 'Folder' }))

      expect(modal.queryByText('Name is required')).not.toBeInTheDocument()

      await user.click(modal.getByRole('button', { name: 'Create' }))

      expect(await modal.findByText('Name is required')).toBeInTheDocument()
    })

    it('shows no error just because the name field lost focus', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await screen.findByText('readme.md')
      const modal = await openCreateModal(user)

      await user.click(modal.getByLabelText('Name'))
      await user.tab()

      expect(modal.queryByText('Name is required')).not.toBeInTheDocument()
    })

    it('does not judge a file name before Create is pressed', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await screen.findByText('readme.md')
      const modal = await openCreateModal(user)

      await user.type(modal.getByLabelText('Name'), 'report')
      await user.click(modal.getByRole('radio', { name: 'File' }))

      expect(modal.queryByText(/must have an extension/)).not.toBeInTheDocument()

      await user.click(modal.getByRole('button', { name: 'Create' }))

      expect(await modal.findByText(/must have an extension/)).toBeInTheDocument()
    })

    it('removes the error as soon as the name becomes valid', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ExplorerPage />)
      await screen.findByText('readme.md')
      const modal = await openCreateModal(user)
      await user.click(modal.getByRole('button', { name: 'Create' }))
      await modal.findByText('Name is required')

      await user.type(modal.getByLabelText('Name'), 'reports')

      await waitFor(() => expect(modal.queryByText('Name is required')).not.toBeInTheDocument())
    })
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
    await createThroughModal(user, 'x')

    expect(await screen.findByText('Folder "id-1" does not exist')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back to all items' }))
    expect(await screen.findByText('readme.md')).toBeInTheDocument()
  })
})
