import { Modal } from '@mantine/core'
import { CreateFileSystemItemForm } from './CreateFileSystemItemForm'
import type { FolderRef } from './FolderBreadcrumbs'

export const CreateFileSystemItemModal = ({
  opened,
  onClose,
  parent,
}: {
  opened: boolean
  onClose: () => void
  parent: FolderRef | null
}) => (
  <Modal
    opened={opened}
    onClose={onClose}
    title={`Create in ${parent ? `"${parent.name}"` : 'All items'}`}
  >
    <CreateFileSystemItemForm parentId={parent?.id ?? null} onCreated={onClose} />
  </Modal>
)
