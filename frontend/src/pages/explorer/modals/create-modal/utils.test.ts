import { describe, expect, it } from 'vitest'
import { NAME_MAX_LENGTH } from '../../../../config'
import { FILE_EXTENSION_MESSAGE, NAME_CHARS_MESSAGE, validateItemName } from './utils'

describe('validateItemName', () => {
  it.each([
    ['folder', 'reports'],
    ['folder', 'folder-1'],
    ['folder', 'my documents'],
    ['file', 'report.pdf'],
    ['file', 'my-notes.txt'],
    ['file', 'IMG.JPG'],
  ] as const)('accepts the %s name %j', (type, name) => {
    expect(validateItemName(name, type)).toBe(true)
  })

  it.each(['', '   '])('requires a name (%j)', (name) => {
    expect(validateItemName(name, 'folder')).toBe('Name is required')
  })

  it.each(['a/b', 'a\\b', '.', '..', 'v1.2', "folder's", 'folder"1"', 'folder{1}'])(
    'rejects the forbidden folder name %j',
    (name) => {
      expect(validateItemName(name, 'folder')).toBe(NAME_CHARS_MESSAGE)
    },
  )

  it.each(['a/b.txt', "file'.txt", 'file{1}.txt', 'a.tar.gz', '.env'])(
    'rejects the forbidden file name %j',
    (name) => {
      expect(validateItemName(name, 'file')).toBe(NAME_CHARS_MESSAGE)
    },
  )

  it('accepts a name of exactly the maximum length and rejects one more character', () => {
    expect(validateItemName('a'.repeat(NAME_MAX_LENGTH), 'folder')).toBe(true)
    expect(validateItemName('a'.repeat(NAME_MAX_LENGTH + 1), 'folder')).toMatch(/at most/)
  })

  it.each(['report', 'report.', 'a.toolongextension', 'a.p df'])(
    'requires a file extension: %j',
    (name) => {
      expect(validateItemName(name, 'file')).toBe(FILE_EXTENSION_MESSAGE)
    },
  )

  it('does not require an extension for folders', () => {
    expect(validateItemName('report', 'folder')).toBe(true)
  })

  it('ignores surrounding whitespace, like the backend does', () => {
    expect(validateItemName('  report.pdf  ', 'file')).toBe(true)
  })
})
