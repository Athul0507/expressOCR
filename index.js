const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyDMB3rPWTxiRjWuuBH8AQtdavo1zEmA0gE");

const express = require('express');
const cors = require('cors')
const Tesseract = require('tesseract.js');
const multer = require('multer');

const app = express();
app.use(cors())
const PORT = process.env.PORT || 3000;

// Configure multer to store uploaded files
const upload = multer({ dest: 'uploads/' });

// API endpoint for text extraction from uploaded image
app.post('/extract-text', upload.single('image'), async (req, res) => {
    try {
        const imagePath = req.file.path;

        const { data: { text } } = await Tesseract.recognize(
            imagePath,
            'eng', // language
            { logger: m => m='' } // optional logger
        );

        const response = await findMedicineInfo(text);
        res.json({ response });
    } catch (error) {
        console.error('Error extracting text:', error);
        res.status(500).json({ error: 'Failed to extract text from the image' });
    }
});


async function findMedicineInfo(name){
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});

    const prompt = `You are a medicine phasrmacy expert. ${name} is the medicine i want information about. Give me the information in this format .
    {
        "name": "MedicineName",
        "usage": "What the medicine is used for",
        "dosage": {
          "amount": "Dosage amount",
          "unit": "Dosage unit (e.g., mg, mL)"
        },
        "avoid": "When the medicine should be avoided (e.g., contraindications)"
      }
      
    for avoid, include other unfavourable reactions with other medicines, possible allergies, lifestyles and other information, but use only keywords not sentences
    
    `

    const result = await model.generateContent(prompt);
    const response = await result.response;

    console.log(response.text())
    return response.text();


}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


