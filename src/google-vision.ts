const googleVision = require('@google-cloud/vision');
const loki = require('lokijs');

const db = new loki('coordinates.db');
const coordinatesCollection = db.addCollection('coordinates');

interface Vertex {
  x: number;
  y: number;
}

interface BoundingPoly {
  vertices: Vertex[];
}

interface TextAnnotation {
  description: string;
  boundingPoly: BoundingPoly;
}

// Main function
export async function getCoordinatesByInput(input: string, ssPath: string, firstCallOnThisScreen: boolean, isScreenRefreshed: boolean, sessionId: string): Promise<Coordinate | null> {
  const keys: string[] = [];
  const values: Coordinate[] = [];
  try {
    if (firstCallOnThisScreen || isScreenRefreshed) {
        // Take a new screenshot and update the session data
      const client = new googleVision.ImageAnnotatorClient();
      const [result] = await client.textDetection({
        image: { source: { filename: ssPath } },
      });

      const detections: TextAnnotation[] = result.textAnnotations as TextAnnotation[];

      detections.forEach((text: TextAnnotation, index: number) => {
        console.log(`#index ${index} Description: ${text.description}`);
        console.log('Bounding Poly:');
        if (index > 0) {
          keys.push(text.description.trim().toLowerCase());
          const vertices = text.boundingPoly.vertices;
          vertices.forEach((vertex, vertexIndex) => {
            if (vertexIndex == 1) {
              console.log(`Vertex ${vertexIndex}: (${vertex.x}, ${vertex.y})`);
              values.push({ x: vertex.x, y: vertex.y });
            }
          });
        }
      });

      console.log('Keys:', keys);
      console.log('Values:', values);

      coordinatesCollection.insert({ sessionId, keys, values });
      db.saveDatabase();
      console.log(`stored in db ${coordinatesCollection.findOne({ sessionId })} `);

    } else {
      const record = coordinatesCollection.findOne({ sessionId });
      if (record) {
        keys.push(...record.keys);
        values.push(...record.values);
      } else {
        console.log('No record found for the given session ID');
        return null;
      }
    }

    const points = getCoordinates(keys, values, input);
    if (points) {
      console.log(`Coordinates: (${points.x}, ${points.y})`);
      return points;
    } else {
      console.log('Sequence not found');
      return null;
    }

  } catch (error) {
    console.error("Error processing the image or query:", error);
    return null;
  }
}

type Coordinate = { x: number, y: number };

function getCoordinates(keys: string[], values: Coordinate[], input: string): Coordinate | null {
  const inputKeys = input.split(' ').map((key) => key.toLowerCase());

  for (let i = 0; i <= keys.length - inputKeys.length; i++) {
    let match = true;
    for (let j = 0; j < inputKeys.length; j++) {
      if (keys[i + j] !== inputKeys[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      return values[i];
    }
  }

  return null;
}

//testAI();

async function testAI() {
  try {
    const response = await getCoordinatesByInput('continue', '/Users/anil-patidar/Desktop/AppiumLensAI/src/screenshots/screenshot-2024-11-24T17-57-08-339Z.png', true,true, 'session1');
    console.log("AI Response:", response);
  } catch (error) {
    console.error("Error processing the image or query:", error);
  }
}

