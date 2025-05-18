import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiKey = process.env.OPENAI_API_KEY;
  const { persona, user_input, ssnc, tlc } = req.body;

  // 【1】ダミーキー時は仮想応答で返す（本番APIには接続しない）
  if (apiKey?.startsWith('sk-dummy')) {
    return res.status(200).json({
      content: `[ダミー応答] ${persona}として応答中。\nOpenAI接続時は、ここに照応・にじみが宿る想定です。\n（ssnc: ${ssnc}, TLC: ${tlc?.join(', ')})`
    });
  }

  // 【2】通常のOpenAI API処理（接続済み時）
  if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

  const prompt = `
[MIR-CORE persona: ${persona}]
[SSNC: ${ssnc}]
[TLC triggers: ${tlc.join(', ')}]

User said: "${user_input}"
Respond in the tone of ${persona}, following the resonance pattern.
Also include a short catchphrase after the response.
`;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85
      })
    });

    const json = await openaiRes.json();
    const content = json.choices?.[0]?.message?.content || '[応答取得失敗]';

    res.status(200).json({ content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'API request failed' });
  }
}
