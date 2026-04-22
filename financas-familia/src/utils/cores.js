function hexToHue(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  if (max === min) return 0
  const d = max - min
  if (max === r) return (((g - b) / d + (g < b ? 6 : 0)) / 6) * 360
  if (max === g) return (((b - r) / d + 2) / 6) * 360
  return (((r - g) / d + 4) / 6) * 360
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const htr = (p, q, t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const hNorm = h / 360
  return '#' + [htr(p, q, hNorm + 1/3), htr(p, q, hNorm), htr(p, q, hNorm - 1/3)]
    .map(v => Math.round(v * 255).toString(16).padStart(2, '0'))
    .join('')
}

// Gera uma cor com hue maximamente distante de todas as cores existentes
export function gerarCorAleatoria(coresExistentes = []) {
  const huesExistentes = coresExistentes
    .filter(c => typeof c === 'string' && c.startsWith('#'))
    .map(hexToHue)

  let melhorHue = 0
  let maiorDistancia = -1

  for (let h = 0; h < 360; h += 5) {
    const dist = huesExistentes.length === 0
      ? 360
      : Math.min(...huesExistentes.map(he => Math.min(Math.abs(h - he), 360 - Math.abs(h - he))))
    if (dist > maiorDistancia) {
      maiorDistancia = dist
      melhorHue = h
    }
  }

  // Variação ±10° em torno do melhor hue para não ser sempre igual
  const hue = (melhorHue + (Math.random() - 0.5) * 20 + 360) % 360
  const sat = 55 + Math.random() * 25   // 55–80%
  const lig = 38 + Math.random() * 20   // 38–58%

  return hslToHex(hue, sat, lig)
}
