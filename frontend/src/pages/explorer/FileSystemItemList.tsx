import { Anchor, Button, Table, Text } from '@mantine/core'
import type { FileSystemItem } from '../../api/types'

export const FileSystemItemList = ({
  items,
  onOpenFolder,
  onDelete,
  isDeleting,
}: {
  items: FileSystemItem[]
  onOpenFolder: (folder: FileSystemItem) => void
  onDelete: (item: FileSystemItem) => void
  isDeleting: boolean
}) => {
  if (items.length === 0) {
    return <Text c="dimmed">This folder is empty.</Text>
  }

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Name</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((item) => (
          <Table.Tr key={item.id}>
            <Table.Td>
              {item.type === 'folder' ? (
                <Anchor component="button" type="button" onClick={() => onOpenFolder(item)}>
                  {item.name}
                </Anchor>
              ) : (
                item.name
              )}
            </Table.Td>
            <Table.Td>{item.type === 'folder' ? 'Folder' : 'File'}</Table.Td>
            <Table.Td>
              <Button
                variant="subtle"
                color="red"
                size="xs"
                disabled={isDeleting}
                aria-label={`Delete ${item.name}`}
                onClick={() => onDelete(item)}
              >
                Delete
              </Button>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
