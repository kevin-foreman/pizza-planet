import multer from "multer"
import path from "path"
import fs from "fs"

const uploadPath = path.join(process.cwd(), "src/uploads/toppings")

fs.mkdirSync(uploadPath, { recursive: true })

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadPath)
    },
    filename(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase()
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        cb(null, name + ext)
    },
})

export const uploadTopping = multer({
    storage,
    limits: {
        fileSize: 1 * 1024 * 1024, //  2MB limit
    },
    fileFilter(req, file, cb) {
        //  WebP only
        if (file.mimetype !== "image/webp") {
            cb(new Error("Only WebP images are allowed!"))
        } else {
            cb(null, true)
        }
    },
})
