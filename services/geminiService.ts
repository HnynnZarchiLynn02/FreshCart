
import { GoogleGenAI, Type } from "@google/genai";
import { GroceryItem, Category } from "../types";

export const getSmartSuggestions = async (currentItems: GroceryItem[]): Promise<{ name: string; category: Category }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const itemNames = currentItems.map(i => i.name).join(", ");
  
  const prompt = `Based on these grocery items: [${itemNames}], suggest 5 more items that would complement them or are commonly forgotten essentials. Categorize each suggested item.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { 
                type: Type.STRING,
                description: "One of: Produce, Dairy, Meat, Bakery, Frozen, Pantry, Snacks, Beverages, Household, Other"
              },
            },
            required: ["name", "category"],
          }
        }
      }
    });

    const suggestions = JSON.parse(response.text || "[]");
    return suggestions;
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};

export const autoCategorize = async (itemName: string): Promise<Category> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-lite-latest',
            contents: `What grocery category does "${itemName}" belong to? Reply with ONLY the category name from this list: Produce, Dairy, Meat, Bakery, Frozen, Pantry, Snacks, Beverages, Household, Other.`,
        });
        const category = response.text?.trim() as Category;
        return category || "Other";
    } catch {
        return "Other";
    }
};
