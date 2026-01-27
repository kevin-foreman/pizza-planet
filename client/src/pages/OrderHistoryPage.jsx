import React,{useEffect,useState}from"react"
import{Link}from"react-router-dom"
import{jsonFetch}from"../api/http.js"

export default function OrderHistoryPage(){
	const[data,setData]=useState({active:[],archived:[]})
	const[err,setErr]=useState("")
	const[loading,setLoading]=useState(true)

	useEffect(()=>{
		let alive=true
		;(async()=>{
			try{
				setErr("")
				setLoading(true)
				const d=await jsonFetch("/api/orders/mine")
				if(!alive)return
				setData(d||{active:[],archived:[]})
			}catch(e){
				if(!alive)return
				setErr(String(e?.message||e))
			}finally{
				if(!alive)return
				setLoading(false)
			}
		})()
		return()=>{alive=false}
	},[])

	return(
		<div className="page orders-history">
			<div className="panel">
				<div className="panel-head">
					<h2>Your Orders</h2>
					<Link to="/" className="link-btn">Home</Link>
				</div>

				{loading&&<div className="muted">Loading...</div>}
				{!!err&&<div className="error">{err}</div>}

				{!!data?.active?.length&&(
					<>
						<h3 style={{marginTop:10}}>Active</h3>
						<div className="track-list">
							{data.active.map(o=>(
								<div className="track-card" key={o.orderId}>
									<div className="track-title">
										<div className="mono">{o.orderId}</div>
										<div className="muted">{String(o.status||"")}</div>
									</div>
									<div className="track-card-actions">
										<Link className="primary-btn" to={`/order/${o.orderId}`}>Track</Link>
									</div>
								</div>
							))}
						</div>
					</>
				)}

				{!!data?.archived?.length&&(
					<>
						<h3 style={{marginTop:18}}>Past Orders</h3>
						<div className="track-list">
							{data.archived.map(o=>(
								<div className="track-card" key={`${o.orderId}-${o.archivedAt||""}`}>
									<div className="track-title">
										<div className="mono">{o.orderId}</div>
										<div className="muted">{String(o.status||"")}</div>
									</div>
									<div className="track-meta">
										<div className="muted">Placed</div>
										<div className="mono">{o.createdAt?new Date(o.createdAt).toLocaleString():""}</div>
									</div>
								</div>
							))}
						</div>
					</>
				)}

				{!loading&&!err&&!data.active.length&&!data.archived.length&&(
					<div className="muted">No orders yet.</div>
				)}
			</div>
		</div>
	)
}
