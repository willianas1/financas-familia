const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

export async function extrairDespesaDeImagem(base64, mimeType = 'image/jpeg') {
  const hoje = new Date().toISOString().split('T')[0]
  const prompt = `Analise este comprovante/recibo/nota fiscal brasileiro e extraia os dados da despesa.
Responda APENAS com JSON válido, sem markdown, sem explicações:
{"descricao":"nome do estabelecimento ou item principal","valor":99.90,"data":"${hoje}","parcelas":1}
Regras:
- valor: número decimal com ponto (ex: 45.90), sem símbolo de moeda
- data: formato YYYY-MM-DD (use ${hoje} se não encontrar)
- parcelas: inteiro ≥ 1 (1 se à vista)
- descricao: máximo 60 caracteres, em português
Se não conseguir identificar os dados, responda: {"erro":"motivo"}`

  const res = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ],
      }],
      generationConfig: { temperature: 0.1 },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `Erro na API Gemini (${res.status})`)
  }

  const json = await res.json()
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Remove possível markdown ```json ... ``` e extrai o objeto JSON
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Resposta inesperada da API')

  const parsed = JSON.parse(match[0])
  if (parsed.erro) throw new Error(parsed.erro)

  return {
    descricao: String(parsed.descricao ?? '').slice(0, 60),
    valor:     Number(parsed.valor)  || 0,
    data:      /^\d{4}-\d{2}-\d{2}$/.test(parsed.data) ? parsed.data : hoje,
    parcelas:  Math.max(1, parseInt(parsed.parcelas) || 1),
  }
}

export function imagemParaBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
