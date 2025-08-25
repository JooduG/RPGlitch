<!-- path: present/integration-upload-plugin-profile-pictures.md -->

# Perchance Upload Plugin — Profile Pictures Integration (Present)

## 1) Capability Summary

- Import: `perchance.upload = { import: "upload-plugin" }`.
- Call: `const { url, size, error, deletionUrl } = await upload(blobOrString, { expires })`.
- Accepts `Blob` (preferred) or string.
- Error codes include: `over_daily_allowance`, `file_too_big`, `invalid_filetype`.
- Temporary files (24h) have higher size limits; manual deletion optional via `deletionUrl`.

## 2) Phases

### Phase 1 — Basic

- Wire plugin import and adapter: `App.media.uploadProfilePicture(blob)`.
- Bind to character profile editing flow; update character avatar on success.
- Display with onerror fallback (initials/placeholder).
- Minimal tests (happy path, invalid type, over allowance).

### Phase 2 — Enhanced

- Client-side compression before upload (Canvas/Web Worker).
- Use temporary files for drafts; clean up unreferenced images.
- Simple upload UI with size/type hints.

### Phase 3 — Advanced

- Batch uploads; resize/format conversion strategies.
- Progress UI and retry/backoff logic.

## 3) UI Hook (example)

```js
async function handleProfilePictureUpload(characterId, file) {
  if (!file) return;
  const blob = file instanceof Blob ? file : new Blob([file]);
  try {
    const { url, error } = await App.media.uploadProfilePicture(blob);
    if (error) throw new Error(error);
    await App.db.characters.update(characterId, { avatar: url, updatedAt: Date.now() });
    App.toasts.ok("Profile picture updated");
  } catch (e) {
    App.toasts.err("Upload failed");
  }
}
````

## 4) Notes

- Prefer initials-based fallback on error/404.
- Keep logs minimal in production; verbose in dev.
- Sanitize any dynamic HTML around previews (DOMPurify).

## 5) Test Checklist

- Valid image types (png/jpg/webp) succeed.
- Rejected types surface clear toasts; state remains consistent.
- Over-limit files show `over_daily_allowance`.
- Temporary uploads expire; unused URLs are cleaned when profile edits are discarded.
