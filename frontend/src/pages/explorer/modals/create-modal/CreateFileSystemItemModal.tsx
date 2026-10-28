import { Modal } from '@mantine/core'
import { CreateFileSystemItemForm } from './CreateFileSystemItemForm'
import type { FolderRef } from '../../FolderBreadcrumbs'

export const CreateFileSystemItemModal = ({
  opened,
  onClose,
  parent,
}: {
  opened: boolean
  parent?: FolderRef

  onClose: VoidFunction
}) => (
  <Modal
    opened={opened}
    onClose={onClose}
    title={`Create in ${parent ? `"${parent.name}"` : 'All items'}`}
  >
    <CreateFileSystemItemForm parentId={parent?.id} onCreated={onClose} />
  </Modal>
)
