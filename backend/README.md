# Backend configuration

Staff invitations require SMTP settings in the backend environment. Copy the
SMTP variables from `.env.example` into the backend `.env` file and provide
values from your mail provider. Use port `587` with `SMTP_SECURE=false` or port
`465` with `SMTP_SECURE=true`. `CLIENT_URL` must be the public frontend origin.

When an administrator adds a staff member, the invitation is sent to that
member's email address. Invitation links expire after 48 hours and can be
resent from Staff Management. The staff member chooses their own password,
then enters the clinic workspace under the tenant that issued the invitation.

## Offline work and synchronization

Offline support is intentionally limited to restoring the session of a user
who has already signed in on that device, registering new patients, and saving
vitals-only medical-record encounters for existing patients. First-time sign-in
still requires a network connection. The patient list needed to select a
patient for vitals can be served from encrypted IndexedDB cache scoped to the
signed-in user's tenant and account; other API reads are not cached for offline
use.

When connectivity returns, supported queued requests are sent in order. The
sync status and **Sync now** control are in the app header so they do not cover
page content. Automatic retry runs while the app is open and when it is
reopened; this release does not rely on Background Sync, which is not
consistently available across PWA browsers. A change remains pending until the
backend confirms it.

Authenticated mutations sent by the frontend include an idempotency key. The
backend stores the result per tenant and user so a retry after a lost response
does not repeat the same request. A request that may have started but whose
result cannot be safely confirmed is marked for review and is not retried
automatically. This currently protects retries of the same request; it does not
yet detect concurrent edits from another staff member. Consultation notes,
diagnoses, treatment plans, patient updates, and all other workflow changes
remain online-only.

Offline access is best-effort browser storage, not a guarantee: browser or
device storage can be cleared or evicted, cached reads may be stale, and
permissions or account status cannot be revalidated until reconnecting. The
encrypted data is protected within the application origin, but this does not
protect a device compromised by malware or an application-origin script
injection. Keep devices locked and use HTTPS in production. Authentication,
staff invitations, role changes, subscription actions, and clinic settings
still require a live connection. Requests needing review must be reconciled
with the backend before staff repeat the action. This is an initial offline
foundation, not yet a complete offline workflow for every clinic module.
