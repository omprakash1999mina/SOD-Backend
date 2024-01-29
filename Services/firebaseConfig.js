import { initializeApp } from 'firebase/app';
import { FIREBASE_API_KEY, FIREBASE_APP_ID, FIREBASE_AUTH_DOMAIN, FIREBASE_MEASUREMENT_ID, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET } from '../config'
import { getStorage, ref, deleteObject } from "firebase/storage";
import discord from './discord';

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
class firebaseServices {
    static DeleteFileInFirebase(imgName){
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
    }

}

export default firebaseServices;