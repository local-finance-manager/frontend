import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import CategoriesPage from '@/pages/CategoriesPage'
import TransactionsPage from '@/pages/TransactionsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/lancamentos" replace />} />
        <Route path="/lancamentos" element={<TransactionsPage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="*" element={<Navigate to="/lancamentos" replace />} />
      </Route>
    </Routes>
  )
}
