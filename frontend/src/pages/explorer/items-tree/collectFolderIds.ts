import type { ChildrenByFolder } from './childrenByFolder'

export const collectFolderIds = (
  folderId: string,
  childrenByFolder: ChildrenByFolder,
): string[] => [
  folderId,
  ...(childrenByFolder[folderId] ?? [])
    .filter((item) => item.type === 'folder')
    .flatMap((folder) => collectFolderIds(folder.id, childrenByFolder)),
]
