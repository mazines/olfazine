# Next phase: Firebase

Today the site is static and the same for everyone. `/admin/` only hides entries on screen. The next phase adds real privacy and in-browser editing, while hosting stays on GitHub Pages.

## Target

- **Hosting:** GitHub Pages, unchanged. No Firebase Hosting, no server.
- **Sign-in:** Firebase Authentication with Google. The owner account is `mazine_suliman@alumni.brown.edu`.
- **Data:** Cloud Firestore (Standard edition) on the free Spark plan.
- **Images:** the existing `img/` files and permitted image URLs. Cloud Storage needs the paid Blaze plan, so private photo uploads are deferred.

## Data model

| Collection | Who can read | Contents |
|---|---|---|
| `master/{id}` | owner only | full records: identity, wearing periods, memories, private flag |
| `public/{opaqueId}` | everyone | sanitized records; a private entry is `{ year, placeholder: true }` with an opaque ID |

- An owner edit writes `master` and `public` in one batch. When an entry becomes private, the batch deletes its identifying fields from `public`.
- Private records are cached in memory only.
- On sign-out, the app unsubscribes listeners and clears private state.

## Security rules (sketch)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isOwner() { return request.auth != null && request.auth.uid == "<OWNER_UID>"; }
    match /public/{id} { allow read: if true; allow write: if isOwner(); }
    match /master/{id} { allow read, write: if isOwner(); }
    match /{path=**}   { allow read, write: if false; }
  }
}
```

The rules enforce access in Firestore itself, not in the frontend. Any other Google account that signs in can neither read `master` nor write anything.

## Setup steps (owner)

1. Create the Firebase project at https://console.firebase.google.com while signed in as the owner account. Brown's Workspace admin may block project creation. If so, create the project with a personal Gmail and still allowlist the alumni account's UID.
2. Turn **Google Analytics off** and stay on the **Spark** plan.
3. Add a web app named `Olfazine web`. Leave **Firebase Hosting unchecked**. Copy the `firebaseConfig` block. It is not a secret; the rules enforce access.
4. Go to **Authentication → Sign-in method → Google → Enable**. Then open **Settings → Authorized domains** and add `mazines.github.io`.
5. Go to **Firestore → Create database**. Choose the Standard edition, a location (permanent), and **production mode** (deny by default).
6. Sign in once from a local page served over `http://localhost`, not `file://`. Copy the **User UID** from Authentication → Users into the rules, then publish them under **Firestore → Rules**.

## Build steps

1. Add the Firebase modular web SDK from the official CDN. Keep the config in `index.html`. Never commit a service-account key.
2. Write a one-off, owner-run seed script that loads `mockups/shared/data.js` into `master` and writes sanitized `public` documents.
3. Change `core.js` to read from Firestore, not `data.js`. Then remove the private names from the shipped `data.js`, or ship no data file at all.
4. Add a discreet **Owner sign-in** control and an editor: add or edit a fragrance, wearing periods, memories, private toggle, and a **Preview public view** control.
5. Test the rules with the Firebase emulator for an anonymous visitor, an unrelated signed-in user and the owner. Cover direct reads, list queries, writes and private-to-public transitions.
6. Scan the deployed output for private names, and check that sign-out clears the owner view.

## Note on git history

Before this phase, private names were committed in `data.js`, so they stay in public git history. If that matters later, rewrite history or start a fresh repo when Firebase lands.
