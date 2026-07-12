import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { TollDataProvider } from './data/TollDataProvider'
import CalculatorPage from './pages/CalculatorPage'
import ExpresswaysPage from './pages/ExpresswaysPage'
import AdminPage from './pages/AdminPage'
import NotFoundPage from './pages/NotFoundPage'

const App = () => {
  // The app is open (no site password). `/admin` is reachable only by typing the
  // URL and is protected by its own password inside <AdminPage>.
  return (
    <TollDataProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<CalculatorPage />} />
          <Route path="/expressways" element={<ExpresswaysPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </TollDataProvider>
  )
}

export default App
