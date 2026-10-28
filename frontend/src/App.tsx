import { Container, Title } from '@mantine/core'
import { FolderBrowser } from './features/browser/FolderBrowser'
import { APP_TITLE } from './constants'

function App() {
  return (
    <Container py="xl">
      <Title order={1} mb="md">
        {APP_TITLE}
      </Title>
      <FolderBrowser />
    </Container>
  )
}

export default App
