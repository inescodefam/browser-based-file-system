import { NAME_MAX_LENGTH } from '../../../config'
import type { FileSystemItemType } from '../../../api/types'

const NAME_PATTERN = /^(?!\.{1,2}$)[^/\\]+$/
const FILE_NAME_PATTERN = /^.+\.[A-Za-z0-9]{1,10}$/

export const validateItemName = (name: string, type: FileSystemItemType): true | string => {
  const trimmedName = name.trim()

  if (trimmedName === '') return 'Name is required'
  if (trimmedName.length > NAME_MAX_LENGTH) {
    return `Name must be at most ${NAME_MAX_LENGTH} characters long.`
  }
  if (!NAME_PATTERN.test(trimmedName)) {
    return 'Name must not contain "/" or "\\" and must not be "." or ".."'
  }
  if (type === 'file' && !FILE_NAME_PATTERN.test(trimmedName)) {
    return 'File name must have an extension, e.g. "report.pdf"'
  }
  return true
}
