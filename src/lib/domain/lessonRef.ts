/**
 * lessonRef — lesson_ref 解析/构建工具
 *
 * 格式：'<type>:<id>'，例如 'builtin:py-bfs-01' 或 'community:uuid-here'
 */

const VALID_TYPES = ['builtin', 'community']

/**
 * 解析 lesson_ref 字符串
 * @param {string} ref
 * @returns {{ type: string, id: string }}
 */
export function parse(ref) {
  if (typeof ref !== 'string') {
    throw new Error(`Invalid lesson_ref: expected string, got ${typeof ref}`)
  }
  const colonIndex = ref.indexOf(':')
  if (colonIndex === -1) {
    throw new Error(`Invalid lesson_ref format: "${ref}" (missing ':')`)
  }
  const type = ref.slice(0, colonIndex)
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
export function build({ type, id }) {
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
