import { Link } from 'react-router-dom'

export default function OrderConfirmationPage() {
	return (
		<div style={{ padding: '16px', maxWidth: '720px', margin: '0 auto' }}>
			<h1>Order Confirmed</h1>
			<p>Thanks! Your order has been placed.</p>
			<Link to="/menu">Back to Menu</Link>
		</div>
	)
}
