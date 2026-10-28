import { Alert, Button, Group, SegmentedControl, TextInput } from '@mantine/core'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { FileSystemItemType } from '../../api/types'
import { useCreateFileSystemItem } from './useCreateFileSystemItem'

export const CreateFileSystemItemForm = ({
  parentId,
}: {
  parentId: string | null
}) => {
  const createItem = useCreateFileSystemItem(parentId)
  const {
    register,
    control,
    handleSubmit,
    resetField,
    formState: { isValid },
  } = useForm<{ name: string; type: FileSystemItemType }>({
    defaultValues: { name: '', type: 'folder' },
    mode: 'onChange', 
  })
  const type = useWatch({ control, name: 'type' })

  const onSubmit = handleSubmit((values) =>
    createItem.mutate(values, { onSuccess: () => resetField('name') }),
  )

  return (
    <form onSubmit={onSubmit}>
      <Group align="flex-end">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <SegmentedControl
              value={field.value}
              onChange={field.onChange}
              data={[
                { label: 'Folder', value: 'folder' },
                { label: 'File', value: 'file' },
              ]}
            />
          )}
        />
        <TextInput
          label="Name"
          placeholder={type === 'file' ? 'report.pdf' : 'reports'}
          {...register('name', {
            validate: (value) => value.trim() !== '', 
            onChange: () => createItem.reset(), 
          })}
        />
        <Button type="submit" loading={createItem.isPending} disabled={!isValid}>
          Create
        </Button>
      </Group>
      {createItem.error && (
        <Alert color="red" mt="sm">
          {createItem.error.message}
        </Alert>
      )}
    </form>
  )
}
