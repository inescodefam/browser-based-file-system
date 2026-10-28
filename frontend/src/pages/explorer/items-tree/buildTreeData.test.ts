import { describe, expect, it } from 'vitest'
import type { FileSystemItem } from '../../../api/types'
import { buildTreeData } from './buildTreeData'

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
