import { NAME_MAX_LENGTH } from '../../../../config'
import type { FileSystemItemType } from '../../../../api/types'

const ALLOWED_NAME_CHARS = /^[A-Za-z0-9 -]+$/
const FILE_EXTENSION = /^[A-Za-z0-9]{1,10}$/

export const NAME_CHARS_MESSAGE = 'Name can only contain letters, numbers, spaces and hyphens'
export const FILE_EXTENSION_MESSAGE = 'File name must have an extension, e.g. "report.pdf"'

export const validateItemName = (name: string, type: FileSystemItemType): true | string => {
  const trimmedName = name.trim()

  if (trimmedName === '') return 'Name is required'
  if (trimmedName.length > NAME_MAX_LENGTH) {
    return `Name must be at most ${NAME_MAX_LENGTH} characters long.`
  }

  if (type === 'file') {
    const lastDot = trimmedName.lastIndexOf('.')
    const base = lastDot === -1 ? trimmedName : trimmedName.slice(0, lastDot)
    const extension = lastDot === -1 ? '' : trimmedName.slice(lastDot + 1)
    if (base === '' || !ALLOWED_NAME_CHARS.test(base)) return NAME_CHARS_MESSAGE
    if (extension === '' || !FILE_EXTENSION.test(extension)) return FILE_EXTENSION_MESSAGE
    return true
  }

  if (!ALLOWED_NAME_CHARS.test(trimmedName)) return NAME_CHARS_MESSAGE
  return true
}
