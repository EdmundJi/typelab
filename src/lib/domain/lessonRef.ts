/**
 * lessonRef — lesson_ref 解析/构建工具
 *
 * 格式：'<type>:<id>'，例如 'builtin:py-bfs-01' 或 'community:uuid-here'
 */

const VALID_TYPES = ['builtin', 'community'] as const

type LessonRefType = (typeof VALID_TYPES)[number]

function hasKnownPrefix(value: string) {
  return VALID_TYPES.some((type) => value.startsWith(`${type}:`))
}

/**
 * 解析 lesson_ref 字符串
 * @param {string} ref
 * @returns {{ type: string, id: string }}
 */
export function parse(ref: unknown): { type: LessonRefType; id: string } {
  if (typeof ref !== 'string') {
    throw new Error(`Invalid lesson_ref: expected string, got ${typeof ref}`)
  }
  const colonIndex = ref.indexOf(':')
  if (colonIndex === -1) {
    throw new Error(`Invalid lesson_ref format: "${ref}" (missing ':')`)
  }
  const type = ref.slice(0, colonIndex) as LessonRefType
  const id = ref.slice(colonIndex + 1)
  if (!type) {
    throw new Error(`Invalid lesson_ref format: "${ref}" (empty type)`)
  }
  if (!id) {
    throw new Error(`Invalid lesson_ref format: "${ref}" (empty id)`)
  }
  if (!VALID_TYPES.includes(type)) {
    throw new Error(
      `Invalid lesson_ref type: "${type}" (must be one of: ${VALID_TYPES.join(', ')})`,
    )
  }
  return { type, id }
}

/**
 * 构建 lesson_ref 字符串
 * @param {{ type: string, id: string }} param0
 * @returns {string}
 */
export function build({ type, id }: { type: string; id: string }) {
  if (!type) {
    throw new Error('Invalid lesson_ref: type is required')
  }
  if (!id) {
    throw new Error('Invalid lesson_ref: id is required')
  }
  if (!VALID_TYPES.includes(type)) {
    throw new Error(
      `Invalid lesson_ref type: "${type}" (must be one of: ${VALID_TYPES.join(', ')})`,
    )
  }
  return `${type}:${id}`
}

/**
 * 判断字符串是否已经是合法 lesson_ref。
 */
export function isLessonRef(value: unknown): value is `${LessonRefType}:${string}` {
  if (typeof value !== 'string' || !hasKnownPrefix(value)) return false
  try {
    parse(value)
    return true
  } catch {
    return false
  }
}

/**
 * 将裸内置课程 id 或已有 lesson_ref 统一为规范 lesson_ref。
 */
export function toLessonRef(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`Invalid lesson_ref source: expected string or number, got ${typeof value}`)
  }

  const raw = String(value)
  if (isLessonRef(raw)) return raw
  if (hasKnownPrefix(raw)) parse(raw)
  return build({ type: 'builtin', id: raw })
}
