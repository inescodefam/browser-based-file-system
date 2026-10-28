import { Container, Title } from '@mantine/core'
import { Route, Routes } from 'react-router-dom'
import { ExplorerPage } from './pages/explorer/ExplorerPage'

const App = () => (
  <Container py="xl">
    <Title order={1} mb="md">
      File system explorer
    </Title>
    <Routes>
      <Route path="/" element={<ExplorerPage />} />
      <Route path="/folders/:folderId" element={<ExplorerPage />} />
    </Routes>
  </Container>
)

export default App
