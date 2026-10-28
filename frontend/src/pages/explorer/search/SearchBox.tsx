import { Autocomplete, Checkbox, CloseButton, Group, Loader, Stack } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import type { FolderRef } from '../FolderBreadcrumbs'
import { SEARCH_DEBOUNCE_MS } from './fileSearch'
import { useSuggestionsQuery } from './useSuggestionsQuery'

export const SearchBox = ({
  currentFolder,
  initialTerm,
  initialOnlyInFolder,
  onPrefix,
  onExact,
}: {
  currentFolder: FolderRef | null
  initialTerm: string
  initialOnlyInFolder: boolean
  onPrefix: (term: string, parentId?: string | null) => void
  onExact: (name: string, parentId: string | null) => void
}) => {
  const { control, register, handleSubmit, getValues } = useForm<{
    term: string
    onlyInFolder: boolean
  }>({ defaultValues: { term: initialTerm, onlyInFolder: initialOnlyInFolder } })

  const term = useWatch({ control, name: 'term' })
  const onlyInFolder = useWatch({ control, name: 'onlyInFolder' })
  const [debouncedTerm] = useDebouncedValue(term, SEARCH_DEBOUNCE_MS)
  const parentId = onlyInFolder && currentFolder ? currentFolder.id : null
  const suggestions = useSuggestionsQuery(debouncedTerm, parentId)

  const suggestedNames = [...new Set(suggestions.data?.map((file) => file.name))]

  useEffect(() => {
    const typed = term.trim()
    if (typed === '') {
      onPrefix('')
      return
    }
    if (debouncedTerm.trim() !== typed) return
    onPrefix(typed, parentId)
  }, [term, debouncedTerm, parentId, onPrefix])

  const exact = (name: string) => {
    const trimmedName = name.trim()
    if (trimmedName === '') return
    const scoped = getValues('onlyInFolder')
    onExact(trimmedName, scoped && currentFolder ? currentFolder.id : null)
  }

  return (
    <form onSubmit={handleSubmit(({ term }) => exact(term))}>
      <Stack gap="xs">
        <Controller
          name="term"
          control={control}
          render={({ field }) => (
            <Autocomplete
              label="Search files"
              placeholder="Start typing a file name"
              value={field.value}
              onChange={field.onChange}
              onOptionSubmit={exact}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                event.stopPropagation()
                exact(field.value)
              }}
              data={suggestedNames}
              filter={({ options }) => options}
              rightSectionPointerEvents="all"
              rightSection={
                <Group gap={4} wrap="nowrap">
                  {suggestions.isFetching && <Loader size="xs" />}
                  {field.value && (
                    <CloseButton
                      aria-label="Clear search"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => field.onChange('')}
                    />
                  )}
                </Group>
              }
            />
          )}
        />
        {currentFolder ? (
          <Checkbox label={`Only search in "${currentFolder.name}"`} {...register('onlyInFolder')} />
        ) : (
          <Checkbox label="Searching all items" disabled checked={false} />
        )}
      </Stack>
    </form>
  )
}
