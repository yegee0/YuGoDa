# Bug & Improvement Sweep — Locked Plan

**Date:** 2026-04-20
**Status:** Locked; ready for execution
**Prereq:** 4 subagents in `.claude/agents/` (`project-manager`, `backend-engineer`, `frontend-engineer`, `security-reviewer`). Session must be restarted after they were added so Claude Code picks them up.

---

## Locked design decisions

### AI & Chat
- **Remove** `apps/frontend/src/components/FoodChatbot.tsx` (the customer-facing AI chat widget), its parent mount(s), its `chatbot_*` i18n keys, and the unused backend endpoints `POST /api/chat` + `GET /api/chat/history` in `AiChatController.java`.
- **Keep** `AiRecommendations.tsx` + backend `GET /api/chat/recommendations` + `AiChatService.java` recommendation logic. This is "YuGoDa Assistant."
- The "Live Chat" button in `CustomerLayout.tsx` is rewired to the new Live Chat feature (below), not the old chatbot.

### Live Chat (new feature — customer ↔ admin direct, no AI middleman)
- **Who:** logged-in customers only.
- **Session model:** fresh each time; no thread persistence for the customer.
- **Admin presence (3 states):**
  - `Available | Away | Offline`
  - Heartbeat (admin panel pings every 30 s) drives `Offline`.
  - Manual toggle switches between `Available` and `Away`.
  - **Away = graceful.** Admin keeps their active chat until it ends; gets no new assignments; excluded from the customer-visible "admins online" count.
  - **Offline (heartbeat timeout or explicit logout) = hard disconnect.** Active chat auto-fails-over to the next Available admin.
- **Assignment:** round-robin among Available admins. Strict 1:1 concurrency (admin cannot handle two chats). Automatic failover on Offline (not on Away).
- **Queue:** customer sees position ("X people ahead of you"). If zero admins Available, show "no admin available" and block send.
- **Notifications:** both directions. Customer notified when admin replies. Admin notified for new chat requests (Available admins only).
- **End Conversation:** either party can click.
  - **Admin archives** → conversation kept with `status: solved | still_investigating`.
  - **Customer soft-deletes** → content hidden from customer UI; customer retains a receipt showing conversation ID + admin-set status.
- **Transport:** 2-second polling. Upgradeable to SSE or Firebase RTDB later.
- **New entities:** `ChatConversation`, `ChatMessage`. New endpoints on a `ChatController` with role-gated access.

### Session role-switch (#9)
- Sign-in pages stop auto-redirecting when a *different* role is already logged in (only redirect when same-role logged in).
- On successful new-role login, sign out all other Firebase project sessions first.
- `ProtectedRoute` role-gating stays as-is.

### Mock → DB (#10)
- Delete `apps/frontend/src/lib/mockData.ts`; migrate consumers to `lib/api.ts`.
- Rewrite `apps/backend/src/main/java/yugoda/init/DataInitializer.java` with:
  - **15 restaurants**, plausible Turkish names (mixed categories: Restaurant, Bakery, Grocery, Cafe).
  - Turkish descriptions.
  - Coordinates within ~2 km of Yeditepe University / Kayışdağı Cad., Ataşehir.
  - Realistic operating hours per category.
  - **4 bags per restaurant → 60 bags total.**
  - `createdAt` staggered over last 30 days.
  - Unsplash placeholder images.
- Emails: `<slugified-name>@partner.com`, password `partner`.
- **Human creates the 15 Firebase partner accounts manually** via Firebase Console (Option A). Backend seed only inserts DB rows.

### Admin action menu (#22)
- Four actions: **Suspend, Ban, View Orders, Contact Info** (email + phone only — NO ADDRESS).
- New backend endpoints: `POST /api/users/{id}/suspend`, `POST /api/users/{id}/ban`.

### Notifications (#17)
- In-app only, no external push.
- Emit on every order status transition (pending → confirmed → preparing → ready → picked_up → delivering → delivered; + cancelled at any step).
- Click-through → recipient's orders page.
- Diagnose existing wiring first — the backend may already emit; the frontend polling may be the bug.

### Translation (#8, #18, #2)
- Wrap every hardcoded English string in `pages/admin/` (~5 files) and `pages/restaurant/` (~5 files) with `t()`.
- Add ~300 new keys to `lib/i18n.ts` (both `en` and `tr`).
- Modernize `pages/legal/PrivacyPage.tsx`, `TermsPage.tsx`, `AboutPage.tsx` — redesigned layout + full i18n.

### Checkout palette (#19)
- Frontend-engineer prepares **2 palette options**, previewed against `screenshots/#8_1.png` and `screenshots/#8_2.png`.
- User picks before commit. No unilateral palette change.

### Turkish reviews on welcome (#5)
- Frontend-only. Pull existing reviews from DB (`GET /api/reviews`), filter to Turkish, render with author first-name near the "turn surplus into revenue" block.

### Map migration (#11)
- Rewrite `LocationPickerMap.tsx` and `LeafletMap.tsx` on `@vis.gl/react-google-maps`.
- Remove `leaflet` + `react-leaflet` from `package.json`.
- Migrate the direct geocoding `fetch()` call into `lib/api.ts`.

---

## Execution plan

### Wave 1 — Quick frontend wins (one PR, zero open questions)
Kickoff: `@frontend-engineer`, batched.
1. Welcome #1 — Mobile "How it Works" layout
2. Welcome #3 — Remove "Coming Soon" text
3. Welcome #4 — Footer "Browse Bags" design
4. Welcome #7 — Bag section icon → green bag logo
5. Discover #12 — Orange side panel color → lighter (`lib/constants.ts`)
6. Discover #13 — Search bar mobile visibility
7. Discover #14 — Ticket creation color scheme
8. Admin #20 — Role filter on `/customers` (UI dropdown + client-side filter; backend `?role=` deferred)
9. Admin #21 — Joined Date column (likely already returned by `UserController`)
10. Business #23 — "Under review" friendly message instead of "Error"
11. General #28 — Logo color standardized in `lib/constants.ts`

Verification: `npx tsc --noEmit` in `apps/frontend/` clean.

### Wave 2 — Bug hunts (diagnose → confirm scope → fix)
Kickoff: `@backend-engineer` first on each; frontend follow-up where needed. `security-reviewer` on #25.
- Welcome #6 — "47 9+" visibility bug (screenshot helpful; specialist will search if absent)
- Discover #15 — Ticket submission broken for customers
- Business #24 — First/Last name changes not saving
- Business #25 — Google Login not populating email/name [**security-gated**]
- Business #26 — Restaurant profile Address/Description not displayed
- Notification diagnosis (part of #17)

### Wave 3 — Scoped features (each via `@project-manager` sub-plan, then specialists)
Suggested order:
1. Session role-switch fix (#9)
2. Mock → DB seed (#10) — human creates Firebase partner accounts in parallel
3. Remove FoodChatbot (preparation for #16)
4. Notifications wire-through (#17 build part)
5. Live Chat (#16 + #27) — depends on 3 + 4
6. i18n sweep (#8 + #18 + #2) — parallelizable with 5
7. Map migration (#11)
8. Checkout palette (#19)
9. Admin action menu (#22)
10. Turkish reviews on welcome (#5)

Each Wave 3 item: `@project-manager` produces a per-item plan → user approves → specialists execute.

### Security gates (`security-reviewer` before merge)
#9 • #10 • #16 + #27 • #17 • #25

---

## Open items (non-blocking)
- Screenshot / page path for Welcome #6 "47 9+" bug — if absent, specialist will search.
- CLAUDE.md addendum (routing rules, schema correction, known tech debt) — previously drafted, not yet appended. Apply per team preference.

---

## How to execute (new session)
1. Restart Claude Code in this directory so the 4 agent files are loaded.
2. First prompt: "Start Wave 1 per `BUG_SWEEP_PLAN.md`."
3. Main conversation delegates the batch to `@frontend-engineer`.
4. Specialist returns structured summary (`SUMMARY / CHANGES / VERIFICATION / FLAGS_FOR_MANAGER`).
5. After Wave 1 merges, move to Wave 2 or Wave 3 items in order.
6. For every Wave 3 item: `@project-manager` plan → review → specialists execute.
