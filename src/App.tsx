import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import CategoriesPage from '@/pages/CategoriesPage'
import TransactionsPage from '@/pages/TransactionsPage'
import IncomePage from '@/pages/IncomePage'
import CreditCardsPage from '@/pages/CreditCardsPage'
import CreditCardDetailPage from '@/pages/CreditCardDetailPage'
import InstallmentsPage from '@/pages/InstallmentsPage'
import InstallmentGroupDetailPage from '@/pages/InstallmentGroupDetailPage'
import ReportMonthlyPage from '@/pages/ReportMonthlyPage'
import ReportQuarterlyPage from '@/pages/ReportQuarterlyPage'
import ReportSemiannualPage from '@/pages/ReportSemiannualPage'
import ReportAnnualPage from '@/pages/ReportAnnualPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/lancamentos" replace />} />
        <Route path="/lancamentos" element={<TransactionsPage />} />
        <Route path="/receitas" element={<IncomePage />} />
        <Route path="/cartoes" element={<CreditCardsPage />} />
        <Route path="/cartoes/:id" element={<CreditCardDetailPage />} />
        <Route path="/parcelamentos" element={<InstallmentsPage />} />
        <Route path="/parcelamentos/:id" element={<InstallmentGroupDetailPage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="/relatorios" element={<Navigate to="/relatorios/mensal" replace />} />
        <Route path="/relatorios/mensal" element={<ReportMonthlyPage />} />
        <Route path="/relatorios/trimestral" element={<ReportQuarterlyPage />} />
        <Route path="/relatorios/semestral" element={<ReportSemiannualPage />} />
        <Route path="/relatorios/anual" element={<ReportAnnualPage />} />
        <Route path="*" element={<Navigate to="/lancamentos" replace />} />
      </Route>
    </Routes>
  )
}
