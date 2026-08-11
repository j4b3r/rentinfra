// Idempotent SQL migration runner for supabase/migrations/*.sql.
//
// Intended for the Vercel Marketplace "Add Supabase" flow, where a fresh
// project is schema-empty and nothing runs the migrations for you. Run once
// as part of the FIRST deploy's Build Command (see DEPLOY.md), then switch
// the Build Command back to a plain `next build` / `npm run build`.
//
// Re-running is safe: applied files are tracked in a `schema_migrations`
// bookkeeping table, so a second run only applies files that haven't been
// recorded yet. That tracking is what makes it safe, NOT the migration SQL
// itself — several files (e.g. 003_licence_documents.sql's CREATE POLICY
// statements) have no IF NOT EXISTS guard, because Postgres has no
// "CREATE POLICY IF NOT EXISTS". So on a database that already has the
// schema from BEFORE this script existed (an existing manually-provisioned
// project, or a project migrated by hand before upgrading to this flow),
// blindly running 001 onward would fail on the first already-existing
// object. Guard against that: if `schema_migrations` is empty but
// `public.cars` already exists, assume the schema predates this script,
// seed every currently-known file as already-applied, and stop — this run
// applies nothing. A genuinely fresh project has neither table, so the
// normal apply-from-001 path runs unimpeded.
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

    const { rows: appliedRows } = await client.query('SELECT count(*)::int AS n FROM public.schema_migrations')
    if (appliedRows[0].n === 0) {
      const { rows: existing } = await client.query(`
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cars'
      `)
      if (existing.length) {
        console.log(
          '[migrate] public.cars already exists but schema_migrations is empty — ' +
            'this schema predates this script. Marking all known files as already-applied ' +
            'instead of re-running DDL against an existing schema.'
        )
        for (const file of files) {
          await client.query(
            'INSERT INTO public.schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
            [file]
          )
        }
        console.log('[migrate] done (schema assumed pre-existing, nothing applied)')
        return
      }
    }

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
