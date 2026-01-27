import express from "express"
import { getAllToppings, createTopping, updateTopping, deleteTopping, redoToppingImage } from "../controllers/toppingController.js"
import { uploadTopping } from "../middleware/uploadTopping.js"

const router = express.Router()

router.get("/", getAllToppings)
router.post("/", uploadTopping.single("image"), createTopping)
router.patch("/:id", updateTopping)
router.post("/:id/image",
    (req, res, next) => { console.log("REDO ROUTE HIT", req.params.id); next() },
    uploadTopping.single("image"),
    redoToppingImage
)
router.delete("/:id", deleteTopping)

export default router
