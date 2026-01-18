import NavBar from './NavBar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const greetingName = user?.displayName?.trim() || user?.email || 'User'

  return (
    <header className="site-header">
      <div className="header-row">
        <h1 className="site-title">Pizza Planet</h1>

        <div className="header-actions">
          {user ? (
            <>
              <span>Welcome, {greetingName}</span>

              {user.role === 'admin' && (
                <Link to="/admin">Admin</Link>
              )}

              {user.role === 'staff' && (
                <Link to="/staff/orders">Staff</Link>
              )}

              <button type="button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </div>

      <NavBar />
    </header>
  )
}
