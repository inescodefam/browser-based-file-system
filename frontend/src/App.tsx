import { Container, Text, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { nodesApi } from './api/nodes'

function App() {
  const { data, error, isPending } = useQuery({
    queryKey: ['nodes', null],
    queryFn: ({ signal }) => nodesApi.list(null, signal),
  })

  return (
    <Container py="xl">
      <Title order={1}>Browser-based file system</Title>
      {isPending && <Text>Connecting to the API...</Text>}
      {error && <Text c="red">Could not reach the API: {error.message}</Text>}
      {data && <Text>Connected. {data.length} item(s) at the top level.</Text>}
    </Container>
  )
}

export default App
