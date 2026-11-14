import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './store'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Research from './programme/research'
import Administration from './pages/Administration'
import Communication from './pages/Communication'
import Finance from './pages/Finance'
import AucSoe from './pages/AucSoe'
import Staff from './pages/Staff'
import Meetings from './pages/Meetings'
import Documents from './pages/Documents'
import Reports from './pages/Reports'
import Masters from './pages/Masters'
import Users from './pages/Users'
import System from './pages/System'

const PAGES = {
  dashboard: ['/', Dashboard], research: ['/research', Research], administration: ['/administration', Administration],
  communication: ['/communication', Communication], finance: ['/finance', Finance], aucsoe: ['/auc-soe', AucSoe],
  staff: ['/staff', Staff], meetings: ['/meetings', Meetings], documents: ['/documents', Documents],
  reports: ['/reports', Reports], masters: ['/masters', Masters], users: ['/users', Users], system: ['/system', System],
}

export default function App() {
  const { role, toasts } = useStore()
  return (
    <>
      <div className="tricolour" />
      {!role ? <Login /> : (
        <Routes>
          <Route element={<Layout />}>
            {role.modules.map((m) => {
              const [path, Component] = PAGES[m]
              return <Route key={m} path={path} element={<Component />} />
            })}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
      <div className="toasts">{toasts.map((t) => <div key={t.id} className="toast">{t.text}</div>)}</div>
    </>
  )
}
