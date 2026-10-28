import { describe, expect, it } from 'vitest'
import { NAME_MAX_LENGTH } from '../../config'
import { validateItemName } from './validateItemName'

describe('validateItemName', () => {
  it.each([
    ['folder', 'reports'],
    ['folder', 'v1.2'],
    ['folder', 'my documents'],
    ['file', 'report.pdf'],
    ['file', 'archive.tar.gz'],
    ['file', 'IMG.JPG'],
  ] as const)('accepts the %s name %j', (type, name) => {
    expect(validateItemName(name, type)).toBe(true)
  })

  it.each(['', '   '])('requires a name (%j)', (name) => {
    expect(validateItemName(name, 'folder')).toBe('Name is required')
  })

  it.each(['a/b', 'a\\b', '.', '..'])('rejects the forbidden name %j', (name) => {
    expect(validateItemName(name, 'folder')).toMatch(/must not contain/)
  })

  it('accepts a name of exactly the maximum length and rejects one more character', () => {
    expect(validateItemName('a'.repeat(NAME_MAX_LENGTH), 'folder')).toBe(true)
    expect(validateItemName('a'.repeat(NAME_MAX_LENGTH + 1), 'folder')).toMatch(/at most/)
  })

  it.each(['report', 'report.', '.env', 'a.toolongextension', 'a.p df'])(
    'requires a file extension: %j',
    (name) => {
      expect(validateItemName(name, 'file')).toMatch(/must have an extension/)
    },
  )

  it('does not require an extension for folders', () => {
    expect(validateItemName('report', 'folder')).toBe(true)
  })

  it('ignores surrounding whitespace, like the backend does', () => {
    expect(validateItemName('  report.pdf  ', 'file')).toBe(true)
  })
})
