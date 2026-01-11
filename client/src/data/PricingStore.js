const KEY='pizzaPlanet.pricing.v1'

const DEFAULT_PRICING={
	toppings:{
		pep:1.25,
		msh:0.85,
		olv:0.85,
		on:0.65,
		gp:0.75,
		ham:1.35,
	},
	entrees:{
		pizzaBase:10.99,
		saladBase:8.99,
		calzoneBase:9.99,
	},
}

export function loadPricing(){
	try{
		const raw=localStorage.getItem(KEY)
		if(!raw)return structuredClone(DEFAULT_PRICING)
		const parsed=JSON.parse(raw)
		return{
			toppings:{...DEFAULT_PRICING.toppings,...(parsed.toppings||{})},
			entrees:{...DEFAULT_PRICING.entrees,...(parsed.entrees||{})},
		}
	}catch(e){
		return structuredClone(DEFAULT_PRICING)
	}
}

export function savePricing(pricing){
	localStorage.setItem(KEY,JSON.stringify(pricing))
}

export function resetPricing(){
	localStorage.removeItem(KEY)
	return structuredClone(DEFAULT_PRICING)
}
