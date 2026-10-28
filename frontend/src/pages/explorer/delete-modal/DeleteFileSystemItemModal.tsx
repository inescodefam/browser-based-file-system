import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core'
import type { FileSystemItem } from '../../../api/types'
import { useDeleteFileSystemItemMutation } from './useDeleteFileSystemItemMutation'

export const DeleteFileSystemItemModal = ({
  item,
  onClose,
  onDeleted,
}: {
  item: FileSystemItem | null
  onClose: () => void
  onDeleted: (item: FileSystemItem) => void
}) => {
  const deleteItem = useDeleteFileSystemItemMutation()

  const close = () => {
    deleteItem.reset()
    onClose()
  }

  const kind = item?.type === 'folder' ? 'folder' : 'file'

  return (
    <Modal
      opened={item !== null}
      onClose={close}
      title={item ? `Delete ${kind} "${item.name}"` : 'Delete'}
    >
      {item && (
        <Stack>
          <Text>
            {item.type === 'folder'
              ? `This will also delete all items inside "${item.name}".`
              : `This will permanently delete "${item.name}".`}
          </Text>
          {deleteItem.error && <Alert color="red">{deleteItem.error.message}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={deleteItem.isPending}
              onClick={() =>
                deleteItem.mutate(item.id, {
                  onSuccess: () => {
                    onDeleted(item)
                    close()
                  },
                })
              }
            >
              Delete
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
