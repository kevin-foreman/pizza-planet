import express from "express"
import { getAllToppings, createTopping, updateTopping, deleteTopping } from "../controllers/toppingController.js"
import { uploadTopping } from "../middleware/uploadTopping.js"

const router = express.Router()

router.get("/", getAllToppings)
router.post("/", uploadTopping.single("image"), createTopping)
router.patch("/:id", updateTopping)
router.delete("/:id", deleteTopping)

export default router
