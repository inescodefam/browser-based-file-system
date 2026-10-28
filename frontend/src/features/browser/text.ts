import type { NodeType } from '../../api/types'

export const BROWSER_TEXT = {
  breadcrumbs: {
    root: 'All files',
  },
  list: {
    empty: 'This folder is empty.',
    nameColumn: 'Name',
    typeColumn: 'Type',
    delete: 'Delete',
    deleteAriaLabel: (name: string) => `Delete ${name}`,
  },
  nodeType: {
    folder: 'Folder',
    file: 'File',
  } satisfies Record<NodeType, string>,
  form: {
    nameLabel: 'Name',
    create: 'Create',
    namePlaceholder: {
      folder: 'reports',
      file: 'report.pdf',
    } satisfies Record<NodeType, string>,
  },
  loadError: {
    title: 'Could not load this folder',
    backToRoot: 'Back to all files',
  },
  confirmDelete: {
    folder: (name: string) => `Delete folder "${name}" and everything inside it?`,
    file: (name: string) => `Delete file "${name}"?`,
  } satisfies Record<NodeType, (name: string) => string>,
} as const
