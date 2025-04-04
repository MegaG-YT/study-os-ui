import { useState } from 'react';

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setResponse('');

    const res = await fetch('/api/study', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword }),
    });

    const data = await res.json();
    setResponse(data.result || 'エラーが発生しました');
    setLoading(false);
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🧠 Study OS – 世界史GPT</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="キーワードを入力"
          style={{ padding: '0.5rem', width: '300px', fontSize: '1rem' }}
        />
        <button
          type="submit"
          style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
        >
          送信
        </button>
      </form>

      <div style={{ marginTop: '2rem', whiteSpace: 'pre-wrap' }}>
        {loading ? '🌀 生成中...' : response}
      </div>
    </div>
  );
}
