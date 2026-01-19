import { StrictMode } from 'react'

// Not needed for now, but we'll leave this here to import createRoot just in case
// import { createRoot } from 'react-dom/client'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { PricingProvider } from './context/PricingContext.jsx'
// The order of the next 2 may cause problems keep an eye here if App needs to be first.
import './index.css'
import App from './App.jsx'

// This will contain the primary frame for the application
ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<AuthProvider>
			<CartProvider>
				<PricingProvider>
					<BrowserRouter>
						<App />
					</BrowserRouter>
				</PricingProvider>
			</CartProvider>
		</AuthProvider>
	</React.StrictMode>
)
