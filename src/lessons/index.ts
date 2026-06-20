import type { LessonManifestEntry, LessonMeta, RawLesson } from '@/types'
import manifest from './manifest.json'

// 题目列表只读取不含正文的 manifest。每个 JSON 文件由 Vite 拆成独立异步 chunk，
// 只有进入具体题目时才加载对应文件。
const lessonLoaders = import.meta.glob(['./**/*.json', '!./manifest.json'], {
  import: 'default',
}) as Record<string, () => Promise<RawLesson[]>>

const manifestEntries = manifest as LessonManifestEntry[]
const manifestById = new Map(manifestEntries.map((lesson) => [lesson.id, lesson]))

export const lessonMetas: LessonMeta[] = manifestEntries.map(
  ({ source_file: _source, ...meta }) => meta,
)

export async function getLessonById(id: string): Promise<RawLesson | undefined> {
  const bareId = id.replace(/^builtin:/, '')
  const entry = manifestById.get(bareId)
  if (!entry) return undefined

  const load = lessonLoaders[entry.source_file]
  if (!load) throw new Error(`Missing lesson module: ${entry.source_file}`)

  const lessons = await load()
  return lessons.find((lesson) => lesson.id === bareId)
}

export function getLessonMetaById(id: string): LessonMeta | undefined {
  const entry = manifestById.get(id.replace(/^builtin:/, ''))
  if (!entry) return undefined
  const { source_file: _source, ...meta } = entry
  return meta
}
