import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const lessonsDir = resolve(root, 'src/lessons')
const dryRun = process.argv.includes('--dry-run')
const prune = process.argv.includes('--prune')

async function listJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await listJsonFiles(path)))
    else if (entry.name.endsWith('.json') && entry.name !== 'manifest.json') files.push(path)
  }
  return files.sort()
}

async function buildRows() {
  const rows = []
  for (const file of await listJsonFiles(lessonsDir)) {
    const sourceFile = `./${relative(lessonsDir, file).replaceAll('\\', '/')}`
    const lessons = JSON.parse(await readFile(file, 'utf8'))
    for (const lesson of lessons) {
      rows.push({
        id: lesson.id,
        title: lesson.title,
        topic: lesson.topic,
        difficulty: lesson.difficulty,
        variants: lesson.variants,
        source_file: sourceFile,
        content_hash: createHash('sha256').update(JSON.stringify(lesson)).digest('hex'),
        synced_at: new Date().toISOString(),
      })
    }
  }
  return rows
}

const rows = await buildRows()
const topics = [...new Set(rows.map((row) => row.topic))].sort()

if (dryRun) {
  console.log(`Validated ${rows.length} lessons across ${topics.length} topics`)
  console.log(topics.join(', '))
  process.exit(0)
}

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceRoleKey) {
  throw new Error(
    'Set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL (or VITE_SUPABASE_URL) before syncing',
  )
}
if (serviceRoleKey === process.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY must not reuse the public anon key')
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

for (let offset = 0; offset < rows.length; offset += 100) {
  const batch = rows.slice(offset, offset + 100)
  const { error } = await supabase.from('builtin_lessons').upsert(batch, { onConflict: 'id' })
  if (error) throw error
}

if (prune) {
  const { data: remoteRows, error: selectError } = await supabase
    .from('builtin_lessons')
    .select('id')
  if (selectError) throw selectError
  const localIds = new Set(rows.map((row) => row.id))
  const staleIds = (remoteRows ?? []).map((row) => row.id).filter((id) => !localIds.has(id))
  for (let offset = 0; offset < staleIds.length; offset += 100) {
    const { error } = await supabase
      .from('builtin_lessons')
      .delete()
      .in('id', staleIds.slice(offset, offset + 100))
    if (error) throw error
  }
  console.log(`Pruned ${staleIds.length} stale lessons`)
}

const {
  data: syncedRows,
  count,
  error: countError,
} = await supabase.from('builtin_lessons').select('id, content_hash', { count: 'exact' })
if (countError) throw countError

const remoteHashes = new Map((syncedRows ?? []).map((row) => [row.id, row.content_hash]))
const mismatches = rows.filter((row) => remoteHashes.get(row.id) !== row.content_hash)
if (mismatches.length > 0) {
  throw new Error(`Hash verification failed for: ${mismatches.map((row) => row.id).join(', ')}`)
}

console.log(`Synced and verified ${rows.length} lessons; remote table now has ${count} rows`)
