import { initializeApp } from 'firebase/app';
import { FIREBASE_API_KEY, FIREBASE_APP_ID, FIREBASE_AUTH_DOMAIN, FIREBASE_MEASUREMENT_ID, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET } from '../config'
import { getStorage, ref, deleteObject, uploadBytesResumable } from "firebase/storage";
import discord from './discord';
import fs from 'fs';

const firebaseConfig = {
    apiKey: `${FIREBASE_API_KEY}`,
    authDomain: `${FIREBASE_AUTH_DOMAIN}`,
    projectId: `${FIREBASE_PROJECT_ID}`,
    storageBucket: `${FIREBASE_STORAGE_BUCKET}`,
    messagingSenderId: `${FIREBASE_MESSAGING_SENDER_ID}`,
    appId: `${FIREBASE_APP_ID}`,
    measurementId: `${FIREBASE_MEASUREMENT_ID}`
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const firebaseServices = {
    DeleteFileInFirebase(imgName) {
        // Creating a reference to the file to delete
        const desertRef = ref(storage, `SOD/${imgName}`);
        // Deleting the file
        deleteObject(desertRef).then(() => {
            console.log("successfully deleted")
            return true;
        }).catch((error) => {
            discord.SendErrorMessageToDiscord(imgName, "Firebase service", error + " and error in deleting files in firebase !!");
            console.log(error)
            return false
        });
    },

    uploadImage(path, imageName) {

        // const imageName = `${new Date().getTime()}${image.name}`;
        const filePath = `${appRoot}/public/uploads/${imageName}`;
        console.log(filePath)
        let storageRef, uploadTask;
        const uploadStatus = new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, image) => {
                console.log(image)
                if (err) {
                    console.log(err)
                }
                storageRef = ref(storage, `${path}/${image}`);
                // const storageRef = ref(storage, `${path}/${new Date().getTime()}${imageName}`);
                uploadTask = uploadBytesResumable(storageRef, image);

                uploadTask.on(
                    "state_changed",
                    (snapshot) => { },
                    (error) => {
                        const data = {
                            error: error,
                            status: false,
                            url: false
                        }
                        resolve(data);
                    },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
                            // console.log(url);
                            const data = {
                                error: false,
                                status: true,
                                url: url
                            }
                            resolve(data);
                        })
                    }
                );
            });
        })

        return uploadStatus;
    }

}

export default firebaseServices;