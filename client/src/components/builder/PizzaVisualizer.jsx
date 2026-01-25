import {useMemo} from "react"

export default function PizzaVisualizer({crustId="",crustImg="",sauceImg="",toppingImgs=[],size=160}){
	const seed=useMemo(()=>Math.floor(Math.random()*9999999),[])
	function mulberry32(a){
		return function(){
			let t=a+=0x6D2B79F5
			t=Math.imul(t^t>>>15,t|1)
			t^=t+Math.imul(t^t>>>7,t|61)
			return((t^t>>>14)>>>0)/4294967296
		}
	}
	const pieces=useMemo(()=>{
		const rng=mulberry32(seed)
		const nodes=[]
		for(let i=0;i<(toppingImgs||[]).length;i++){
			const img=toppingImgs[i]
			for(let k=0;k<18;k++){
				const a=rng()*Math.PI*2
				const r=Math.sqrt(rng())*0.9
				const x=Math.cos(a)*r
				const y=Math.sin(a)*r
				nodes.push(
					<img
						key={`${i}-${k}`}
						className="topping-piece"
						src={img}
						alt=""
						style={{
							left:`calc(50% + ${x*37.5}%)`,
							top:`calc(50% + ${y*37.5}%)`,
							width:"12%",
							height:"12%",
							transform:`translate(-50%,-50%)rotate(${(rng()*2-1)*35}deg)scale(${0.92+rng()*0.22})`,
						}}
					/>
				)
			}
		}
		return nodes
	},[toppingImgs,seed])

	return (
		<div className="pizza-stage" style={{width:size,height:size}}>
			<div className={`pizza-visualizer crust-${crustId}`}>
				{!!crustImg&&<img className="pizza-layer base" src={crustImg} alt=""/>}
				{!!sauceImg&&<img className="pizza-layer sauce" src={sauceImg} alt=""/>}
				{pieces}
			</div>
		</div>
	)
}
