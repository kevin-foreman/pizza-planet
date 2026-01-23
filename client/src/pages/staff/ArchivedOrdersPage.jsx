import React,{useEffect,useState}from"react"
import StaffOrderCard from"../../components/staff/StaffOrderCard.jsx"
import{jsonFetch}from"../../api/http.js"

export default function ArchivedOrdersPage(){
	const[orders,setOrders]=useState([])
	const[error,setError]=useState("")

	async function load(){
		try{
			setError("")
			const data=await jsonFetch("/api/staff/orders?show=archived")
			if(Array.isArray(data))setOrders(data)
			else if(Array.isArray(data?.orders))setOrders(data.orders)
			else setOrders([])
		}catch(e){
			setError(e?.message||"Failed to load archived orders")
			setOrders([])
		}
	}

	useEffect(()=>{load()},[])

	return(
		<div className="page staff-page">
			<h1 className="page-title">Archived Orders</h1>

			{error&&<div className="error">{error}</div>}

			<div className="orders-scroll">
				{orders.length===0?(
					<div style={{padding:12}}>No archived orders.</div>
				):(
					orders.map(o=>(
						<StaffOrderCard key={o._id} order={o} readOnly />
					))
				)}
			</div>
		</div>
	)
}
