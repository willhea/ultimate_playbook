# Ultimate Playbook

Tools and videos for teaching ultimate frisbee. The main code is the Ultimate Playbook web
app in `app/`. The specs and research are in `docs/`.

**Start with [`docs/plan.md`](docs/plan.md)**: it has where things stand, what to build
next (with designs), the coach's decisions, and the gotchas we've hit.

## Conventions
- The user coaches ultimate. Explain in plain language, and look at `npm run screenshots`
  output after changing a play. Drafts are reviewed on a computer, with a phone preview for
  what teammates will see (decision #22); the user sometimes reviews from a phone.
- Use the ultimate terms as defined in [`docs/glossary.md`](docs/glossary.md). Write "open side" and
  "break side". The coach says "force side" for the open side, but sources disagree, so don't write it.
- Coaching decisions in `docs/00-open-questions.md` are rules, e.g. vertical-stack cuts come
  from the back (break-side and end-zone cuts come from the front).
- Run `npm run check` in `app/` before every push. Logic goes in unit tests;
  browser tests cover one user journey each; no screenshot comparisons. See the testing
  section of `app/README.md`.
- Every built-in play must pass `validatePlay()` (`src/model/validate.ts`).
- Plays from outside (share links, imports, saved data) go through `readPlay()` (`src/model/sanitize.ts`).
  A new field on `Play` or `Frame` must be added there, or it's dropped on share and reload.
- **`main` is protected; every change goes through a pull request.** Work on the branch named in
  the session instructions, commit and push when a step lands, and open a pull request into `main`
  (fill in `.github/pull_request_template.md`). CI must pass; the coach merges. Never push to `main`.
- After a pull request merges, start the next piece of work from the latest `main`.
