SHORT Rells — Firestore connection patch

1. Publish firestore.rules in Firebase Console → Firestore Database → Rules.
2. Upload all files in this ZIP to the same GitHub Pages folder as the current site.
   Keep firebase-records.js beside index.html, login.html, and admin.html.
3. The admin dashboard now routes records.list/create/replace/delete directly to
   Firestore instead of the unsupported GitHub Pages "actions" endpoint.
4. Admin writes require the Firebase custom claim admin=true or superAdmin=true.
   The Admin SDK key must stay local and must never be uploaded to GitHub.
5. The public site's novaflix_* likes, My List, progress and history are scoped to
   the signed-in Firebase user. Visitors who are not signed in can browse but
   cannot persist those personal records.

Remaining work:
- Cloudflare Worker + R2 media upload is not implemented in this patch.
- The public catalogue in index.html still uses its existing bundled/demo catalogue;
  it is not yet dynamically loaded from short_rells_series.
- End-to-end testing of create/edit/delete and user features is still required.
