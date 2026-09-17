# Pedro Melo Live v0.6 — Concert Safe

Temporary branch based on `2bd5e0894370aa87c31aa46e3ed8d4f6cf77691f`.
The full v0.6 remains on `main`. This document does not authorize publication.

## Compatibility boundary

Only schema 0000–0006 is required. SQL projections and import INSERTs do not
reference the ten columns from 0007. Session context is returned as empty strings
and `featuredOriginal: null`; optional song metadata is omitted.

Disabled in both UI and command handling: song metadata, event metadata,
advanced event duplication, and restore. Restore GET/POST refuse authenticated
calls with 409 before parsing files or accessing D1/R2. Unauthenticated calls
remain forbidden. Basic imports reject CSV metadata headers (even empty) and
JSON metadata properties. Artwork editing is independent of metadata.

Retained: visual system, public requests/receipt, discovery, Stage Mode,
repertoire and availability, basic event creation/copying setlist, analytics,
contacts, tips, projects, lessons, photos, artwork, imports, exports and backup.
No CSS, authentication, bindings, secrets or hosting configuration changes.

## Migration packaging

0000–0006 SQL and snapshots remain byte-for-byte identical to the base commit.
0007 SQL/snapshot and its journal entry are removed only on this branch.
`db/schema.ts` describes schema 0006. No generated alternative or rollback.
The build copies this seven-migration tree to `dist/.openai/drizzle`.

Removing 0007 does NOT prove that Sites will consider 0000–0006 already applied.
Before any publication, the supported review/history mechanism must confirm
that deployment would execute zero migrations. Do not publish the saved full
v0.6 version as Concert Safe.

## Local verification

Existing dependencies are reused: Miniflare/workerd, TypeScript and esbuild.
DOM tests reuse the existing ignored Happy DOM installation at
`work/discovery-dom/node_modules/happy-dom`. No runtime dependency was added.

Build Concert Safe and a clean detached worktree of the exact full v0.6 commit.
For the managed-linux environment, the checked-in shell wrapper is not executable;
run the existing build command with its local bootstrap variables supplied:

```sh
SITES_ENV_READY=1 SITES_PROJECT_ROOT="$PWD" npm run build
```

Run these in the Concert Safe checkout (pass the full worktree's path):

```sh
node tests/concert-safe-runtime.mjs work/concert-safe/full
node tests/concert-safe-artifact.mjs
npx tsc --noEmit
node tests/v06-stage.mjs
node tests/v06-stage-feedback.mjs
node tests/v06-live-experience.mjs
node tests/v06-public-artwork.mjs
node tests/v06-management-feedback.mjs
```

The runtime test creates a NEW ignored `work/concert-safe/run-*` directory for
each run. It uses the actual compiled application Worker, real local D1 and R2,
synthetic fixtures and local-only authentication headers. Outbound Worker traffic
is refused and integrations are disabled. It does not use production credentials.
The browser router hook is adapted for DOM tests; API handlers/SQL are not mocked.
DOM results do not establish browser layout or mobile keyboard behavior.

It applies only 0000–0006 to the initially empty local D1, asserts the ten columns
are absent, exercises HTTP endpoints and real React components with 500 songs,
then adds one song through basic import. It checks pause/play/finish/setlist,
request idempotency and receipt, search/accents/artists/popularity/surprise/pages,
bulk management, tips, contact verification, tracking, exports, backup, denied
restore and anonymous admin access, and present/absent local R2 images.

On that SAME local D1 it snapshots rows and R2 content hashes, applies the original
0007 once, starts the unchanged full v0.6 Worker, compares all original row values,
and tests the re-enabled metadata/event-context writes. Reports and before-state
snapshots are retained in the run directory; no QA output is versioned.

Successful rehearsal: 501 songs, 3 sessions, 1007 membership rows, 2 requests,
11 aggregate metrics rows, 1 tip, 6 settings, 1 contact and 1 verification row
preserved. Six R2 objects (artwork, four photo slots and an export) retain their
hashes. All ten columns are present after transition. Zero `no such column`
errors; no Worker errors. 169 explicit HTTP assertions plus DOM-driven requests.

Artifact inspection: 183 source/built files and 88 SQL fragments checked;
no forbidden column reference in those SQL fragments; seven unchanged SQL files,
seven unchanged snapshots, journal ending at 0006, and no 0007 SQL/snapshot.
Both application builds and TypeScript passed. Focused regression tests listed
above passed, including the management feedback test adjusted to the artwork-only
button names.

## Existing quality failures / commit gate

The repository-wide lint command fails on the original full v0.6 as well:
215 errors / 26 warnings in the base; 207 errors / 26 warnings in Concert Safe.
There are no added per-file lint errors. The three new Concert Safe test files
pass lint. Do not suppress rules or broaden the product changes to hide this.

Three legacy tests also fail in the untouched base and in Concert Safe:
- `v06-discovery.mjs`: missing generated `song-artwork-thumbnail` module.
- `v06-photography.mjs`: stale expectation that a present image is initially hidden.
- `v06-analytics.mjs`: stale expectation of social/community links inside the receipt.

The focused Concert Safe runtime tests exercise the current behavior against
real local storage. These legacy failures have not been silently marked passed.
Under the instruction to commit only if everything passes, no commit is made
while these quality gates remain failing.

## Return to full v0.6

Keep this compatibility branch separate. After the supported migration history
and recovery mechanism are confirmed, apply only 0007 to the existing production
D1 and publish the original full v0.6 code using the same Site/DB/BUCKET.
Do not restore a pre-concert database backup: that would discard newer data.
Existing IDs, rows, relationships, stable artwork keys and photo slots are retained;
new metadata initially takes the defaults from 0007. Existing retention policies
continue to apply. A successful local rehearsal does not validate Sites migration
history or authorize remote migrations/deployment.
