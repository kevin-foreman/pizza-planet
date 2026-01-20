import { jsonFetch } from "./auth.js"


export const adminApi = {
    listUsers: () => jsonFetch('/api/admin/users'),
    setUserRole: (id, role) => jsonFetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
    }),
    deleteUser: (id) => jsonFetch(`/api/admin/users/${id}`, {
        method: "DELETE"
    }),
}
