import asyncHandler from'../utils/asyncHandler.js'
import Topping from'../models/Topping.js'
import Pizza from'../models/Pizza.js'
import Salad from'../models/Salad.js'
import Calzone from'../models/Calzone.js'

export const getMenu=asyncHandler(async(req,res)=>{
	const[toppings,pizzas,salads,calzones]=await Promise.all([
		Topping.find({}).sort({name:1}).lean(),
		Pizza.find({}).sort({name:1}).lean(),
		Salad.find({}).sort({name:1}).lean(),
		Calzone.find({}).sort({name:1}).lean(),
	])

	res.json({
		toppings,
		entrees:[
			...pizzas.map(x=>({...x,entreeType:'pizza'})),
			...salads.map(x=>({...x,entreeType:'salad'})),
			...calzones.map(x=>({...x,entreeType:'calzone'})),
		],
	})
})
