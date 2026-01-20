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
					<p>Manage what toppings are available.</p>
					<Link to="/admin/toppings">Edit Toppings</Link>
				</div>

				<div className="menu-card hover-box">
					<h3>Users</h3>
					<p>Search for customer accounts and edit account roles.</p>
					<Link to="/admin/users">Edit Users</Link>
				</div>
			</div>
		</div>
	)
}
