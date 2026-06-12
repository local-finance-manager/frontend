import { Routes, Route, Navigate } from 'react-router-dom'
import CategoriesPage from '@/pages/CategoriesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/categorias" element={<CategoriesPage />} />
      <Route path="*" element={<Navigate to="/categorias" replace />} />
    </Routes>
  )
}
