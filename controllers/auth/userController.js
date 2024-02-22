import { User } from "../../models";
import CustomErrorHandler from "../../Services/CustomerrorHandler";
import bcrypt from 'bcrypt';
import Joi from 'joi';

const userController = {
    async getUsersOne(req, res, next) {

        let document;
        try {
            document = await User.findOne({ _id: req.params.id }).select('-updatedAt -__v -createdAt -password -_id');
        } catch (err) {
            Logger.error(req.params.id, "Get one user",err.message);
            discord.SendErrorMessageToDiscord(req.params.id, "Get one user", err);
            return next(CustomErrorHandler.serverError());
        }
        res.json(document);
    },

    async update(req, res, next) {
        // validation

        const updateSchema = Joi.object({
            userName: Joi.string().min(3).max(100).required(),
            gender: Joi.string().required(),
            age: Joi.string().min(18).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).max(50).required(),
            profileImageLink: Joi.string().required(),
        });

        const { error } = updateSchema.validate(req.body);

        // if error in the updation of profile delete the uploaded file 
        if (error) {
            // Delete the uploaded file
            // DeleteFiles(req.body.aadhaarImageLink, req.body.panImageLink, req.body.salarySlipImageLink, req.body.email, error)
            return next(error);
            // rootfolder/uploads/filename.png
        }

        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) {
                discord.SendErrorMessageToDiscord(req.body.email, "Update User", "error user not exist in database !");
                return next(CustomErrorHandler.wrongCredentials());
            }

            //password varification
            const match = await bcrypt.compare(req.body.password, user.password);
            if (!match) {
                // Delete the uploaded file
                // DeleteFiles(req.body.aadhaarImageLink, req.body.panImageLink, req.body.salarySlipImageLink, req.body.email, error)
                return next(CustomErrorHandler.wrongCredentials());
            }
            const { userName, age, gender, email, profileImageLink } = req.body;
            let document;
            document = await User.findOneAndUpdate({ _id: req.params.id }, {
                userName,
                age,
                gender,
                email,
                profileImageLink,
            }).select('-updatedAt -__v -createdAt');
            // console.log(document);
            // document have old data so we can compare it with new 
            // Delete the uploaded old file

            // if (document.profileImageLink != req.body.profileImageLink) {
            //     DeleteOneFile(document.profileImageLink)
            // }

        } catch (err) {
            // Delete the uploaded file
            // DeleteFiles(req.body.aadhaarImageLink, req.body.panImageLink, req.body.salarySlipImageLink, req.body.email, error)
            Logger.error(req.body.email, "Update User" ,err.message);
            discord.SendErrorMessageToDiscord(req.body.email, "Update User", err);
            return next(CustomErrorHandler.alreadyExist('This email is not registered please contact to technical team ! . '));
            // return next( err );
        }

        res.status(200).json({ msg: "Updated Successfully !!!  ", });
    }

}

export default userController;

// const DeleteFiles = (aadhaarImageLink, panImageLink, salarySlipImageLink, email, error) => {
//     let res1 = false;
//     let res2 = false;
//     let res3 = false;

//     res1 = firebaseServices.DeleteFileInFirebase(aadhaarImageLink)
//     res2 = firebaseServices.DeleteFileInFirebase(panImageLink)
//     salarySlipImageLink.forEach(imgLink => {
//         let temp = firebaseServices.DeleteFileInFirebase(imgLink)
//         res3 = res3 * temp;
//     });
//     // implimetation for discord error logs
//     const ok = res1 * res2 * res3;
//     if (!ok) {
//         discord.SendErrorMessageToDiscord(email, "update User", error + " and error in deleting files in firebase !!");
//         console.log("failed to deleting file")
//     }
//     else {
//         discord.SendErrorMessageToDiscord(email, "update User", error + " and All files deleted successfully");
//         console.log("error accurs and all files deleted on firebase successfully")
//     }
// }


// const DeleteOneFile = (imgName) => {
//     let ok = firebaseServices.DeleteFileInFirebase(imgName)
//     if (!ok) {
//         discord.SendErrorMessageToDiscord(imgName, "User Controller", "error in deleting file in firebase !!");
//         console.log("failed to deleting file")
//     }
//     else {
//         discord.SendErrorMessageToDiscord(imgName, "User Controller", "file deleted successfully");
//         console.log("old file deleted on firebase successfully")
//     }
//     console.log("successfully deleted old file")
// }



// const calculateCIBIL = (ctc) => {
//     const lac = 100000;
//     const cr = 10000000;
//     if (0 <= ctc && ctc < 1 * lac) {
//         return 300;
//     }
//     else if (1 * lac <= ctc && ctc < 5 * lac) {
//         return 350;
//     }
//     else if (5 * lac <= ctc && ctc < 10 * lac) {
//         return 400;
//     }
//     else if (10 * lac <= ctc && ctc < 20 * lac) {
//         return 440;
//     }
//     else if (20 * lac <= ctc && ctc < 40 * lac) {
//         return 480;
//     }
//     else if (40 * lac <= ctc && ctc < 60 * lac) {
//         return 520;
//     }
//     else if (60 * lac <= ctc && ctc < 80 * lac) {
//         return 560;
//     }
//     else if (80 * lac <= ctc && ctc < 1 * cr) {
//         return 600;
//     }
//     else if (1 * cr <= ctc && ctc < 10 * cr) {
//         return 620;
//     }
//     else if (10 * cr <= ctc && ctc < 20 * cr) {
//         return 650;
//     }
//     else if (20 * cr <= ctc && ctc < 50 * cr) {
//         return 675;
//     }
//     else if (50 * cr <= ctc) {
//         return 700;
//     }
//     return 0;
// };
