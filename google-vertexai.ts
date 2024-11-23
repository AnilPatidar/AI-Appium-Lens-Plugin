const vision = require('@google-cloud/vision');
const {VertexAI} = require('@google-cloud/vertexai');

const path = require('path');
const fs = require('fs');
  

/**
 * TODO(developer): Update these variables before running the sample.
 */
async function createNonStreamingMultipartContent(
  projectId = 'combokart-d8a0e',
  location = 'us-central1',
  model = 'gemini-1.5-flash-001',
  image = 'gs://my11c/login_ios_iphone6s.jpg',
  mimeType = 'image/png'
) {
  // Initialize Vertex with your Cloud project and location
  const vertexAI = new VertexAI({project: projectId, location: location});

  // Instantiate the model
  const generativeVisionModel = vertexAI.getGenerativeModel({
    model: model,
  });

  // For images, the SDK supports both Google Cloud Storage URI and base64 strings
  const filePart = {
    fileData: {
      fileUri: image,
      mimeType: mimeType,
    },
  };

  const textPart1 = {
      text: 'give me button , input field and other text and their x and y cordinates which appium mobile automation can understand and click on cordinates, and tell me what screen shot resolution you considered?',
    };
  
    const request = {
      contents: [{role: 'user', parts: [filePart, textPart1]}],
    };
  
    console.log('Prompt Text:');
    const textPart2 = request.contents[0].parts[1];
  if ('text' in textPart2) {
    console.log(textPart1.text);
  }

  console.log('Non-Streaming Response Text:');

  // Generate a response
  const response = await generativeVisionModel.generateContent(request);

  // Select the text from the response
  const fullTextResponse =
    response.response.candidates[0].content.parts[0].text;

  console.log(fullTextResponse);
}


// Main function
async function main() {

  try {
    const response =await createNonStreamingMultipartContent()
     // const response = await processImageAndQuery(imagePath, query);
      console.log("AI Response:", response);
    } catch (error) {
      console.error("Error processing the image or query:", error);
    } 
  
  }
   

// Run the main function
main();
