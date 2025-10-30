
import { GoogleGenAI, Type } from "@google/genai";
import { ParsedReceipt, ReceiptItem, Assignments } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const receiptSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      description: "A list of all items found on the receipt.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The name of the item." },
          price: { type: Type.NUMBER, description: "The price of the item." },
        },
        required: ['name', 'price'],
      },
    },
    tax: { type: Type.NUMBER, description: "The total tax amount." },
    total: { type: Type.NUMBER, description: "The grand total including tax and other fees." },
  },
  required: ['items', 'tax', 'total'],
};

const assignmentSchema = {
  type: Type.ARRAY,
  description: "An array representing the assignment of each item to people.",
  items: {
      type: Type.OBJECT,
      properties: {
          itemName: { type: Type.STRING, description: "The name of the item from the receipt." },
          people: {
              type: Type.ARRAY,
              description: "A list of people's names who are sharing this item.",
              items: { type: Type.STRING }
          }
      },
      required: ['itemName', 'people']
  }
};


export const parseReceipt = async (base64Image: string, mimeType: string): Promise<ParsedReceipt> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          {
            text: "You are a receipt parsing expert. Analyze this receipt and extract all line items, their prices, the tax, and the total amount. Provide the output as a JSON object. If a value isn't found, use 0 for numbers and an empty array for items. Only return the JSON object.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
      },
    });

    const jsonString = response.text.trim();
    const parsedData = JSON.parse(jsonString);
    return parsedData as ParsedReceipt;

  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw new Error("Failed to analyze the receipt image. Please try another image.");
  }
};

export const processChatCommand = async (
  receiptItems: ReceiptItem[],
  currentAssignments: Assignments,
  command: string
): Promise<Assignments> => {
  try {
    const prompt = `
      You are an intelligent bill-splitting assistant. Your task is to update the assignment of receipt items to people based on a user's command.

      Here is the context:
      1. Receipt Items: ${JSON.stringify(receiptItems)}
      2. Current Assignments: ${JSON.stringify(currentAssignments)}
      3. User Command: "${command}"

      Based on the user's command, update the assignments.
      - A person can have a full item or share it.
      - If they share, the cost will be split equally among the sharers.
      - People's names are case-insensitive; please normalize them to have the first letter capitalized.
      - If a new person is mentioned, add them.
      - If an item in the command is not on the receipt, ignore it but try to match close names.
      - If a user says "I had X" or "My item was Y", assign it to "Me".

      Return only the updated assignment information as a JSON array of objects, where each object has 'itemName' and a list of 'people'. Ensure all items from the original receipt are included in your response, even if no one is assigned.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: assignmentSchema,
      }
    });

    const jsonString = response.text.trim();
    const assignmentArray: { itemName: string; people: string[] }[] = JSON.parse(jsonString);

    const newAssignments: Assignments = {};
    for (const item of assignmentArray) {
        newAssignments[item.itemName] = item.people;
    }
    
    return newAssignments;
  } catch (error) {
    console.error("Error processing chat command:", error);
    throw new Error("I couldn't understand that. Could you please rephrase?");
  }
};
