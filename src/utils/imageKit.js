import Food from "../model/food.model.js"; 
import ImageKit from 'imagekit';
import 'dotenv/config';

export const imageKitConfig = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT 
});

export const deleteFile = async (fileId) => {
    try {
        await imageKitConfig.deleteFile(fileId);
    } catch (err) {
        console.error("Cleanup Error:", err.message);
    }
};

export const uploadFiles = async (file) => {
    try {

        if (!file) throw new Error("No file provided");
        
        const extension = file.originalname.split('.').pop(); 
        const fileName = `reel_${Date.now()}.${extension}`;

        const result = await imageKitConfig.upload({
            file: file.buffer, 
            fileName: fileName,
            folder: "/food-reel" 
        });

        return {
            url: result.url,
            fileId: result.fileId
        };
    } catch (error) {
        console.error("ImageKit Upload Error:", error.message);
        throw error; 
    }
};

// export const Update = async (file) => {
//     try {
//         if (!file) throw new Error("No file provided");

//         const extension = file.originalname.split('.').pop();
//         const fileName = `reel_${Date.now()}.${extension}`;

//         const result = await imageKitConfig.upload({
//             file: file.buffer, 
//             fileName: fileName,
//             folder: "/food-reel" 
//         });

//         return {
//             url: result.url,
//             fileId: result.fileId
//         };
//     } catch (error) {
//         console.error("ImageKit Upload Error:", error.message);
//         throw error; 
//     }
// };