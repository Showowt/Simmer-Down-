// Apply ONE SQL migration file to the Simmer Down Supabase project
// (qusvynxzslpmjoqfabyq) through the Supabase Management API, using the
// Supabase CLI login stored in the macOS Keychain. A human runs this on
// purpose; it prints nothing secret.
//
//   node scripts/db/apply-migration.mjs supabase/migrations/20261125_advent_calendar.sql
//
// If it says you're not logged in: run `supabase login` once, then retry.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const PROJECT_REF = 'qusvynxzslpmjoqfabyq'
const file = process.argv[2]

if (!file || !file.endsWith('.sql')) {
  console.error('Usage: node scripts/db/apply-migration.mjs <migration.sql>')
  process.exit(1)
}

let sql
try {
  sql = readFileSync(file, 'utf8')
} catch (err) {
  console.error(`Could not read ${file}: ${err.message}`)
  process.exit(1)
}

let token
try {
  const stored = execFileSync('security', ['find-generic-password', '-s', 'Supabase CLI', '-w'], {
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .toString()
    .trim()
  token = stored.startsWith('go-keyring-base64:')
    ? Buffer.from(stored.slice('go-keyring-base64:'.length), 'base64').toString('utf8').trim()
    : stored
} catch {
  console.error('No Supabase CLI login found in the Keychain. Run `supabase login`, then retry.')
  process.exit(1)
}
if (!token.startsWith('sbp_')) {
  console.error('The stored Supabase CLI login is not an access token. Run `supabase login`, then retry.')
  process.exit(1)
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})
const text = await res.text()
if (!res.ok) {
  console.error(`Migration NOT applied (HTTP ${res.status}): ${text.slice(0, 600)}`)
  process.exit(1)
}
console.log(`Applied ${file} to ${PROJECT_REF} (HTTP ${res.status}).`)
