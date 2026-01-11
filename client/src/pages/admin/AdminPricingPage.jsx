import React,{useEffect,useMemo,useState}from'react'
import{Link}from'react-router-dom'
import{loadPricing,savePricing,resetPricing}from'../../data/PricingStore.js'

export default function AdminPricingPage(){
	const toppingMeta=useMemo(()=>[
		{id:'pep',label:'Pepperoni'},
		{id:'msh',label:'Mushrooms'},
		{id:'olv',label:'Olives'},
		{id:'on',label:'Onions'},
		{id:'gp',label:'Green Peppers'},
		{id:'ham',label:'Ham'},
	],[])

	const entreeMeta=useMemo(()=>[
		{id:'pizzaBase',label:'Pizza Base'},
		{id:'saladBase',label:'Salad Base'},
		{id:'calzoneBase',label:'Calzone Base'},
	],[])

	const[pricing,setPricing]=useState(()=>loadPricing())
	const[savedMsg,setSavedMsg]=useState('')

	useEffect(()=>{
		if(!savedMsg)return
		const t=setTimeout(()=>setSavedMsg(''),1500)
		return()=>clearTimeout(t)
	},[savedMsg])

	function setTopping(id,value){
		setPricing(prev=>({
			...prev,
			toppings:{
				...prev.toppings,
				[id]:value,
			},
		}))
	}

	function setEntree(id,value){
		setPricing(prev=>({
			...prev,
			entrees:{
				...prev.entrees,
				[id]:value,
			},
		}))
	}

	function onSave(){
		savePricing(pricing)
		setSavedMsg('Saved.')
	}

	function onReset(){
		const fresh=resetPricing()
		setPricing(fresh)
		setSavedMsg('Reset.')
	}

	return(
		<div className="container">
			<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
				<h1 style={{margin:0}}>Admin Pricing</h1>
				<div style={{display:'flex',gap:'10px'}}>
					<Link to="/">Home</Link>
					<Link to="/menu">Menu</Link>
				</div>
			</div>

			<p style={{opacity:0.85,marginTop:0}}>
				Update topping and entree prices.
			</p>

			<section style={{border:'1px solid #3a3a3a',borderRadius:'12px',padding:'16px',background:'rgba(255,255,255,0.03)'}}>
				<h2 style={{marginTop:0}}>Toppings</h2>

				<div style={{display:'grid',gap:'10px'}}>
					{toppingMeta.map(t=>(
						<div key={t.id} style={{display:'grid',gridTemplateColumns:'1fr 140px',gap:'12px',alignItems:'center'}}>
							<div style={{fontWeight:600}}>{t.label}</div>
							<input
								type="number"
								step="0.01"
								min="0"
								value={pricing.toppings?.[t.id]??0}
								onChange={e=>setTopping(t.id,Number(e.target.value))}
							/>
						</div>
					))}
				</div>

				<hr style={{margin:'16px 0'}}/>

				<h2 style={{marginTop:0}}>Entrees</h2>

				<div style={{display:'grid',gap:'10px'}}>
					{entreeMeta.map(e=>(
						<div key={e.id} style={{display:'grid',gridTemplateColumns:'1fr 140px',gap:'12px',alignItems:'center'}}>
							<div style={{fontWeight:600}}>{e.label}</div>
							<input
								type="number"
								step="0.01"
								min="0"
								value={pricing.entrees?.[e.id]??0}
								onChange={ev=>setEntree(e.id,Number(ev.target.value))}
							/>
						</div>
					))}
				</div>

				<div style={{display:'flex',gap:'10px',marginTop:'16px',alignItems:'center'}}>
					<button type="button" onClick={onSave}>Save</button>
					<button type="button" onClick={onReset}>Reset to Default</button>
					{savedMsg?<span style={{opacity:0.85}}>{savedMsg}</span>:null}
				</div>
			</section>
		</div>
	)
}
