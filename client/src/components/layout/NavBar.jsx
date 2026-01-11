import { Link } from 'react-router-dom'

export default function NavBar(){
	return(
		<nav>
			<Link to="/">Home</Link>{" | "}
			<Link to="/menu">Menu</Link>{" | "}
			<Link to="/checkout">Checkout</Link>
		</nav>
	)
}
