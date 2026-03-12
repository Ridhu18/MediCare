import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const { messages, file } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API key is not configured in the environment variables.' },
                { status: 500 }
            );
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: "You are an AI Health Assistant for a patient dashboard. You provide basic health information, first aid guidance, and symptom information. You can also analyze uploaded documents or images provided by the user. You MUST ALWAYS include a disclaimer that you are not a substitute for professional medical advice. For any emergencies, severe symptoms, explicitly and boldly advise the user to call emergency services (108) immediately. Keep your responses concise, structured, and easy to read using markdown formatting.",
        });

        // Format the conversation history for Gemini API
        const history = messages.slice(0, -1).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        // Gemini API requires the first message in history to be from the user
        while (history.length > 0 && history[0].role === 'model') {
            history.shift();
        }

        const currentMessage = messages[messages.length - 1].content;

        const chat = model.startChat({
            history: history,
        });

        let msgPayload: any = currentMessage;

        if (file) {
            msgPayload = [
                { text: currentMessage },
                {
                    inlineData: {
                        data: file.data,
                        mimeType: file.mimeType
                    }
                }
            ];
        }

        const result = await chat.sendMessage(msgPayload);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ response: text });
    } catch (error) {
        console.error('Error in AI chat endpoint:', error);
        return NextResponse.json(
            { error: 'Failed to generate AI response' },
            { status: 500 }
        );
    }
}
