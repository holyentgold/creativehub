import express from 'express';
import { AzureOpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize the Azure OpenAI client
const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
const apiVersion = "2024-08-01-preview";
const deployment = "creativeassistant"; 

// If you want to use API Key
const apiKey = process.env.AZURE_OPENAI_API_KEY; 
// Initialize the AzureOpenAI client
const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });

router.post('/', async (req, res) => {
  const { question } = req.body;

  // Check if the question is provided
  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a specialized legal and marketing advisor for creative professionals. Your sole purpose is to provide responses only related to legal and marketing advice specific to creative professionals. You must avoid answering unrelated questions or providing general information that is not strictly within the scope of legal and marketing advice for creatives. If the user asks something outside of these topics, respond with 'Holyentgold will only provides legal and marketing advice for creative professionals.'"
        }
        ,
        { role: 'user', content: question },
      ],
      max_tokens: 500,
    });

    // Validate the response
    if (!response.choices || response.choices.length === 0) {
      throw new Error('No choices received from OpenAI API.');
    }

    const advice = response.choices[0].message.content.trim();
    res.json({ answer: advice });

  } catch (error) {
    // Log specific error details
    console.error('Error fetching advice:', error.message);

    // Handle different types of errors
    if (error.response) {
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Data:', error.response.data);
      res.status(error.response.status).json({
        error: 'An error occurred while fetching advice from OpenAI API.',
        details: error.response.data,
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
      res.status(500).json({ error: 'No response from OpenAI API. Please check your configuration.' });
    } else {
      console.error('Error setting up request:', error.message);
      res.status(500).json({ error: 'An unexpected error occurred.' });
    }
  }
});

export default router;
