import NavBar from './NavBar.jsx'

export default function Header() {
	return (
		<header className="site-header">
			<div className="header-row">
				<div className="header-left">
					<NavBar />
				</div>

				<div className="site-title">
					<img src="/Sprites/logo.webp" alt="Pizza Planet" className="site-logo" />
				</div>
			</div>

			<div className="header-banner" aria-hidden>
				<img src="/Sprites/banner.webp" alt="" />
			</div>
		</header>
	)
}
