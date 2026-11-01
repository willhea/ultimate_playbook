# Ultimate Animations

Tools and videos for teaching ultimate frisbee. The main code is the Play Animator web
app in `play-animator/`. The specs and research are in `docs/`.

**Start with [`docs/plan.md`](docs/plan.md)**: it has where things stand, what to build
next (with designs), the coach's decisions, and the gotchas we've hit.

## Conventions
- The user coaches ultimate and reviews from a phone. Explain in plain language, and look at
  `npm run screenshots` output after changing a play, because the user can't easily check it.
- Use the ultimate terms as defined in [`docs/glossary.md`](docs/glossary.md). Write "open side" and
  "break side". The coach says "force side" for the open side, but sources disagree, so don't write it.
- Coaching decisions in `docs/00-open-questions.md` are rules, e.g. vertical-stack cuts come
  from the back (break-side and end-zone cuts come from the front).
- Run `npm run check` in `play-animator/` before every push. Logic goes in unit tests;
  browser tests cover one user journey each; no screenshot comparisons. See the testing
  section of `play-animator/README.md`.
- Every built-in play must pass `validatePlay()` (`src/model/validate.ts`).
- Work on the branch named in the session instructions. Commit and push when a step lands.
