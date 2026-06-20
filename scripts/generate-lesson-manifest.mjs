import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const lessonsDir = resolve(root, 'src/lessons')
const manifestPath = resolve(lessonsDir, 'manifest.json')
const checkOnly = process.argv.includes('--check')

async function listJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await listJsonFiles(path)))
    else if (entry.name.endsWith('.json') && path !== manifestPath) files.push(path)
  }

  return files.sort()
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function validateLesson(lesson, sourceFile, lessonIds, variantIds) {
  const prefix = `${sourceFile}: ${lesson?.id ?? '<missing id>'}`
  assert(lesson && typeof lesson === 'object', `${prefix} must be an object`)
  assert(typeof lesson.id === 'string' && lesson.id.length > 0, `${prefix} needs id`)
  assert(!lessonIds.has(lesson.id), `${prefix} duplicates lesson id`)
  lessonIds.add(lesson.id)
  assert(typeof lesson.title === 'string' && lesson.title.length > 0, `${prefix} needs title`)
  assert(typeof lesson.topic === 'string' && lesson.topic.length > 0, `${prefix} needs topic`)
  assert(!('category' in lesson), `${prefix} uses legacy category; use topic`)
  assert(
    Number.isInteger(lesson.difficulty) && lesson.difficulty >= 1 && lesson.difficulty <= 5,
    `${prefix} difficulty must be an integer from 1 to 5`,
  )
  assert(
    Array.isArray(lesson.variants) && lesson.variants.length > 0,
    `${prefix} needs at least one variant`,
  )

  for (const variant of lesson.variants) {
    const variantPrefix = `${prefix}/${variant?.variant_id ?? '<missing variant_id>'}`
    assert(
      typeof variant.variant_id === 'string' && variant.variant_id.length > 0,
      `${variantPrefix} needs variant_id`,
    )
    assert(!variantIds.has(variant.variant_id), `${variantPrefix} duplicates variant_id`)
    variantIds.add(variant.variant_id)
    assert(
      typeof variant.language === 'string' && variant.language.length > 0,
      `${variantPrefix} needs language`,
    )
    assert(
      ['verbose', 'standard', 'concise'].includes(variant.style),
      `${variantPrefix} has invalid style`,
    )
    assert([1, 2, 3].includes(variant.step), `${variantPrefix} step must be 1, 2 or 3`)
    assert(
      typeof variant.label === 'string' && variant.label.length > 0,
      `${variantPrefix} needs label`,
    )
    assert(
      typeof variant.text === 'string' && variant.text.length > 0,
      `${variantPrefix} needs text`,
    )
    assert(!('code' in variant), `${variantPrefix} uses legacy code; use text`)
    assert(typeof variant.note === 'string', `${variantPrefix} needs note`)
  }
}

const files = await listJsonFiles(lessonsDir)
const lessonIds = new Set()
const variantIds = new Set()
const manifest = []

for (const file of files) {
  const sourceFile = `./${relative(lessonsDir, file).replaceAll('\\', '/')}`
  const lessons = JSON.parse(await readFile(file, 'utf8'))
  assert(Array.isArray(lessons), `${sourceFile} must contain an array`)

  for (const lesson of lessons) {
    validateLesson(lesson, sourceFile, lessonIds, variantIds)
    manifest.push({
      id: lesson.id,
      title: lesson.title,
      topic: lesson.topic,
      difficulty: lesson.difficulty,
      variants: lesson.variants.map(({ variant_id, language, style, step, label }) => ({
        variant_id,
        language,
        style,
        step,
        label,
      })),
      source_file: sourceFile,
    })
  }
}

const output = `${JSON.stringify(manifest, null, 2)}\n`

if (checkOnly) {
  const current = await readFile(manifestPath, 'utf8').catch(() => '')
  if (current !== output) {
    console.error('Lesson manifest is stale. Run: npm run lessons:manifest')
    process.exitCode = 1
  }
} else {
  await writeFile(manifestPath, output)
  console.log(`Generated ${relative(root, manifestPath)} with ${manifest.length} lessons`)
}
