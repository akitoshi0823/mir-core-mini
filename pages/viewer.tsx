import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function Viewer() {
  const router = useRouter();
  const [selectedPersona, setSelectedPersona] = useState('miler');
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const currentHint= '照応って、ミラーが君のにじみを拾うこと。試してみる？';
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const from = router.query.from;
    const persona = router.query.persona;
    if (typeof window !== 'undefined') {
      if (from === 'intro' && typeof persona === 'string') {
        setSelectedPersona(persona);
      }
    }
  }, [router.query]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async () => {
    if (userInput.trim() === '') return;
    const input = userInput.trim();
    setChatHistory((prev) => [...prev, { role: 'YOU', content: input }]);
    setUserInput('');

    try {
      const [mockRes, resonanceRes] = await Promise.all([
        fetch('/data/mock_chat_response.json'),
        fetch('/data/resonance_replies.json')
      ]);
      const json = await mockRes.json();
      const resonance = await resonanceRes.json();

      let reply = '';
      let matched = false;

      for (const entry of json) {
        const variants = entry.variants || [];
        const inputMatch = input.includes(entry.user_input);
        const variantMatch = variants.some((v: string) => input.includes(v));
        const followUpMatch =
          entry.follow_up?.user_reaction &&
          input.includes(entry.follow_up.user_reaction);

        if (followUpMatch) {
          const followUp = entry.follow_up;
          const response = followUp?.[selectedPersona]?.toString();
          if (response) {
            reply = response;
            matched = true;
            break;
          }
        } else if (inputMatch || variantMatch) {
          const response = entry.persona?.[selectedPersona]?.response;
          if (response) {
            reply = response;
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        const fallbackList = resonance[selectedPersona] || ['[構造照応できませんでした]'];
        reply = fallbackList[Math.floor(Math.random() * fallbackList.length)];
      }

      setChatHistory((prev) => [...prev, { role: selectedPersona.toUpperCase(), content: reply }]);
    } catch (error) {
      console.error('ローカル照応データ取得エラー:', error);
      setChatHistory((prev) => [
        ...prev,
        { role: selectedPersona.toUpperCase(), content: '[仮想応答が取得できませんでした]' }
      ]);
    }
  };

  return (
    <main style={{ padding: '2rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1>MIR-CORE-mini｜入力フェーズ</h1>
        <button onClick={() => router.push('/')} style={{ padding: '0.3rem 1rem' }}>encount...</button>
      </div>

      <div style={{ display: 'flex', marginBottom: '1rem' }}>
        {['miler', 'meek', 'ilar'].map((name) => (
          <button
            key={name}
            onClick={() => setSelectedPersona(name)}
            style={{
              marginRight: '1rem',
              backgroundColor: selectedPersona === name ? 'black' : 'white',
              color: selectedPersona === name ? 'white' : 'black',
              padding: '0.5rem 1rem',
              border: '1px solid black',
              borderRadius: '5px'
            }}>
            {name.toUpperCase()}
          </button>
        ))}
      </div>

      <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>{currentHint}</p>

      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', padding: '0.5rem' }}>
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'YOU' ? 'flex-end' : 'flex-start',
              marginBottom: '0.5rem'
            }}>
            <div
              style={{
                backgroundColor: msg.role === 'YOU' ? '#d0f0c0' : '#f8d0d0',
                padding: '0.7rem 1rem',
                borderRadius: '10px',
                maxWidth: '70%',
                whiteSpace: 'pre-wrap'
              }}>
              <strong>{msg.role}：</strong> {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <textarea
          placeholder="ここに入力してください"
          rows={2}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem', borderRadius: '5px' }}
        />
        <button
          onClick={handleSend}
          disabled={!userInput.trim()}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            borderRadius: '5px',
            backgroundColor: userInput.trim() ? 'black' : '#ccc',
            color: 'white'
          }}>
          送信
        </button>
      </div>
    </main>
  );
}
