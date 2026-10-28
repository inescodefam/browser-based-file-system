import { Anchor, Breadcrumbs, Text } from '@mantine/core'
import type { FileSystemItem } from '../../api/types'

export type FolderRef = Pick<FileSystemItem, 'id' | 'name'>

export const FolderBreadcrumbs = ({
  path,
  onNavigate,
}: {
  path: FolderRef[]
  onNavigate: (depth: number) => void
}) => {
  const crumbs = [
    { label: 'All items', depth: 0 },
    ...path.map((folder, index) => ({ label: folder.name, depth: index + 1 })),
  ]
  const currentDepth = path.length

  return (
    <Breadcrumbs role="navigation" aria-label="Breadcrumb">
      {crumbs.map(({ label, depth }) =>
        depth === currentDepth ? (
          <Text key={depth} fw={600}>
            {label}
          </Text>
        ) : (
          <Anchor key={depth} component="button" type="button" onClick={() => onNavigate(depth)}>
            {label}
          </Anchor>
        ),
      )}
    </Breadcrumbs>
  )
}
