export default function Footer(){
	return(
		<footer className="footer">
			<div>
				<strong>Pizza Planet</strong>
			</div>

			<div>
				By Brandon Bradway, Kevin Foreman, and Matt Oravec
			</div>

			<div>
				© {new Date().getFullYear()} · Academic Project · All rights reserved
			</div>

		</footer>
	)
}
