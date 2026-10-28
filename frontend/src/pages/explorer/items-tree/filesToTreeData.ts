import type { TreeNodeData } from '@mantine/core'
import type { FileSystemItem } from '../../../api/types'

export const filesToTreeData = (files: FileSystemItem[]): TreeNodeData[] =>
  files.map((item) => ({ value: item.id, label: item.name, nodeProps: { item } }))
