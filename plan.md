# Plan / backlog

Running list of things intentionally deferred — not yet scheduled, just captured so
they aren't lost.

## Better detail-page UX per collection

Current detail pages are functional but plain. Worth a real design pass per
collection, matching the differentiated card treatments already in place
(`AGENTS.md` has the card/detail conventions).

- **Ressources**: the biggest opportunity. Should feel like a proper media page, not
  an article with an embed bolted on.
- **Podcast player**: a persistent "now playing" bar so a visitor can start a podcast
  episode and keep browsing the rest of the site while it plays, instead of playback
  stopping on navigation.
  - This is a real architectural decision, not just a component: this site is
    fully static, multi-page (no client-side router), so audio normally stops dead
    on every navigation. Making it persist means either (a) introducing a small
    persistent shell/router for at least the player bar, or (b) accepting a
    simpler "continue where you left off" via `localStorage` (save
    position/episode, auto-resume if the visitor lands back on a page with the
    player), which is much less work but not truly gapless across navigation.
    Decide which trade-off is acceptable before building.
  - Should surface the Media Session API (lock-screen/OS media controls) once a
    real player exists.
- Other collections (actualités, événements, personnes, groupes, publications,
  projets) could each get a similar detail-page pass, lower priority than
  ressources/podcasts.
