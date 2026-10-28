import type { FileSystemItem } from '../../../api/types'

export type ChildrenByFolder = Record<string, FileSystemItem[]>

const TOP_LEVEL_KEY = 'top-level'

export const folderKey = (folderId: string | null): string => folderId ?? TOP_LEVEL_KEY
