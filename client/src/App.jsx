import React from 'react'
import AppRoutes from './routes/AppRoutes.jsx'
import Header from './components/layout/Header.jsx'
import Footer from './components/layout/Footer.jsx'

import { useAuth } from './context/AuthContext.jsx'

function App() {
	const { user, logout } = useAuth()

	return (
		<div className="app-shell">
			<div className="container full-width">
				<Header />
				<main className="main">
					<AppRoutes />
				</main>
				<Footer />
			</div>
{/* DEBUG FOR BOTTOM LEFT
<pre style={{ position: 'fixed', left: '16px', bottom: '16px', zIndex: 999999 }}>
	{JSON.stringify(user, null, 2)}
</pre>
*/}

		</div>
	)
}

export default App
