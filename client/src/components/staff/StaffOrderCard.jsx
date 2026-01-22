import React,{useMemo,useState}from"react"

function ConfirmModal({open,title,text,confirmLabel="Confirm",cancelLabel="Cancel",onConfirm,onCancel}){
	if(!open)return null
	return(
		<div className="modal-overlay" role="dialog" aria-modal="true">
			<div className="modal-card">
				<div className="modal-title">{title}</div>
				<div className="modal-text">{text}</div>
				<div className="modal-actions">
					<button type="button" onClick={onCancel}>{cancelLabel}</button>
					<button type="button" onClick={onConfirm}>{confirmLabel}</button>
				</div>
			</div>
		</div>
	)
}

function uiStatus(s){
	if(s==="pending")return"RECEIVED"
	if(s==="in_progress")return"IN_PROGRESS"
	if(s==="completed")return"READY"
	if(s==="cancelled")return"CANCELLED"
	return String(s||"")
}

function flattenToppings(order){
	const out=[]
	for(const it of(order.items||[])){
		const tops=
			(Array.isArray(it?.display?.toppings)&&it.display.toppings)||
			(Array.isArray(it?.toppings)&&it.toppings)||
			(Array.isArray(it?.config?.toppings)&&it.config.toppings)||
			[]
		for(const t of tops){
			out.push({label:String(t),source:it.type||it.name||"Item"})
		}
	}
	return out
}

export default function StaffOrderCard({order,onPatch}){
	if(!order)return null

	const toppings=useMemo(()=>flattenToppings(order),[order])
	const k=order.kitchen||{}
	const toppingIndex=Number.isFinite(k.toppingIndex)?k.toppingIndex:0
	const toppingDone=Array.isArray(k.toppingDone)?k.toppingDone:[]
	const next=toppings[toppingIndex]||null
	const allDone=toppings.length===0?true:toppingIndex>=toppings.length

	const [confirm,setConfirm]=useState({open:false,kind:"",title:"",text:""})

	function openConfirm(kind,title,text){setConfirm({open:true,kind,title,text})}
	function closeConfirm(){setConfirm(s=>({...s,open:false}))}

	async function patch(patchObj){
		if(typeof onPatch==="function")return await onPatch(order._id,patchObj)
	}

	function canStart(){return order.status==="pending"}
	function canCancel(){return order.status==="in_progress"||order.status==="pending"}
	function canRestart(){return order.status==="cancelled"}
	function canConfirmTopping(){return order.status==="in_progress"&&!allDone&&!!next}
	function canMarkReady(){return order.status==="in_progress"&&allDone}

	function onStartClick(){
		openConfirm("start","Start this order?","Once started, you cannot unstart it. You can cancel and restart if needed.")
	}
	function onCancelClick(){
		openConfirm("cancel","Cancel this order?","This will stop the current run. You can restart the order after cancelling.")
	}
	function onRestartClick(){
		openConfirm("restart","Restart this order?","This resets topping progress back to the beginning.")
	}
	function onConfirmToppingClick(){
		if(!next)return
		openConfirm("topping",`Confirm topping: ${next.label}`,"Confirm this topping is ON the item.")
	}
	function onMarkReady(){
		openConfirm("ready","Mark order READY?","This should only be done after all toppings are confirmed.")
	}

	async function handleConfirm(){
		const kind=confirm.kind
		closeConfirm()

		if(kind==="start"){
			await patch({
				status:"in_progress",
				kitchen:{
					startedAt:new Date().toISOString(),
					toppingIndex:0,
					toppingDone:[],
					restartCount:k.restartCount||0
				}
			})
			return
		}

		if(kind==="cancel"){
			await patch({
				status:"cancelled",
				kitchen:{...k}
			})
			return
		}

		if(kind==="restart"){
			await patch({
				status:"in_progress",
				kitchen:{
					startedAt:new Date().toISOString(),
					toppingIndex:0,
					toppingDone:[],
					restartCount:(k.restartCount||0)+1
				}
			})
			return
		}

		if(kind==="topping"){
			const idx=toppingIndex
			const done=Array.isArray(toppingDone)?toppingDone.slice():[]
			done[idx]=true
			await patch({kitchen:{...k,toppingDone:done,toppingIndex:idx+1}})
			return
		}

		if(kind==="ready"){
			await patch({
				status:"completed",
				kitchen:{...k}
			})
			return
		}
	}

	const pill=uiStatus(order.status)

	return(
		<div className="order-card">
			<div className="order-top">
				<div>
					<div className="order-id">{order.number||order._id}</div>
					<div className="order-meta">
						<span>{order.customerName||"Guest"}</span>
						<span className="dot">•</span>
						<span>{order.timeLabel||""}</span>
						<span className="dot">•</span>
						<span className={`pill pill-${pill}`}>{pill}</span>
					</div>
				</div>
				<div className="order-total">${Number(order.total||0).toFixed(2)}</div>
			</div>

			<div className="order-items">
				{(order.items||[]).map((it,i)=>(
					<div className="order-item" key={i}>
						<div className="order-item-type">{it.type||it.name||"Item"}</div>
						<div className="order-item-desc">
							{it?.display?.size?`${it.display.size}, `:""}
							{it?.display?.crust?`${it.display.crust}, `:""}
							{it?.display?.sauce?`${it.display.sauce}`:""}
							{Array.isArray(it?.display?.toppings)&&it.display.toppings.length>0?`, ${it.display.toppings.join(", ")}`:""}
						</div>
					</div>
				))}
			</div>

			{order.notes?(<div className="order-notes">Notes: {order.notes}</div>):null}

			<div className="order-notes" style={{marginTop:12}}>
				<div style={{fontWeight:900,marginBottom:8}}>Topping Progress</div>

				{toppings.length===0?(<div>No toppings to confirm.</div>):(
					<>
						<div style={{marginBottom:10}}>
							<div style={{fontWeight:800}}>
								Next: {next?`${next.label} (${next.source})`:"All done"}
							</div>
							<div style={{opacity:.85}}>
								{Math.min(toppingIndex,toppings.length)}/{toppings.length} confirmed
							</div>
						</div>

						<div className="order-items">
							{toppings.map((t,idx)=>(
								<div className="order-item" key={idx}>
									<div className="order-item-type">{t.source}</div>
									<div className="order-item-desc">
										{toppingDone[idx]?"✅ ":"⬜ "}{t.label}{idx===toppingIndex&&!toppingDone[idx]?" (NEXT)":""}
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>

			<div className="order-actions">
				<div className="order-actions-left">
					<button type="button" className="btn btn-primary" disabled={!canStart()} onClick={onStartClick}>Start Order</button>
					<button type="button" className="btn btn-danger" disabled={!canCancel()} onClick={onCancelClick}>Cancel</button>
					<button type="button" className="btn btn-ghost" disabled={!canRestart()} onClick={onRestartClick}>Restart</button>
				</div>

				<div className="order-actions-right">
					<button type="button" className="btn btn-success" disabled={!canConfirmTopping()} onClick={onConfirmToppingClick}>Confirm Next Topping</button>
					<button type="button" className="btn btn-primary" disabled={!canMarkReady()} onClick={onMarkReady}>Mark Ready</button>
				</div>
			</div>

			<ConfirmModal open={confirm.open} title={confirm.title} text={confirm.text} onCancel={closeConfirm} onConfirm={handleConfirm}/>
		</div>
	)
}
