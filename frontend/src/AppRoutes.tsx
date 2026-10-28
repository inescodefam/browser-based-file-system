import { Route, Routes } from 'react-router-dom'
import { ExplorerPage } from './pages/explorer/ExplorerPage'

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<ExplorerPage />} />
    <Route path="/folders/:folderId" element={<ExplorerPage />} />
  </Routes>
)
