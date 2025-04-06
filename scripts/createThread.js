import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createThread() {
  const thread = await openai.beta.threads.create();
  console.log("✅ Thread created:", thread.id);
}

createThread().catch((err) => {
  console.error("❌ Failed to create thread:", err);
});
