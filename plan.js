/**
 * Speech planning: turn one reply into the exact list of API segments.
 *
 * Everything downstream (requests, budget, cache key) derives from this plan,
 * so a single normalisation decides what is spoken, in which language, with
 * which tone, and how many characters it costs.
 */

const CJK = /[\u3400-\u4DBF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/g
const LATIN = /[A-Za-z]/g

const SENTENCE_MARKS = [0x3002, 0xFF01, 0xFF1F, 0x2026, 0xFF1B, 0x21, 0x3F, 0x3B, 0x0A]
  .map((code) => String.fromCharCode(code))
  .join('')

const MARKER_PATTERN = /<!--\s*mood:\s*([a-z-]+)\s*-->/gi

export const DEFAULT_MAX_CHARS = 900

const EMOTION_INSTRUCTIONS = {
  curious: '语气带着好奇和疑问，句尾略微上扬。',
  excited: '语气兴奋，语速稍快，音调偏高。',
  happy: '语气愉快，带着笑意，句尾轻轻上扬。',
  angry: '语气生气，音量略高，语速偏快，带着一点压迫感。',
  down: '语气沮丧，声音发闷，语速放慢。',
  sad: '语气低落，语速放慢，尾音下沉。',
  whisper: '压低声音像耳语，气息多，音量小。',
  surprised: '语气惊讶，语调突然抬高，语速略快。',
  afraid: '语气带着紧张和不安，声音发抖，语速不稳。',
  serious: '语气严肃克制，吐字清楚，节奏稳定。',
  tired: '语气疲惫，声音有气无力，语速偏慢。',
  gentle: '语气轻柔，像在轻声安慰对方。',
}

export function emotionInstruction(emotion) {
  return EMOTION_INSTRUCTIONS[String(emotion || '').toLowerCase()] || ''
}

function countMatches(text, pattern) {
  const found = String(text).match(pattern)
  return found ? found.length : 0
}

export function stripEmoji(text) {
  let out = ''
  for (const ch of String(text ?? '')) {
    const cp = ch.codePointAt(0)
    if (cp >= 0x1f000 && cp <= 0x1faff) continue
    if (cp >= 0x2600 && cp <= 0x27bf) continue
    if (cp === 0xfe0f || cp === 0x200d || cp === 0x2b50) continue
    out += ch
  }
  return out
}

export function cleanSpeech(text, keepTags) {
  let value = String(text ?? '')
  const tags = []
  if (keepTags) {
    value = value.replace(/<!--[\s\S]*?-->/g, (match) => {
      tags.push(match)
      return '@@TAG' + (tags.length - 1) + '@@'
    })
  } else {
    value = value.replace(/<!--[\s\S]*?-->/g, ' ')
  }
  value = value.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  value = value.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  value = value.replace(/https?:\/\/[^\s)]+/g, ' ')
  value = value.replace(/`{1,3}[^`]*`{1,3}/g, ' ')
  value = value.replace(/[*_~#>|]+/g, ' ')
  value = stripEmoji(value)
  value = value.replace(/\s+([：，。！？；、）】」》])/g, '$1')
  value = value.replace(/([（【「《])\s+/g, '$1')
  value = value.replace(/\s+/g, ' ')
  if (keepTags && tags.length) {
    value = value.replace(/@@TAG(\d+)@@/g, (match, index) => tags[Number(index)] || ' ')
  }
  return value.trim()
}

export function detectLanguage(text) {
  const cjk = countMatches(text, CJK)
  const latin = countMatches(text, LATIN)
  if (cjk === 0) return latin > 0 ? 'en' : ''
  return cjk * 2 >= latin ? 'zh' : 'en'
}

export function splitSentences(text) {
  const value = String(text ?? '').trim()
  if (!value) return []
  const parts = []
  let buffer = ''
  for (let index = 0; index < value.length; index += 1) {
    const ch = value[index]
    buffer += ch
    const next = value[index + 1]
    const asciiStop = ch === '.' && (
      next === undefined || next === ' ' || next === '\n' || next === '\t' || next === '"' || next === "'" || next === ')' || next === ']'
    )
    if (SENTENCE_MARKS.includes(ch) || asciiStop) {
      parts.push(buffer)
      buffer = ''
    }
  }
  if (buffer.trim()) parts.push(buffer)
  return parts.map((part) => part.trim()).filter(Boolean)
}

/** Split one text into emotion-tagged units; a leading marker applies to what follows. */
export function splitByMarker(text) {
  const value = String(text ?? '')
  const parts = []
  let lastIndex = 0
  let current = ''
  let match = MARKER_PATTERN.exec(value)
  while (match) {
    const before = value.slice(lastIndex, match.index)
    if (before.trim()) parts.push({ text: before, emotion: current })
    current = String(match[1] || '').toLowerCase()
    lastIndex = match.index + match[0].length
    match = MARKER_PATTERN.exec(value)
  }
  const tail = value.slice(lastIndex)
  if (tail.trim()) parts.push({ text: tail, emotion: current })
  if (!parts.length) parts.push({ text: value.replace(MARKER_PATTERN, ' '), emotion: current })
  return parts
}

function guessEmotion(sentence) {
  const value = String(sentence).trim()
  if (!value) return ''
  if (/[?？]\s*$/.test(value)) return 'curious'
  if (/[!！]\s*$/.test(value)) return 'excited'
  if (/(…|\.\.\.)\s*$/.test(value)) return 'sad'
  return ''
}

/** Split a single sentence that alone exceeds the API limit, never breaking a code point. */
function hardSplit(sentence, maxChars) {
  const chars = Array.from(String(sentence))
  if (chars.length <= maxChars) return [String(sentence)]
  const out = []
  let cursor = 0
  while (cursor < chars.length) {
    let take = Math.min(maxChars, chars.length - cursor)
    if (cursor + take < chars.length) {
      const window = chars.slice(cursor, cursor + take).join('')
      const cut = Math.max(
        window.lastIndexOf(' '),
        window.lastIndexOf(String.fromCharCode(0x3002)),
        window.lastIndexOf(String.fromCharCode(0xFF0C)),
        window.lastIndexOf(','),
      )
      if (cut > maxChars / 2) take = Array.from(window.slice(0, cut + 1)).length
    }
    out.push(chars.slice(cursor, cursor + take).join(''))
    cursor += take
  }
  return out
}

function joinable(previous, next) {
  if (!previous) return next
  const lastCh = previous.slice(-1)
  const firstCh = next.slice(0, 1)
  if (/\s/.test(lastCh) || /\s/.test(firstCh)) return previous + next
  const asciiBoth = /[A-Za-z0-9.!?]$/.test(previous) && /^[A-Za-z0-9]/.test(next)
  if (asciiBoth) return previous + ' ' + next
  return previous + next
}

/**
 * Build the segment plan.
 * @returns {{segments: Array<{text: string, language: string, emotion: string, instructions: string}>, chars: number}}
 */
export function buildPlan(text, options = {}) {
  const {
    emotionMode = 'fixed',
    baseInstructions = '',
    maxChars = DEFAULT_MAX_CHARS,
  } = options
  const raw = String(text ?? '')
  const markerMode = emotionMode === 'marker' && MARKER_PATTERN.test(raw)
  MARKER_PATTERN.lastIndex = 0

  const units = markerMode
    ? splitByMarker(raw)
    : [{ text: cleanSpeech(raw), emotion: '' }]

  const pieces = []
  let carry = ''
  for (const unit of units) {
    const cleaned = cleanSpeech(unit.text)
    if (!cleaned) continue
    for (const sentence of splitSentences(cleaned)) {
      let emotion = unit.emotion
      if (!emotion && emotionMode === 'infer') {
        const guessed = guessEmotion(sentence)
        if (guessed) {
          emotion = guessed
          carry = guessed
        } else if (carry && sentence.length <= 40) {
          emotion = carry
        }
      }
      const instructions = emotion ? (emotionInstruction(emotion) || baseInstructions) : baseInstructions
      for (const piece of hardSplit(sentence, maxChars)) {
        const last = pieces[pieces.length - 1]
        const speakable = /[A-Za-z0-9\u3400-\u4DBF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/.test(piece)
        if (!speakable) {
          if (last) {
            last.text += piece
            continue
          }
          continue
        }
        const language = detectLanguage(piece) || (last ? last.language : 'zh')
        const sameTone = last && last.instructions === instructions && last.emotion === emotion
        const sameLang = last && last.language === language
        if (sameTone && sameLang && Array.from(last.text).length + Array.from(piece).length <= maxChars) {
          last.text = joinable(last.text, piece)
          continue
        }
        pieces.push({ text: piece, language, emotion, instructions })
      }
    }
  }

  const segments = pieces.map((piece) => ({
    text: piece.text,
    language: piece.language,
    emotion: piece.emotion,
    instructions: piece.instructions,
  }))
  const chars = segments.reduce((total, segment) => total + Array.from(segment.text).length, 0)
  return { segments, chars }
}
