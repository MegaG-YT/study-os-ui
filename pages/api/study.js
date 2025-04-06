import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = 'asst_h6oJGmOfMpf8XkDcWb41hcg9';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword' });
  }

  try {
    // 🔁 1. Create a fresh thread for this request
    const thread = await openai.beta.threads.create();

    // ✉️ 2. Add user message to that thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: keyword,
    });

    // 🧠 3. Run the assistant on that thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // ⏳ 4. Poll until completion
    let runStatus;
    while (true) {
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (runStatus.status === 'completed') break;
      if (runStatus.status === 'failed') throw new Error('Run failed');
      await new Promise((r) => setTimeout(r, 1000));
    }

    // 📬 5. Retrieve the final message
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];

    // (Optional) Clean up thread afterwards
    await openai.beta.threads.del(thread.id);

    // ✅ 6. Send result to client
    res.status(200).json({ result: lastMessage.content[0].text.value });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
