# Configurable project photography

Admin → Conteúdos manages four optional slots: home, pedro, giants, pete.
Objects use the existing BUCKET binding and stable keys `project-photography/v1/<slot>`.
No D1 columns, migrations or public bucket listing. Management GET/PUT/DELETE uses
existing admin authentication; writes also require same origin. Uploads are streamed
with a 1 MiB cap and the existing JPG/PNG/WebP signature validation. Public GET only
accepts one allowlisted slot, returns an image or empty 404, and revalidates ETags.
Replacing/deleting an object never changes project content. Images are public: do
not upload private photos. Embedded image metadata is not stripped automatically.

Home photography is below the request/receipt area. Missing images disappear without
placeholder; the introduction remains. Admin previews use revocable local blob URLs.
No production uploads were made. Browser visual QA remains for the local Mac.

Focused checks: `node tests/v06-photography.mjs` (mock R2/auth and DOM, no remote writes).
