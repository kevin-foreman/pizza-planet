import NavBar from './NavBar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'

export default function Header() {
	const { user, logout } = useAuth()
	const { itemCount, subtotal } = useCart()
	const navigate = useNavigate()

	function handleLogout() {
		logout()
		navigate('/login')
	}

	function CartIcon({ count, total }) {
		return (
			<div className="cart-icon-wrap">
				{/* Items in cart */}
				{count > 0 && (
					<span className="cart-count">({count})</span>
				)}
				{/* cart Icon */}
				<svg
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="9" cy="21" r="1" />
					<circle cx="20" cy="21" r="1" />
					<path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
				</svg>
				{/* cart Total $ */}
				{total > 0 && (
					<span className="cart-subtotal">
						${Number(total).toFixed(2)}
					</span>
				)}
			</div>
		)
	}
	{/* Top right  */ }
	return (
		<header className="site-header">
			<div className="header-row">
				<h1 className="site-title">Pizza Planet</h1>

				<div className="header-actions">
					<Link to="/cart" className="cart-link" aria-label="Cart">
						<CartIcon
							count={itemCount}
							total={subtotal}
						/>
					</Link>

					{user ? (
						<>
							<span>Welcome, {user.name}</span>

							{user.role === 'admin' && (
								<Link to="/admin">Admin</Link>
							)}

							<button type="button" onClick={handleLogout}>
								Logout
							</button>
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
