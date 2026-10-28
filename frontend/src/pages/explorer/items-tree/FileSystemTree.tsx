import {
  AccordionChevron,
  Box,
  Button,
  Group,
  Stack,
  Text,
  Tree,
  type UseTreeReturnType,
  type TreeNodeData,
} from '@mantine/core'
import type { FileSystemItem } from '../../../api/types'
import { ReturnToAllFilesLink } from '../ReturnToAllFilesLink'

export const FileSystemTree = ({
  data,
  tree,
  ariaLabel = 'Files and folders',
  onDelete,
  isDeleting,
  onOpenFolder,
}: {
  data: TreeNodeData[]
  tree: UseTreeReturnType
  ariaLabel?: string
  onDelete: (item: FileSystemItem) => void
  isDeleting: boolean
  onOpenFolder?: (folder: FileSystemItem) => void
}) => (
  <Tree
    aria-label={ariaLabel}
    data={data}
    tree={tree}
    selectOnClick
    styles={{ node: { cursor: 'default' } }}
    renderNode={({ node, expanded, hasChildren, loadError, elementProps }) => {
      const item = node.nodeProps?.item as FileSystemItem
      const isFolder = item.type === 'folder'

      return (
        <Stack
          {...elementProps}
          style={{ ...elementProps.style, cursor: isFolder ? 'pointer' : 'default' }}
          onClick={isFolder ? elementProps.onClick : undefined}
          onDoubleClick={
            isFolder && onOpenFolder
              ? (event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onOpenFolder(item)
                }
              : undefined
          }
          gap={4}
          py={4}
        >
          <Group justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Box w={16}>
                {hasChildren && (
                  <AccordionChevron
                    size={16}
                    style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                  />
                )}
              </Box>
              <Text span fw={isFolder ? 600 : 400}>
                {node.label}
              </Text>
              {node.nodeProps?.isEmpty && (
                <Text span size="sm" c="dimmed">
                  (empty)
                </Text>
              )}
            </Group>
            <Button
              variant="subtle"
              color="red"
              size="xs"
              disabled={isDeleting}
              aria-label={`Delete ${item.name}`}
              onClick={(event) => {
                event.stopPropagation()
                onDelete(item)
              }}
              onDoubleClick={(event) => event.stopPropagation()}
            >
              Delete
            </Button>
          </Group>
          {loadError && (
            <Stack gap={4} pl={24}>
              <Text size="sm" c="red">
                {loadError.message}
              </Text>
              <ReturnToAllFilesLink />
            </Stack>
          )}
        </Stack>
      )
    }}
  />
)
