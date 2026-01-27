import mongoose from"mongoose"

const{Schema,model}=mongoose

const orderItemSchema=new Schema({
	type:{type:String,default:"item"},
	name:{type:String,required:true},
	qty:{type:Number,default:1},
	unitPrice:{type:Number,default:0},
	display:{type:Schema.Types.Mixed,default:null},
	config:{type:Schema.Types.Mixed,default:null},
	notes:{type:String,default:""},
},{_id:false})

const kitchenItemSchema=new Schema({
	startedAt:{type:Date,default:null},
	startedBy:{type:Schema.Types.ObjectId,ref:"User",default:null},
	restartCount:{type:Number,default:0},
	toppingIndex:{type:Number,default:0},
	toppingDone:{type:[Boolean],default:[]},
	lastBackAtIndex:{type:Number,default:-1},
	ovenConfirmedAt:{type:Date,default:null},
	cookedConfirmedAt:{type:Date,default:null},
	backUsed:{type:Boolean,default:false},
	doneAt:{type:Date,default:null},
	canceledAt:{type:Date,default:null},
	canceledBy:{type:Schema.Types.ObjectId,ref:"User",default:null},
},{_id:false})

const archivedOrderSchema=new Schema({
	customerName:{type:String,default:"Guest"},
	notes:{type:String,default:""},
	userId:{type:Schema.Types.ObjectId,ref:"User",default:null,index:true},

	size:{type:String},
	crust:{type:String},
	sauce:{type:String},

	items:{type:[orderItemSchema],default:[]},

	subtotal:{type:Number,required:true},
	tip:{type:Number,default:0},
	tax:{type:Number,default:0},
	total:{type:Number,required:true},

	status:{
		type:String,
		enum:["pending","in_progress","completed","canceled"],
		default:"pending",
	},

	archivedAt:{type:Date,default:null},
	archivedBy:{type:Schema.Types.ObjectId,ref:"User",default:null},

	kitchen:{
		items:{type:[kitchenItemSchema],default:[]},
	},

	originalOrderId:{type:String,default:"",index:true},
},{timestamps:true})

export default model("ArchivedOrder",archivedOrderSchema,"archived_orders")
