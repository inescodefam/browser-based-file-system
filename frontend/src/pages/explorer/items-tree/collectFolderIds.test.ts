import { describe, expect, it } from 'vitest'
import type { FileSystemItem } from '../../../api/types'
import { collectFolderIds } from './collectFolderIds'

const item = (id: string, type: 'file' | 'folder', parentId: string | null): FileSystemItem => ({
  id,
  name: id,
  type,
  parentId,
  createdAt: '2026-10-28T10:00:00.000Z',
})

describe('collectFolderIds', () => {
  it('returns the folder itself and every folder below it, but no files', () => {
    const childrenByFolder = {
      'top-level': [item('a', 'folder', null)],
      a: [item('b', 'folder', 'a'), item('f1', 'file', 'a')],
      b: [item('c', 'folder', 'b'), item('f2', 'file', 'b')],
    }

    expect(collectFolderIds('a', childrenByFolder)).toEqual(['a', 'b', 'c'])
  })

  it('returns just the folder when its content was never loaded', () => {
    expect(collectFolderIds('a', {})).toEqual(['a'])
  })
})
