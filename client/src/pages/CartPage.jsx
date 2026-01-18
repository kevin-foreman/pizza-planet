import React from 'react'
import { Link,useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

export default function CartPage(){
	// Cart state + actions
	const {
		items,
		removeItem,
		setQty,
		clearCart,
		subtotal,
		tipAmount,
		setTipAmount,
		total,
	}=useCart()

	const navigate=useNavigate()

	// Helper: keep tips sane (no negatives, 2 decimals)
	function setTip(value){
		const n=Number(value)||0
		const clean=Math.max(0,Math.round(n*100)/100)
		setTipAmount(clean)
	}

	// Helper: calculate percent tip from subtotal
	function tipFromPct(pct){
		const t=Math.round(subtotal*pct*100)/100
		setTip(t)
	}

	function goCheckout(){
		navigate('/checkout')
	}

	return(
		<div className="page">
			<div className="page-header">
				<h1 className="page-title center-title">Cart</h1>
				<p className="page-sub center-title">Review items, adjust quantities, add a tip, then checkout.</p>
			</div>

			{items.length===0?(
				<div className="panel" style={{textAlign:'center'}}>
					<p style={{opacity:0.85}}>Your cart is empty.</p>
					<div style={{marginTop:'12px'}}>
						<Link to="/menu" className="primary-btn">Browse Menu</Link>
					</div>
				</div>
			):(
				<div className="page cart-page">
                    <div className="cart-grid">
                        <section className="panel">
						<h2>Items</h2>

						<div className="order-list">
							{items.map(i=>(
								<div key={i.id} className="order-card hover-box">
									<div className="order-top">
										<div>
											<div className="order-id">{i.name||'Item'}</div>

											<div className="order-meta">
												<span className="pill pill-RECEIVED">{(i.type||'item').toUpperCase()}</span>
												{i.display?.size?(
													<>
														<span className="dot">•</span>
														<span>{i.display.size}</span>
													</>
												):null}
												{i.display?.crust?(
													<>
														<span className="dot">•</span>
														<span>{i.display.crust}</span>
													</>
												):null}
												{i.display?.sauce?(
													<>
														<span className="dot">•</span>
														<span>{i.display.sauce}</span>
													</>
												):null}
											</div>
										</div>

										<div className="order-total">${(i.unitPrice||0).toFixed(2)}</div>
									</div>

									{i.display?.toppings&&i.display.toppings.length>0?(
										<div style={{marginTop:'10px',opacity:0.9}}>
											<b>Toppings:</b> {i.display.toppings.join(', ')}
										</div>
									):null}

									{i.notes?(
										<div className="order-notes">
											<b>Notes:</b> {i.notes}
										</div>
									):null}

									<div className="order-actions">
										<div style={{display:'flex',alignItems:'center',gap:'8px'}}>
											<span style={{opacity:0.85}}>Qty</span>
											<input
												type="number"
												min="1"
												value={i.qty||1}
												onChange={e=>setQty(i.id,e.target.value)}
												style={{maxWidth:'90px'}}
											/>
										</div>

										<div className="order-actions-split"/>

										<button type="button" className="btn-danger" onClick={()=>removeItem(i.id)}>
											Remove
										</button>
									</div>
								</div>
							))}
						</div>

						<div style={{marginTop:'14px',display:'flex',gap:'10px',flexWrap:'wrap'}}>
							<button type="button" className="btn-ghost" onClick={clearCart}>Clear Cart</button>
							<Link to="/builder/pizza">Build Another Pizza</Link>
							<Link to="/menu">Menu</Link>
						</div>
					</section>

					<aside className="panel">
						<h2>Summary</h2>

						<div style={{display:'flex',justifyContent:'space-between'}}>
							<span>Subtotal</span>
							<span>${subtotal.toFixed(2)}</span>
						</div>

						<div style={{marginTop:'12px'}}>
							<div style={{fontWeight:700,marginBottom:'8px'}}>Tip</div>

							<div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
								<button type="button" className="btn-ghost" onClick={()=>setTip(0)}>No tip</button>
								<button type="button" className="btn-ghost" onClick={()=>tipFromPct(0.10)}>10%</button>
								<button type="button" className="btn-ghost" onClick={()=>tipFromPct(0.15)}>15%</button>
								<button type="button" className="btn-ghost" onClick={()=>tipFromPct(0.20)}>20%</button>
							</div>

							<div style={{marginTop:'10px'}}>
								<label style={{display:'block',fontWeight:600,marginBottom:'6px',opacity:0.9}}>
									Custom tip ($)
								</label>
								<input
									type="number"
									min="0"
									step="0.01"
									value={tipAmount}
									onChange={e=>setTip(e.target.value)}
								/>
							</div>

							<div style={{display:'flex',justifyContent:'space-between',marginTop:'10px',opacity:0.95}}>
								<span>Tip amount</span>
								<span>${(Number(tipAmount)||0).toFixed(2)}</span>
							</div>
						</div>

						<hr style={{margin:'12px 0'}}/>

						<div style={{display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:'18px'}}>
							<span>Total</span>
							<span>${total.toFixed(2)}</span>
						</div>

						<button type="button" onClick={goCheckout} style={{width:'100%',marginTop:'12px',padding:'10px'}}>
							Checkout
						</button>

						<p style={{fontSize:'13px',opacity:0.8,marginTop:'10px'}}>
							This is session cart only for now (local storage). Orders will be connected next.
						</p>
					</aside>
				</div>
                </div>
			)}
		</div>
	)
}
