import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function HomePage() {
	const [orderId, setOrderId] = useState('')
	const navigate = useNavigate()

	function handleTrack(e) {
		e.preventDefault()
		if (orderId.trim()) {
			navigate(`/order/${orderId}`)
		}
	}

	return (
		<div>
			<section className="hero">
				<h1>Pizza Planet</h1>
				<p>Build your pizza, your way. Fresh. Fast. Simple.</p>

				<div className="tooltip-wrapper">
					<Link to="/menu" className="primary-btn">
						View Premade options
					</Link>

					<div className="tooltip">
						Quick-select popular pizzas like Pepperoni, Meat Lovers, or Veggie.
					</div>
				</div>

			</section>


			{/* Menu Preview */}
			<section className="menu-preview">
				<h2 className="center-title">Menu</h2>


				<div className="menu-cards">
					<div className="menu-card hover-box">
						<h3>Pizza</h3>
						<p>Hand-tossed or thin crust. Classic toppings.</p>
						<Link to="/builder/pizza">Build Pizza</Link>
					</div>

					<div className="menu-card hover-box">
						<h3>Salad</h3>
						<p>Fresh greens with premium add-ins.</p>
						<Link to="/builder/salad">Build Salad</Link>
					</div>

					<div className="menu-card hover-box">
						<h3>Calzone</h3>
						<p>Stuffed, baked, and loaded.</p>
						<Link to="/builder/calzone">Build Calzone</Link>
					</div>
				</div>
			</section>
		</div>
	)
}
