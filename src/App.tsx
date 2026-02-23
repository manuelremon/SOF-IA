import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingOverlay } from '@mantine/core'
import AppShell from './components/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import VentasPage from './pages/VentasPage'
import InventarioPage from './pages/InventarioPage'
import CatalogoPage from './pages/CatalogoPage'
import ClientesPage from './pages/ClientesPage'
import ProveedoresPage from './pages/ProveedoresPage'
import UsuariosPage from './pages/UsuariosPage'
import ConfiguracionPage from './pages/ConfiguracionPage'
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
        <Route path="/" element={<DashboardPage />} />
        <Route path="/ventas" element={<VentasPage />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/catalogo" element={<CatalogoPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/proveedores" element={<ProveedoresPage />} />
        {isAdmin && <Route path="/usuarios" element={<UsuariosPage />} />}
        {isAdmin && <Route path="/configuracion" element={<ConfiguracionPage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
