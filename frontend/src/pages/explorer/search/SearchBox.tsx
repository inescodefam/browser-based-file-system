import { Autocomplete, Button, Checkbox, Group, Loader, Stack } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { FolderRef } from '../FolderBreadcrumbs'
import { useSuggestionsQuery } from './useSuggestionsQuery'
import type { FileSearch } from './useSearchQuery'

const SEARCH_DEBOUNCE_MS = 500

export const SearchBox = ({
  currentFolder,
  onSearch,
}: {
  currentFolder: FolderRef | null
  onSearch: (search: FileSearch) => void
}) => {
  const { control, register, handleSubmit, getValues } = useForm<{
    term: string
    onlyInFolder: boolean
  }>({ defaultValues: { term: '', onlyInFolder: false } })

  const term = useWatch({ control, name: 'term' })
  const [debouncedTerm] = useDebouncedValue(term, SEARCH_DEBOUNCE_MS)
  const suggestions = useSuggestionsQuery(debouncedTerm)

  const suggestedNames = [...new Set(suggestions.data?.map((file) => file.name))]

  const search = (name: string, onlyInFolder: boolean) => {
    const trimmedName = name.trim()
    if (trimmedName === '') return
    onSearch({ name: trimmedName, parentId: onlyInFolder && currentFolder ? currentFolder.id : null })
  }

  const onSubmit = handleSubmit(({ term, onlyInFolder }) => search(term, onlyInFolder))

  return (
    <form onSubmit={onSubmit}>
      <Stack gap="xs">
        <Group align="flex-end">
          <Controller
            name="term"
            control={control}
            render={({ field }) => (
              <Autocomplete
                flex={1}
                label="Search files"
                placeholder="Start typing a file name"
                value={field.value}
                onChange={field.onChange}
                onOptionSubmit={(name) => search(name, getValues('onlyInFolder'))}
                data={suggestedNames}
                filter={({ options }) => options}
                rightSection={suggestions.isFetching ? <Loader size="xs" /> : null}
              />
            )}
          />
          <Button type="submit">Search</Button>
        </Group>
        {currentFolder && (
          <Checkbox label={`Only search in "${currentFolder.name}"`} {...register('onlyInFolder')} />
        )}
      </Stack>
    </form>
  )
}
