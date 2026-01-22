import NavBar from './NavBar.jsx'

export default function Header() {
	return (
		<header className="site-header">
			<div className="header-row">
				<div className="header-left">
					<NavBar />
				</div>

				<div className="site-title">
					<img src="/logo.png" alt="Pizza Planet" className="site-logo" />
				</div>
			</div>

			<div className="header-banner" aria-hidden>
				<img src="/banner.png" alt="" />
			</div>
		</header>
	)
}
