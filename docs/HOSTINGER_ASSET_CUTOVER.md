# Public image cutover — 2026-09-27

The current `public-assets` image inventory contains 460 objects (1,225,611,340
bytes). All 460 were copied to Hostinger persistent storage and rechecked against
the migration manifest by exact size and SHA-256. No `.tmp_*` files remained.
A final read-only Supabase scan also found 460 source images and zero pending
paths. Supabase originals were not deleted or changed.

## Runtime source

`lib/storage/hostinger-verified-assets.json` contains only the verified public
paths. `getPublicAssetUrl`, image loaders and image-pack downloads use
`/api/media/<path>` for these objects. The route reads the Hostinger filesystem,
never fetches Supabase as a fallback for an authorized migrated object, and
returns `X-Asset-Storage: hostinger`.

Persistent files stay outside the deployment directory:

`/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets`

The server-only `HOSTINGER_PERSISTENT_STORAGE_DIR` can override this directory.
No storage directory or credential is exposed as a public environment variable.

Exact legacy `/cdn-storage/object/public/public-assets/...` and image-render
paths are rewritten to the same local route. This supports saved dossiers
without editing their immutable database snapshots. Unknown public objects
retain their existing Supabase behavior until copied and verified.

## Scope and remaining work

- This cutover covers images, not `private-documents` PDFs or database JSON.
- Supabase still supplies authentication, relational metadata and private files.
- New upload actions still upload to Supabase; migrate their verified paths or
  implement a protected Hostinger upload workflow before claiming zero Storage use.
- Do not move private documents into the public media route. Their migration
  must preserve membership checks, privacy and version history.
- Transferring originals does not generate lightweight image derivatives.

## Verification and rollback

Run `node scripts/test-hostinger-cutover.cjs` (real resolver implementation),
`node scripts/test-hostinger-storage-local.cjs`, and `npm run build`.
In production confirm GET/HEAD, hash/size and the storage header for representative
assets and legacy URLs. Check project landings, shared dossiers and ZIP downloads.

Rollback the cutover code to the previous deployment if production verification
fails. Leave both storage copies intact; a rollback does not require deleting
files or changing project_media references.
