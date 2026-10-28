import { Anchor, Breadcrumbs, Text } from '@mantine/core'
import type { FileSystemItem } from '../../api/types'
import { useMemo } from 'react'

export type FolderRef = Pick<FileSystemItem, 'id' | 'name'>

type Crumb = { label: string, depth: number }

const ALL_ITEMS_CRUMB: Crumb = { label: 'All items', depth: 0 }

export const FolderBreadcrumbs = ({
  path,
  isRoot,
  onNavigate,
}: {
  path: FolderRef[]
  isRoot: boolean

  onNavigate: (depth: number) => void
}) => {
  const crumbs = useMemo<Crumb[]>(() => [
      ALL_ITEMS_CRUMB,
      ...path.map((folder, index) => ({ label: folder.name, depth: index + 1 })),
    ], [path])
    
  return (
    <Breadcrumbs role="navigation" aria-label="Breadcrumb">
      {crumbs.map(({ label, depth }) => {
        const isCurrent = isRoot ? depth === 0 : depth === path.length && path.length > 0
        return isCurrent ? (
          <Text key={depth} fw={600}>
            {label}
          </Text>
        ) : (
          <Anchor key={depth} component="button" type="button" onClick={() => onNavigate(depth)}>
            {label}
          </Anchor>
        )
      })}
    </Breadcrumbs>
  )
}
