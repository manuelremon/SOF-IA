import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingOverlay } from '@mantine/core'
import AppShell from './components/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CatalogoPage from './pages/CatalogoPage'
import StockPage from './pages/StockPage'
import ClientesPage from './pages/ClientesPage'
import ProveedoresPage from './pages/ProveedoresPage'
import UsuariosPage from './pages/UsuariosPage'
import ConfiguracionPage from './pages/ConfiguracionPage'
import ComprasPage from './pages/ComprasPage'
import RecepcionesPage from './pages/RecepcionesPage'
import ReportesPage from './pages/ReportesPage'
import CajaPage from './pages/CajaPage'
import AyudaPage from './pages/AyudaPage'
import { useAuthStore, type AuthUser } from './stores/authStore'

function App(): JSX.Element {
  const { user, isAuthenticated, login } = useAuthStore()

  const handleLogin = (authUser: AuthUser): void => {
    login(authUser)
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  const isAdmin = user?.role === 'admin'

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/caja" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/catalogo" element={<CatalogoPage />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/proveedores" element={<ProveedoresPage />} />
        <Route path="/compras" element={<ComprasPage />} />
        <Route path="/recepciones" element={<RecepcionesPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/caja" element={<CajaPage />} />
        {isAdmin && <Route path="/usuarios" element={<UsuariosPage />} />}
        {isAdmin && <Route path="/configuracion" element={<ConfiguracionPage />} />}
        <Route path="/ayuda" element={<AyudaPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
