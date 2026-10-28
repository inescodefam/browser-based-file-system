import { describe, expect, it } from 'vitest'
import type { FileSystemItem } from '../../../api/types'
import { getFolderPath } from './getFolderPath'

const folder = (id: string, name: string, parentId: string | null): FileSystemItem => ({
  id,
  name,
  type: 'folder',
  parentId,
  createdAt: '2026-10-28T10:00:00.000Z',
})

const byId = (...items: FileSystemItem[]) => new Map(items.map((item) => [item.id, item]))

describe('getFolderPath', () => {
  it('is empty for the top level', () => {
    expect(getFolderPath(null, byId(folder('a', 'a', null)))).toEqual([])
  })

  it('lists the folders from the top down to the selected one', () => {
    const items = byId(folder('a', 'docs', null), folder('b', 'reports', 'a'), folder('c', '2026', 'b'))

    expect(getFolderPath('c', items)).toEqual([
      { id: 'a', name: 'docs' },
      { id: 'b', name: 'reports' },
      { id: 'c', name: '2026' },
    ])
  })

  it('is empty when the selected folder is not known (e.g. it was deleted)', () => {
    expect(getFolderPath('gone', byId(folder('a', 'docs', null)))).toEqual([])
  })

  it('stops at the first ancestor that is not known', () => {
    const items = byId(folder('c', '2026', 'b'))

    expect(getFolderPath('c', items)).toEqual([{ id: 'c', name: '2026' }])
  })
})
