import { OpenAI } from 'openai';
import supabase from '../../lib/supabaseClient';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = 'asst_h6oJGmOfMpf8XkDcWb41hcg9';
const threadId = 'thread_kG7PKJW5mbNEY8VBsDt8IrDb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword' });
  }

  try {
    // ✅ 1. Check Supabase cache
    const { data, error } = await supabase
      .from('keyword_cache')
      .select('*')
      .eq('keyword', keyword)
      .limit(1);

    if (error) {
      console.error('Supabase SELECT error:', error);
    }

    if (data && data.length > 0) {
      // ✅ Cached result found
      return res.status(200).json({ result: data[0].response });
    }

    // ⚙️ 2. No cache hit → ask Assistant
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: keyword,
    });

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    let runStatus;
    while (true) {
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      if (runStatus.status === 'completed') break;
      if (runStatus.status === 'failed') throw new Error('Run failed');
      await new Promise((r) => setTimeout(r, 1000));
    }

    const messages = await openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0];
    const aiResponse = lastMessage.content[0].text.value;

    // 🧠 3. Save to Supabase
    const insertResult = await supabase.from('keyword_cache').insert([
      {
        keyword: keyword,
        response: aiResponse,
      },
    ]);

    if (insertResult.error) {
      console.error('Supabase INSERT error:', insertResult.error);
    }

    res.status(200).json({ result: aiResponse });
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
