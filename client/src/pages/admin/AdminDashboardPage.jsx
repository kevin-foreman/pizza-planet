import { Link } from 'react-router-dom'

export default function AdminDashboardPage() {
	return (
		<div>
			<h1>Admin</h1>
			<p style={{ opacity: 0.85 }}>Manage pricing and menu settings.</p>

			<div className="menu-cards">
				<div className="menu-card hover-box">
					<h3>Pricing</h3>
					<p>Edit topping and entree prices.</p>
					<Link to="/admin/pricing">Open Pricing</Link>
				</div>

				<div className="menu-card hover-box">
					<h3>Toppings</h3>
					<p>(Placeholder) Manage what toppings are available.</p>
					<Link to="/admin/toppings">Edit Toppings</Link>
				</div>

				<div className="menu-card hover-box">
					<h3>Users</h3>
					<p>(Placeholder) Admin accounts, staff accounts.</p>
					<span style={{ opacity: 0.7 }}>Coming soon</span>
				</div>
			</div>
		</div>
	)
}
