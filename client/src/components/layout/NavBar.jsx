import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'

export default function NavBar() {
	const { user, logout } = useAuth()
	const { itemCount, subtotal, items } = useCart()
	const navigate = useNavigate()

	const count = typeof itemCount === 'number' ? itemCount : (items?.length || 0)
	const hasItems = count > 0

	function handleLogout() {
		logout()
		navigate('/login')
	}

	return (
		<nav className="main-nav">
			<div className="nav-left">
				<Link to="/">Home</Link>
				<span className="nav-sep">|</span>
				<Link to="/menu">Menu</Link>

				{user && hasItems && (
					<>
						<span className="nav-sep">|</span>
						<Link to="/checkout">Checkout</Link>
					</>
				)}
			</div>

			<div className="nav-right">
				{user ? (
					<>
						{hasItems && (
							<Link to="/cart" className="nav-cart" aria-label="Cart">
								<svg className="nav-cart-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<circle cx="9" cy="21" r="1" />
									<circle cx="20" cy="21" r="1" />
									<path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
								</svg>
								<span className="nav-cart-count">({count})</span>
								<span className="nav-cart-total">${Number(subtotal || 0).toFixed(2)}</span>
							</Link>
						)}

						{user.role === 'admin' && (
							<>
								<span className="nav-sep">|</span>
								<Link to="/admin">Admin</Link>
							</>
						)}

						{(user.role === 'admin' || user.role === 'staff') && (
							<>
								<span className="nav-sep">|</span>
								<Link to="/staff">Staff</Link>
							</>
						)}
						<>
							<span className="nav-sep">|</span>
							<Link to="/orders">Order History</Link>
						</>

						<span className="nav-sep">|</span>
						<button type="button" className="nav-logout" onClick={handleLogout}>Logout</button>
					</>
				) : (
					<>
						<Link to="/login" state={{ mode: "login" }}>Login</Link>
						<span className="nav-sep">|</span>
						<Link to="/login" state={{ mode: "signup" }} className="nav-link">Sign Up</Link>

					</>
				)}
			</div>

		</nav>
	)
}
