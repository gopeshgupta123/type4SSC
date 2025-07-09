import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();

const app = express();
app.use(express.json());

app.use(cors());


app.post('/api/generate-paragraph', async (req, res) => {
  const prompt = req.body.prompt || 
    "Write a realistic, everyday story paragraph of 5 to 10 words that can be used for a typing test. The story should be natural and relatable, like something from daily life. Include a few small spelling or grammar mistakes to make it feel authentic, but keep the text fully understandable.Do not use any special characters that are not commonly used in typical typing practice (such as asterisks, symbols, etc).The output should be a single flowing story paragraph, with no title, heading, or closing remark. Just the story content only.";
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": process.env.API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528-qwen3-8b:free", // or any model you prefer
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    
    const aiText = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";
    //console.log(data.choices+'aaaa');
    res.json({ paragraph: aiText.trim() });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate paragraph" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
// "deepseek/deepseek-r1-0528-qwen3-8b:free"
// "google/gemma-3n-e4b-it:free"



