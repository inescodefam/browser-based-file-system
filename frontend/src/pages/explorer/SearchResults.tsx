import { Alert, Button, Group, Loader, Stack, Table, Text } from '@mantine/core'
import { useSearchQuery, type FileSearch } from './useSearchQuery'

export const SearchResults = ({
  search,
  onClear,
}: {
  search: FileSearch
  onClear: () => void
}) => {
  const results = useSearchQuery(search)

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text fw={600}>
          Files named "{search.name}" {search.parentId ? 'in the selected folder' : 'everywhere'}
        </Text>
        <Button variant="subtle" size="xs" onClick={onClear}>
          Clear search
        </Button>
      </Group>

      {results.isPending && <Loader size="sm" />}
      {results.error && <Alert color="red">{results.error.message}</Alert>}
      {results.data?.length === 0 && <Text c="dimmed">No file with exactly this name.</Text>}
      {results.data && results.data.length > 0 && (
        <Table aria-label="Search results">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Location</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {results.data.map((file) => (
              <Table.Tr key={file.id}>
                <Table.Td>{file.name}</Table.Td>
                <Table.Td>{file.parentId === null ? 'All items' : 'In a subfolder'}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  )
}
