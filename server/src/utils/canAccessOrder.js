export function canAccessOrder(req, order) {
	if (!req.user) return false
	const role = String(req.user.role || "").toLowerCase()
	if (role === "staff" || role === "admin") return true
	return String(order.userId || "") === String(req.user.id || "")
}
