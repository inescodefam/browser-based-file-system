import { describe, expect, it } from 'vitest'
import type { FileSystemItem } from '../../../api/types'
import { buildTreeData, collectFolderIds, getFolderPath } from './utils'

const item = (
  id: string,
  name: string,
  type: 'file' | 'folder',
  parentId: string | null,
): FileSystemItem => ({ id, name, type, parentId, createdAt: '2026-10-28T10:00:00.000Z' })

describe('buildTreeData', () => {
  it('returns nothing before the top level has loaded', () => {
    expect(buildTreeData({})).toEqual([])
  })

  it('lists a folder’s children when that folder is the current location', () => {
    const inside = item('f1', 'inside.txt', 'file', 'd1')

    expect(buildTreeData({ d1: [inside] }, 'd1')).toEqual([
      { value: 'f1', label: 'inside.txt', nodeProps: { item: inside } },
    ])
  })

  it('shows files as leaves', () => {
    const data = buildTreeData({ 'top-level': [item('f1', 'a.txt', 'file', null)] })

    expect(data).toEqual([{ value: 'f1', label: 'a.txt', nodeProps: { item: item('f1', 'a.txt', 'file', null) } }])
  })

  it('marks a folder whose content has not been loaded as expandable, without children', () => {
    const data = buildTreeData({ 'top-level': [item('d1', 'docs', 'folder', null)] })

    expect(data[0]).toMatchObject({ value: 'd1', hasChildren: true, children: undefined })
    expect(data[0].nodeProps?.isEmpty).toBe(false)
  })

  it('nests the loaded content of a folder', () => {
    const docs = item('d1', 'docs', 'folder', null)
    const inside = item('f1', 'inside.txt', 'file', 'd1')

    const data = buildTreeData({ 'top-level': [docs], d1: [inside] })

    expect(data[0].hasChildren).toBe(true)
    expect(data[0].children?.map((node) => node.label)).toEqual(['inside.txt'])
  })

  it('marks a loaded folder with nothing inside as empty and not expandable', () => {
    const docs = item('d1', 'docs', 'folder', null)

    const data = buildTreeData({ 'top-level': [docs], d1: [] })

    expect(data[0]).toMatchObject({ hasChildren: false, children: [] })
    expect(data[0].nodeProps?.isEmpty).toBe(true)
  })

  it('nests several levels and keeps the order it was given', () => {
    const a = item('a', 'a', 'folder', null)
    const b = item('b', 'b', 'folder', 'a')
    const file = item('f', 'z.txt', 'file', 'b')
    const top = item('t', 'top.txt', 'file', null)

    const data = buildTreeData({ 'top-level': [a, top], a: [b], b: [file] })

    expect(data.map((node) => node.label)).toEqual(['a', 'top.txt'])
    expect(data[0].children?.[0].children?.[0].label).toBe('z.txt')
  })
})

describe('collectFolderIds', () => {
  const folder = (id: string, parentId: string | null): FileSystemItem =>
    item(id, id, 'folder', parentId)
  const file = (id: string, parentId: string | null): FileSystemItem => item(id, id, 'file', parentId)

  it('returns the folder itself and every folder below it, but no files', () => {
    const childrenByFolder = {
      'top-level': [folder('a', null)],
      a: [folder('b', 'a'), file('f1', 'a')],
      b: [folder('c', 'b'), file('f2', 'b')],
    }

    expect(collectFolderIds('a', childrenByFolder)).toEqual(['a', 'b', 'c'])
  })

  it('returns just the folder when its content was never loaded', () => {
    expect(collectFolderIds('a', {})).toEqual(['a'])
  })
})

describe('getFolderPath', () => {
  const folder = (id: string, name: string, parentId: string | null): FileSystemItem =>
    item(id, name, 'folder', parentId)
  const byId = (...items: FileSystemItem[]) => new Map(items.map((entry) => [entry.id, entry]))

  it('is empty for the top level', () => {
    expect(getFolderPath(undefined, byId(folder('a', 'a', null)))).toEqual([])
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
