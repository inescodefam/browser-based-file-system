import { Alert, Button, Group, SegmentedControl, Stack, TextInput } from '@mantine/core'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { FileSystemItemType } from '../../api/types'
import { useCreateFileSystemItemMutation } from './useCreateFileSystemItemMutation'
import { validateItemName } from './validateItemName'

export const CreateFileSystemItemForm = ({
  parentId,
  onCreated,
}: {
  parentId: string | null
  onCreated: () => void
}) => {
  const createItem = useCreateFileSystemItemMutation(parentId)
  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitted },
  } = useForm<{ name: string; type: FileSystemItemType }>({
    defaultValues: { name: '', type: 'folder' },
  })
  const type = useWatch({ control, name: 'type' })

  const onSubmit = handleSubmit((values) =>
    createItem.mutate(values, { onSuccess: onCreated }),
  )

  return (
    <form onSubmit={onSubmit}>
      <Stack>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <SegmentedControl
              fullWidth
              value={field.value}
              onChange={(value) => {
                field.onChange(value)
                if (isSubmitted) void trigger('name')
              }}
              data={[
                { label: 'Folder', value: 'folder' },
                { label: 'File', value: 'file' },
              ]}
            />
          )}
        />
        <TextInput
          data-autofocus
          label="Name"
          placeholder={type === 'file' ? 'report.pdf' : 'reports'}
          error={errors.name?.message}
          {...register('name', {
            validate: (value, formValues) => validateItemName(value, formValues.type),
            onChange: () => createItem.reset(),
          })}
        />
        {createItem.error && <Alert color="red">{createItem.error.message}</Alert>}
        <Group justify="flex-end">
          <Button type="submit" loading={createItem.isPending}>
            Create
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
