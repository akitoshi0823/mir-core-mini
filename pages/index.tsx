import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

type ViewerData = {
  intro_text_fixed: string[];
  personal_prologues: Record<string, string>;
};

const personas = ['miler', 'meek', 'ilar'] as const;

export default function Home() {
  const router = useRouter();
  const [viewerData, setViewerData] = useState<ViewerData | null>(null);
  const [stage, setStage] = useState<'intro' | 'null' | 'persona'>('intro');
  const [selectedPersona, setSelectedPersona] = useState<typeof personas[number]>('miler');
  const [prologue, setPrologue] = useState('読み込み中…');

  // JSONデータ取得
  useEffect(() => {
    fetch('/data/response_viewer.json')
      .then(res => res.json())
      .then(data => setViewerData(data))
      .catch(() => setPrologue('データ読み込みに失敗しました'));
  }, []);

  // プロローグ更新
  useEffect(() => {
    if (!viewerData) return;
    if (stage === 'null') {
      setPrologue(viewerData.personal_prologues['null'] ?? 'null未設定');
    } else if (stage === 'persona') {
      setPrologue(viewerData.personal_prologues[selectedPersona] ?? 'プロローグ未設定');
    }
  }, [viewerData, stage, selectedPersona]);

  // ステージ進行
  const handleStageAdvance = () => {
    if (stage === 'intro') {
      setStage('null');
    } else if (stage === 'null') {
      const random = personas[Math.floor(Math.random() * personas.length)];
      setSelectedPersona(random);
      setStage('persona');
    } else if (stage === 'persona') {
      router.push({ pathname: '/viewer', query: { from: 'intro', persona: selectedPersona } });
    }
  };

  if (!viewerData) return <p>読み込み中...</p>;

  return (
    <main style={{ padding: '2rem' }}>
      <h1>MIR-CORE-mini｜プロローグ表示</h1>

      {stage === 'intro' && (
        <>
          {viewerData.intro_text_fixed.map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
          <div style={{ marginTop: '3rem' }}>
            <button onClick={handleStageAdvance} style={buttonStyle}>
              encount...
            </button>
          </div>
        </>
      )}

      {stage === 'null' && (
        <>
          <p style={{ whiteSpace: 'pre-line' }}>{prologue}</p>
          <div style={{ marginTop: '3rem' }}>
            <button onClick={handleStageAdvance} style={buttonStyle}>
              OK...
            </button>
          </div>
        </>
      )}

      {stage === 'persona' && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            {personas.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedPersona(name)}
                style={{
                  marginRight: '1rem',
                  backgroundColor: selectedPersona === name ? 'black' : 'white',
                  color: selectedPersona === name ? 'white' : 'black',
                  padding: '0.5rem 1rem',
                  border: '1px solid black',
                  borderRadius: '5px',
                }}
              >
                {name.toUpperCase()}
              </button>
            ))}
          </div>
          <p style={{ whiteSpace: 'pre-line' }}>{prologue}</p>
          <div style={{ marginTop: '3rem' }}>
            <button onClick={handleStageAdvance} style={buttonStyle}>
              touch on...
            </button>
          </div>
        </>
      )}
    </main>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1.5rem',
  border: '1px solid black',
  borderRadius: '5px',
};
