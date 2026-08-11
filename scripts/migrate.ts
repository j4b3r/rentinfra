// Idempotent SQL migration runner for supabase/migrations/*.sql.
//
// Intended for the Vercel Marketplace "Add Supabase" flow, where a fresh
// project is schema-empty and nothing runs the migrations for you. Run once
// as part of the FIRST deploy's Build Command (see DEPLOY.md), then switch
// the Build Command back to a plain `next build` / `npm run build`.
//
// Safe to run more than once: applied files are tracked in a
// `schema_migrations` bookkeeping table, so re-running only applies files
// that haven't been recorded yet.
//
// Looks for POSTGRES_URL_NON_POOLING (what the Vercel Supabase integration
// injects for direct, non-pgbouncer connections) or DATABASE_URL as a
// fallback for other hosts. If neither is set, this is a no-op — that's the
// case for local dev and for the "manual Supabase project" deploy path,
// where migrations are still run by hand via the Supabase SQL Editor.
import { Client } from 'pg'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'

async function main() {
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL

  if (!connectionString) {
    console.log(
      '[migrate] no POSTGRES_URL_NON_POOLING or DATABASE_URL set — skipping. ' +
        'Run the migrations manually via the Supabase SQL Editor per DEPLOY.md.'
    )
    return
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)

    const dir = path.join(process.cwd(), 'supabase/migrations')
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.sql') && f !== 'demo_seed.sql')
      .sort() // zero-padded numeric prefixes (001_, 002_, ...) sort correctly as strings

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT 1 FROM public.schema_migrations WHERE filename = $1',
        [file]
      )
      if (rows.length) {
        console.log(`[migrate] skip ${file} (already applied)`)
        continue
      }

      const sql = readFileSync(path.join(dir, file), 'utf8')
      console.log(`[migrate] applying ${file}...`)
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO public.schema_migrations (filename) VALUES ($1)', [file])
        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`[migrate] FAILED on ${file}:`, err)
        process.exitCode = 1
        return
      }
    }

    console.log('[migrate] done')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('[migrate] unexpected error:', err)
  process.exitCode = 1
})
