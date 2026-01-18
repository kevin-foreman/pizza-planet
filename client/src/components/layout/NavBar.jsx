import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'

export default function NavBar() {
	const { items, itemCount } = useCart()
	const hasItems = (typeof itemCount === 'number' ? itemCount : (items?.length || 0)) > 0

	return (
		<nav>
			<Link to="/">Home</Link>{" | "}
			<Link to="/menu">Menu</Link>

			{hasItems && (
				<>
					{" | "}
					<Link to="/checkout">Checkout</Link>
				</>
			)}
		</nav>
	)
}
