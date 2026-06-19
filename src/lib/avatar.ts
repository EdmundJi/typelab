const COLORS = [
  '#e2b714',
  '#4fc2b0',
  '#ca4754',
  '#7e5cff',
  '#5cabff',
  '#ff8a5c',
  '#ff5ca0',
  '#5cffb4',
]

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function getAvatar(email) {
  if (!email) return { letter: '?', color: COLORS[0] }
  const prefix = email.split('@')[0]
  const letter = prefix.charAt(0).toUpperCase()
  const color = COLORS[hash(email) % COLORS.length]
  return { letter, color }
}
