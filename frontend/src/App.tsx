import { Container, Title } from '@mantine/core'
import { ExplorerPage } from './pages/explorer/ExplorerPage'

const App = () => (
  <Container py="xl">
    <Title order={1} mb="md">
      File system explorer
    </Title>
    <ExplorerPage />
  </Container>
)

export default App
