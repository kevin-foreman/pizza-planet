import {useEffect,useMemo,useState} from "react"
import {jsonFetch} from "../../api/http.js"
import {usePricing} from "../../context/PricingContext.jsx"
import PizzaVisualizer from "./PizzaVisualizer.jsx"

export default function PizzaShowcaseMarquee(){
	const [orders,setOrders]=useState([])
	const {pricing,toppings,refreshPricing}=usePricing()

	useEffect(()=>{
		refreshPricing()
		jsonFetch("/api/archived_orders/random?limit=5")
			.then(d=>setOrders(Array.isArray(d)?d:[]))
			.catch(()=>{})
	},[])

	const toppingById=useMemo(()=>{
		const m=new Map()
		for(const t of toppings||[]){
			m.set(String(t.id),t)
		}
		return m
	},[toppings])

	const pizzas=useMemo(()=>{
		const out=[]
		for(const o of orders){
			for(const it of o.items||[]){
				if(it.type!=="pizza")continue

				const sizeId=it?.config?.sizeId
				const crustId=it?.config?.crustId
				const sauceId=it?.config?.sauceId
				const topIds=it?.config?.toppings||[]

				const crustImg=(pricing?.crusts||[]).find(c=>c.id===crustId)?.image||""
				const sauceImg=(pricing?.sauces||[]).find(s=>s.id===sauceId)?.image||""

				const topImgs=[]
				for(const id of topIds){
					const t=toppingById.get(String(id))
					if(t?.image)topImgs.push(t.image)
				}

				out.push({crustId,crustImg,sauceImg,topImgs})
			}
		}
		return [...out,...out]
	},[orders,pricing,toppingById])

	if(!pizzas.length)return null

	return (
		<section className="pizza-showcase">
			<div className="pizza-showcase-track">
				{pizzas.map((p,i)=>(
					<div className="pizza-showcase-card" key={i}>
						<PizzaVisualizer
							crustId={p.crustId}
							crustImg={p.crustImg}
							sauceImg={p.sauceImg}
							toppingImgs={p.topImgs}
							size={160}
						/>
					</div>
				))}
			</div>
		</section>
	)
}
