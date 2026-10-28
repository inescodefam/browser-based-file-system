import { Container, Title } from '@mantine/core'
import { ExplorerPage } from './pages/explorer/ExplorerPage'

const App = () => (
  <Container py="xl">
    <Title order={1} mb="md">
      Browser-based file system
    </Title>
    <ExplorerPage />
  </Container>
)

export default App
