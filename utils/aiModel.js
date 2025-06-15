import axios from 'axios';
import { config } from '../config/config.js';

// Configure the external AI model API endpoint
const AI_MODEL_API_URL = "http://0.0.0.0:8000/Trustness/"
const AI_MODEL_API_KEY = process.env.AI_MODEL_API_KEY || 'api-key';

export const fetchBotResponse = async (userMessage) => {
  try {
    const response = await axios.post(
      AI_MODEL_API_URL,
      { inpt_str: userMessage },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Assuming the API returns a response in the format { answer: "Bot's response" }
    return response.data.trusted_text || 'Sorry, I could not process your request.';
    // return 'Sorry, I could not process your request.';
  } catch (error) {
    console.error('Error fetching bot response:', error.message);
    return 'Sorry, there was an error processing your request.';
  }
};