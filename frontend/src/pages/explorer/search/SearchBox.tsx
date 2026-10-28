import { Autocomplete, Checkbox, CloseButton, Group, Loader, Stack } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useEffect, useMemo, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { FolderRef } from '../FolderBreadcrumbs'
import { SEARCH_DEBOUNCE_MS } from './fileSearch'
import { useSuggestionsQuery } from './useSuggestionsQuery'

const asInputValue = (value: unknown) => (typeof value === 'string' ? value : '')

const isSuggestionPick = (previous: string, next: string, suggestions: string[]) => {
  const picked = next.trim()
  const typed = previous.trim()
  if (picked === '' || picked === typed || !suggestions.includes(picked)) return false
  return !(picked.startsWith(typed) && picked.length === typed.length + 1)
}

export const SearchBox = ({
  currentFolder,
  initialTerm,
  initialOnlyInFolder,
  onPrefix,
  onExact,
}: {
  currentFolder?: FolderRef
  initialTerm: string
  initialOnlyInFolder: boolean
  onPrefix: (term: string, parentId?: string) => void
  onExact: (name: string, parentId?: string) => void
}) => {
  const { control, register, handleSubmit, getValues, watch } = useForm<{
    term: string
    onlyInFolder: boolean
  }>({ defaultValues: { term: initialTerm, onlyInFolder: initialOnlyInFolder } })

  const term = asInputValue(watch('term'))
  const [debouncedTerm] = useDebouncedValue(term, SEARCH_DEBOUNCE_MS)
  const onlyInFolder = watch('onlyInFolder')
  const parentId = onlyInFolder && currentFolder ? currentFolder.id : undefined
  const suggestions = useSuggestionsQuery(debouncedTerm, parentId)
  const exactName = useRef<string | undefined>(undefined)

  const suggestedNames = useMemo(
    () => [...new Set(suggestions.data?.map((file) => file.name))],
    [suggestions.data],
  )

  const exact = (name: unknown) => {
    const trimmedName = asInputValue(name).trim()
    if (trimmedName === '') return
    exactName.current = trimmedName
    const scoped = getValues('onlyInFolder')
    onExact(trimmedName, scoped && currentFolder ? currentFolder.id : undefined)
  }

  useEffect(() => {
    const trimmedTerm = term.trim()
    if (trimmedTerm === '') {
      exactName.current = undefined
      onPrefix('')
      return
    }

    if (exactName.current !== undefined && exactName.current !== trimmedTerm) {
      if (exactName.current.startsWith(trimmedTerm)) return
      exactName.current = undefined
    }

    if (debouncedTerm.trim() !== trimmedTerm) return

    if (exactName.current === trimmedTerm) {
      onExact(trimmedTerm, parentId)
      return
    }

    onPrefix(trimmedTerm, parentId)
  }, [term, debouncedTerm, parentId, onPrefix, onExact])

  return (
    <form onSubmit={handleSubmit(({ term: submitted }) => exact(submitted))}>
      <Stack gap="xs">
        <Controller
          name="term"
          control={control}
          render={({ field: { value, onChange } }) => {
            const inputValue = asInputValue(value)
            return (
              <Autocomplete
                label="Search files"
                labelProps={{ fw: 500, pb: 'xs' }}
                placeholder="Start typing a file name"
                value={inputValue}
                onChange={(next) => {
                  const nextValue = asInputValue(next)
                  onChange(nextValue)
                  if (isSuggestionPick(inputValue, nextValue, suggestedNames)) exact(nextValue)
                }}
                onOptionSubmit={exact}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  event.stopPropagation()
                  exact(inputValue)
                }}
                data={suggestedNames}
                filter={({ options }) => options}
                rightSectionPointerEvents="all"
                rightSection={
                  <Group gap={4} wrap="nowrap">
                    {suggestions.isFetching && <Loader size="xs" />}
                    {inputValue && (
                      <CloseButton
                        aria-label="Clear search"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onChange('')}
                      />
                    )}
                  </Group>
                }
              />
            )
          }}
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
