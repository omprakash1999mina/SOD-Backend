import multer from "multer";
import path from 'path';

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads");
    },
    filename: async function (req, file, cb) {
        // console.log(file)
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});


var upload = multer({ storage: storage, limits: { fileSize: 1000000 * 2 } }); // 2mb
var uploadMultiple = upload.fields([{ name: 'aadhaarImage', maxCount: 1 }, { name: 'panImage', maxCount: 1 }, { name: 'salarySlipImage', maxCount: 1 }])

export default uploadMultiple