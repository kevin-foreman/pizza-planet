import React,{useState} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage(){
	const [role,setRole]=useState('customer')
	const {login}=useAuth()
	const navigate=useNavigate()

	function handleLogin(){
		login(role)

		if(role==='admin')navigate('/admin/pricing')
		else if(role==='staff')navigate('/staff/orders')
		else navigate('/menu')
	}

	return(
		<div style={{maxWidth:'420px',margin:'40px auto'}}>
			<h1>Login</h1>

			<label style={{display:'block',marginBottom:'12px'}}>
				Role
				<select
					value={role}
					onChange={e=>setRole(e.target.value)}
					style={{width:'100%',marginTop:'6px'}}
				>
					<option value="customer">Customer</option>
					<option value="staff">Staff</option>
					<option value="admin">Admin</option>
				</select>
			</label>

			<button
				onClick={handleLogin}
				style={{width:'100%',marginTop:'12px'}}
			>
				Login
			</button>
		</div>
	)
}
