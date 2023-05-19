import { User } from "../../models";
import CustomErrorHandler from "../../Services/CustomerrorHandler";
import bcrypt from 'bcrypt';
import Joi from 'joi';
import firebaseServices from "../../Services/firebaseConfig";
import uploadMultiple from "../../middleware/formDataHandler";
import fs from 'fs';
import discord from "../../Services/discord";


const userController = {
    async getUsersOne(req, res, next) {

        let document;
        try {
            document = await User.findOne({ _id: req.params.id }).select('-updatedAt -__v -createdAt -password -_id');
        } catch (err) {
            discord.SendErrorMessageToDiscord(req.params.id, "Get one user", err);
            return next(CustomErrorHandler.serverError());
        }
        res.json(document);
    },

    async update(req, res, next) {
        console.log(req)
        uploadMultiple(req, res, async (err) => {
            // validation
            if (err) {
                DeleteOsFiles(req);
                return next(CustomErrorHandler.serverError(err.message))
            }
            // console.log(req.files)
            console.log(req.body)

            let aadhaarImage, panImage, salarySlipImage;

            const updateSchema = Joi.object({
                userName: Joi.string().min(3).max(100).required(),
                gender: Joi.string().required(),
                age: Joi.string().required(),
                email: Joi.string().email().required(),
                password: Joi.string().min(8).max(50).required(),
                profileImageLink: Joi.string().required(),

                aadhaarNumber: Joi.string().min(12).max(12).required(),
                panNumber: Joi.string().min(10).max(10).required(),
                ctc: Joi.string().required(),

                aadhaarImage: Joi.string(),
                panImage: Joi.string(),
                salarySlipImage: Joi.string(),

                accountHolderName: Joi.string().required(),
                accountNumber: Joi.string().required(),
                IFACcode: Joi.string().required(),
                BankName: Joi.string().required(),

            });

            const data = await firebaseServices.uploadImage("AADHAAR", req.body.panImage);

            const { error } = updateSchema.validate(req.body);
            if (error) {
                DeleteOsFiles(req);
                return next(error);
            }

            try {
                const user = await User.findOne({ email: req.body.email });
                if (!user) {
                    DeleteOsFiles(req);
                    discord.SendErrorMessageToDiscord(req.body.email, "Update User", "error user not exist in database !");
                    return next(CustomErrorHandler.wrongCredentials());
                }

                //password varification
                const match = await bcrypt.compare(req.body.password, user.password);
                if (!match) {
                    DeleteOsFiles(req);
                    return next(CustomErrorHandler.wrongCredentials());
                }
                const { userName, age, gender, email, aadhaarNumber, panNumber, ctc, profileImageLink, accountHolderName, accountNumber, IFACcode, BankName } = req.body;

                let cibilScore = calculateCIBIL(ctc);
                let document;
                // ctc in - ve not possible 
                if (ctc < 0) {
                    DeleteOsFiles(req);
                    return next(CustomErrorHandler.badRequest())
                }

                //uploading files
                let aadhaarImageLink = "", panImageLink = "", salarySlipImageLink = "";
                if (req.files.aadhaarImage) {
                    aadhaarImage = req.files.aadhaarImage;
                }
                else {
                    aadhaarImage = req.body.aadhaarImage;
                }
                if (req.files.panImage) {
                    panImage = req.files.panImage;
                }
                else {
                    panImage = req.body.panImage;
                }
                if (req.files.salarySlipImage) {
                    salarySlipImage = req.files.salarySlipImage;
                }
                else {
                    salarySlipImage = req.body.salarySlipImage;
                }
                
                //aadhaar image
                // console.log(aadhaarImage)
                if (aadhaarImage) {
                    const path = "AADHAAR";
                    // const imagePath = aadhaarImage[0].destination + "/"+;
                    // console.log(imagePath)
                    const data = await firebaseServices.uploadImage(path, aadhaarImage[0].filename);
                    if (data.status === false) {
                        DeleteOsFile(aadhaarImage[0].filename)
                        discord.SendErrorMessageToDiscord(req.body.email, "Update User", data.error);
                    }
                    else {
                        aadhaarImageLink = data.url;
                    }
                    console.log(data)
                }
                //pan image
                if (panImage) {
                    const path = "PAN";
                    const data = await firebaseServices.uploadImage(path, panImage);
                    if (data.status === false) {
                        DeleteOsFile(panImage[0].filename)
                        discord.SendErrorMessageToDiscord(req.body.email, "Update User", data.error);
                    }
                    else {
                        panImageLink = data.url;
                    }
                }
                //salarySlip image
                if (salarySlipImage) {
                    const path = "SALARYSLIP";
                    const data = await firebaseServices.uploadImage(path, salarySlipImage);
                    if (data.status === false) {
                        DeleteOsFile(salarySlipImage[0].filename)
                        discord.SendErrorMessageToDiscord(req.body.email, "Update User", data.error);
                    }
                    else {
                        salarySlipImageLink = data.url;
                    }
                }

                document = await User.findOneAndUpdate({ _id: req.params.id }, {
                    userName,
                    age,
                    gender,
                    email,
                    profileImageLink,

                    aadhaarNumber,
                    panNumber,
                    ctc,
                    cibilScore,

                    aadhaarImageLink,
                    panImageLink,
                    salarySlipImageLink,

                    accountHolderName,
                    accountNumber,
                    IFACcode,
                    BankName,

                }).select('-updatedAt -__v -createdAt');
                // console.log(document);
                // document have old data so we can delete the old file

                // Delete the uploaded old file

                if (document.aadhaarImageLink != aadhaarImageLink) {
                    DeleteOsFile(aadhaarImage[0].filename)
                    DeleteOneFile(document.aadhaarImageLink)
                }
                if (document.panImageLink != panImageLink) {
                    DeleteOsFile(panImage[0].filename)
                    DeleteOneFile(document.profileImageLink)
                }
                if (document.salarySlipImageLink != salarySlipImageLink) {
                    DeleteOsFile(salarySlipImage[0].filename)
                    DeleteOneFile(document.salarySlipImageLink)
                }

            } catch (err) {
                console.log(err)
                DeleteOsFiles(req);
                discord.SendErrorMessageToDiscord(req.body.email, "Update User", err);
                return next(CustomErrorHandler.alreadyExist('This email is not registered please contact to technical team '));
            }

            res.status(200).json({ msg: "Updated Successfully", });
        });
    }

}

export default userController;

const DeleteOsFiles = (req) => {
    if (req.files.aadhaarImage) {
        DeleteOsFile(req.files.aadhaarImage[0].filename)
    }
    if (req.files.panImage) {
        DeleteOsFile(req.files.panImage[0].filename)
    }
    if (req.files.salarySlipImage) {
        DeleteOsFile(req.files.salarySlipImage[0].filename)
    }
}


const DeleteOsFile = (fileName) => {
    const filePath = `${appRoot}/public/uploads/${fileName}`;
    // console.log(filePath)
    fs.unlink(filePath, (err) => {
        if (err) {
            discord.SendErrorMessageToDiscord(fileName, "User Controller", "error in deleting file in system !!" + err);
        }
    });
}

const DeleteOneFile = (imgName) => {
    let ok = firebaseServices.DeleteFileInFirebase(imgName)
    if (!ok) {
        discord.SendErrorMessageToDiscord(imgName, "User Controller", "error in deleting file in firebase !!");
        console.log("failed to deleting file")
    }
    else {
        discord.SendErrorMessageToDiscord(imgName, "User Controller", "file deleted successfully");
        console.log("old file deleted on firebase successfully")
    }
    console.log("successfully deleted old file")
}

// const parseImage = (req, image) => {
//     let imageFile;
//     if (req.files.image) {
//         imageFile = req.files.image;
//     }
//     else {
//         imageFile = req.body.image;
//     }
// }

const calculateCIBIL = (ctc) => {
    const lac = 100000;
    const cr = 10000000;
    if (0 <= ctc && ctc < 1 * lac) {
        return 300;
    }
    else if (1 * lac <= ctc && ctc < 5 * lac) {
        return 350;
    }
    else if (5 * lac <= ctc && ctc < 10 * lac) {
        return 400;
    }
    else if (10 * lac <= ctc && ctc < 20 * lac) {
        return 440;
    }
    else if (20 * lac <= ctc && ctc < 40 * lac) {
        return 480;
    }
    else if (40 * lac <= ctc && ctc < 60 * lac) {
        return 520;
    }
    else if (60 * lac <= ctc && ctc < 80 * lac) {
        return 560;
    }
    else if (80 * lac <= ctc && ctc < 1 * cr) {
        return 600;
    }
    else if (1 * cr <= ctc && ctc < 10 * cr) {
        return 620;
    }
    else if (10 * cr <= ctc && ctc < 20 * cr) {
        return 650;
    }
    else if (20 * cr <= ctc && ctc < 50 * cr) {
        return 675;
    }
    else if (50 * cr <= ctc) {
        return 700;
    }
    return 0;
};
