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

const treeOptions = { name: 'Files and folders' }
const tree = {
  findByText: async (text: string) =>
    within(await screen.findByRole('tree', treeOptions)).findByText(text),
  getByText: (text: string) => within(screen.getByRole('tree', treeOptions)).getByText(text),
  queryByText: (text: string) => {
    const element = screen.queryByRole('tree', treeOptions)
    return element ? within(element).queryByText(text) : null
  },
}

const breadcrumb = () => screen.getByRole('navigation', { name: 'Breadcrumb' })

const openCreateModal = async (user: UserEvent) => {
  await user.click(screen.getByRole('button', { name: 'Create' }))
  return within(await screen.findByRole('dialog'))
}

const createThroughModal = async (
  user: UserEvent,
  name: string,
  type: 'Folder' | 'File' = 'Folder',
) => {
  const modal = await openCreateModal(user)
  if (type === 'File') await user.click(modal.getByRole('radio', { name: 'File' }))
  await user.type(modal.getByLabelText('Name'), name)
  await user.click(modal.getByRole('button', { name: 'Create' }))
}

describe('ExplorerPage tree', () => {
  it('lists the top level, with folders collapsed', async () => {
    renderWithProviders(<ExplorerPage />)

    expect(await tree.findByText('readme.md')).toBeInTheDocument()
    expect(tree.getByText('docs')).toBeInTheDocument()
    expect(tree.queryByText('inside.txt')).not.toBeInTheDocument()
  })

  it('does not load a folder until it is opened', async () => {
    renderWithProviders(<ExplorerPage />)
    await tree.findByText('readme.md')

    expect(api.list).toHaveBeenCalledTimes(1)
    expect(api.list).toHaveBeenCalledWith(null, expect.anything())
  })

  it('opens a folder in place on click, and closes it on the second click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.click(await tree.findByText('docs'))

    expect(await tree.findByText('inside.txt')).toBeInTheDocument()
    expect(tree.getByText('readme.md')).toBeInTheDocument()
    expect(api.list).toHaveBeenCalledWith('id-1', expect.anything())

    await user.click(tree.getByText('docs'))

    await waitFor(() => expect(tree.queryByText('inside.txt')).not.toBeInTheDocument())
  })

  it('shows an opened folder in the breadcrumb, and goes back to All items from it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.click(await tree.findByText('docs'))

    expect(await within(breadcrumb()).findByText('docs')).toBeInTheDocument()

    await user.click(within(breadcrumb()).getByRole('button', { name: 'All items' }))

    await waitFor(() => expect(within(breadcrumb()).queryByText('docs')).not.toBeInTheDocument())
  })

  it('does nothing when a file is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.click(await tree.findByText('readme.md'))

    expect(within(breadcrumb()).queryByText('readme.md')).not.toBeInTheDocument()
    expect(api.list).toHaveBeenCalledTimes(1)
  })

  it('marks a folder with nothing inside as empty once it has been opened', async () => {
    backend.items = []
    backend.add('empty-folder', 'folder')
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)

    await user.click(await tree.findByText('empty-folder'))

    expect(await tree.findByText('(empty)')).toBeInTheDocument()
  })

  it('says so when there is nothing at all', async () => {
    backend.items = []
    renderWithProviders(<ExplorerPage />)

    expect(await screen.findByText('No items yet.')).toBeInTheDocument()
  })

  it('shows the reason under a folder that cannot be loaded', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    const docsRow = await tree.findByText('docs')
    api.list.mockImplementation(async (parentId) => {
      if (parentId) throw new ApiError(404, 'Folder "id-1" does not exist')
      return backend.items.filter((item) => item.parentId === null)
    })

    await user.click(docsRow)

    expect(await tree.findByText('Folder "id-1" does not exist')).toBeInTheDocument()
  })

  it('shows an error when the top level cannot be loaded', async () => {
    api.list.mockRejectedValue(new ApiError(500, 'Request failed (500)'))
    renderWithProviders(<ExplorerPage />)

    expect(await screen.findByText('Request failed (500)')).toBeInTheDocument()
  })
})

describe('ExplorerPage create modal', () => {
  it('opens from the Create button next to the breadcrumbs and names the target', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await tree.findByText('readme.md')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await openCreateModal(user)

    expect(screen.getByRole('dialog')).toHaveTextContent('Create in All items')
  })

  it('names the selected folder as the target', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.click(await tree.findByText('docs'))
    await tree.findByText('inside.txt')

    await openCreateModal(user)

    expect(screen.getByRole('dialog')).toHaveTextContent('Create in "docs"')
  })

  it('creates a folder in the selected folder, closes, and shows it in the tree', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.click(await tree.findByText('docs'))
    await tree.findByText('inside.txt')

    await createThroughModal(user, 'sub')

    expect(api.createFolder).toHaveBeenCalledWith('sub', 'id-1')
    expect(await tree.findByText('sub')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('creates a file at the top level', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await tree.findByText('readme.md')

    await createThroughModal(user, 'notes.txt', 'File')

    expect(api.createFile).toHaveBeenCalledWith('notes.txt', null)
    expect(await tree.findByText('notes.txt')).toBeInTheDocument()
  })

  it('stays open and shows the backend error, e.g. a duplicate name', async () => {
    api.createFolder.mockRejectedValue(
      new ApiError(409, 'A node named "docs" already exists in this folder'),
    )
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await tree.findByText('readme.md')

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
    await tree.findByText('readme.md')
    await createThroughModal(user, 'x')
    await screen.findByText('A node named "x" already exists')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const modal = await openCreateModal(user)

    expect(modal.getByLabelText('Name')).toHaveValue('')
    expect(screen.queryByText('A node named "x" already exists')).not.toBeInTheDocument()
  })
})

describe('ExplorerPage name validation before calling the backend', () => {
  it.each([
    ['an empty name', '', 'Name is required'],
    ['a name with a slash', 'a/b', 'Name must not contain'],
    ['a dot', '..', 'Name must not contain'],
  ])('rejects %s without calling the backend', async (_label, name, message) => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await tree.findByText('readme.md')
    const modal = await openCreateModal(user)

    if (name) await user.type(modal.getByLabelText('Name'), name)
    await user.click(modal.getByRole('button', { name: 'Create' }))

    expect(await modal.findByText(new RegExp(message))).toBeInTheDocument()
    expect(api.createFolder).not.toHaveBeenCalled()
  })

  it('rejects a name that is too long', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await tree.findByText('readme.md')
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
    await tree.findByText('readme.md')
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
    await tree.findByText('readme.md')
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
    await tree.findByText('readme.md')
    const modal = await openCreateModal(user)

    await user.click(modal.getByLabelText('Name'))
    await user.tab()

    expect(modal.queryByText('Name is required')).not.toBeInTheDocument()
  })

  it('does not judge a file name before Create is pressed', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await tree.findByText('readme.md')
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
    await tree.findByText('readme.md')
    const modal = await openCreateModal(user)
    await user.click(modal.getByRole('button', { name: 'Create' }))
    await modal.findByText('Name is required')

    await user.type(modal.getByLabelText('Name'), 'reports')

    await waitFor(() => expect(modal.queryByText('Name is required')).not.toBeInTheDocument())
  })
})

describe('ExplorerPage delete', () => {
  it('deletes a file after confirmation and refreshes the tree', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await tree.findByText('readme.md')

    await user.click(screen.getByRole('button', { name: 'Delete readme.md' }))

    expect(window.confirm).toHaveBeenCalledWith('Delete file "readme.md"?')
    expect(api.remove).toHaveBeenCalledWith('id-2')
    await waitFor(() => expect(tree.queryByText('readme.md')).not.toBeInTheDocument())
  })

  it('warns that deleting a folder deletes its content, and does nothing if cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await tree.findByText('readme.md')

    await user.click(screen.getByRole('button', { name: 'Delete docs' }))

    expect(window.confirm).toHaveBeenCalledWith('Delete folder "docs" and everything inside it?')
    expect(api.remove).not.toHaveBeenCalled()
    expect(tree.getByText('docs')).toBeInTheDocument()
  })

  it('does not open or close the folder when its Delete button is clicked', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await tree.findByText('readme.md')

    await user.click(screen.getByRole('button', { name: 'Delete docs' }))

    expect(tree.queryByText('inside.txt')).not.toBeInTheDocument()
    expect(api.list).toHaveBeenCalledTimes(1)
  })

  it('removes an opened folder with its content, and returns the breadcrumb to All items', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderWithProviders(<ExplorerPage />)
    await user.click(await tree.findByText('docs'))
    await tree.findByText('inside.txt')

    await user.click(screen.getByRole('button', { name: 'Delete docs' }))

    await waitFor(() => expect(tree.queryByText('docs')).not.toBeInTheDocument())
    expect(tree.queryByText('inside.txt')).not.toBeInTheDocument()
    expect(tree.getByText('readme.md')).toBeInTheDocument()
    await waitFor(() => expect(within(breadcrumb()).queryByText('docs')).not.toBeInTheDocument())
  })
})
