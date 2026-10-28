import { Container, Title } from '@mantine/core'
import { AppRoutes } from './AppRoutes'

const App = () => (
  <Container py="xl">
    <Title order={1} mb="md">
      File system explorer
    </Title>
    <AppRoutes />
  </Container>
)

export default App
