import { Alert, Button, Group, SegmentedControl, Stack, Text, TextInput } from '@mantine/core'
import { Controller, useForm } from 'react-hook-form'
import type { FileSystemItemType } from '../../../../api/types'
import { useCreateFileSystemItemMutation } from './useCreateFileSystemItemMutation'
import { validateItemName } from './utils'

export const CreateFileSystemItemForm = ({
  parentId,
  onCreated,
}: {
  parentId?: string

  onCreated: VoidFunction
}) => {
  const canCreateFile = parentId !== undefined
  const { mutate, reset, isPending, error } = useCreateFileSystemItemMutation(parentId)
  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitted },
    watch,
  } = useForm<{ name: string; type: FileSystemItemType }>({
    defaultValues: { name: '', type: 'folder' },
  })
  const type = watch('type')

  const onSubmit = handleSubmit((values) => {
    if (values.type === 'file' && !canCreateFile) return
    mutate(values, { onSuccess: onCreated })
  })

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
                { label: 'File', value: 'file', disabled: !canCreateFile },
              ]}
            />
          )}
        />
        {!canCreateFile && (
          <Text size="sm" c="dimmed">
            Files can only be created inside a folder.
          </Text>
        )}
        <TextInput
          data-autofocus
          label="Name"
          placeholder={type === 'file' ? 'report.pdf' : 'reports'}
          error={errors.name?.message}
          {...register('name', {
            validate: (value, formValues) => validateItemName(value, formValues.type),
            onChange: () => reset(),
          })}
        />
        {error && <Alert color="red">{error.message}</Alert>}
        <Group justify="flex-end">
          <Button type="submit" loading={isPending}>
            Create
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
