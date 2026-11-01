import fc from 'fast-check';

// Property tests use a fixed seed by default, so a run that passes keeps passing
// (and CI never fails by chance). FC_SEED=random explores new cases;
// FC_SEED=<number> replays a failure fast-check reported.
const seed = process.env.FC_SEED;
if (seed !== 'random') fc.configureGlobal({ seed: seed ? Number(seed) : 20261101 });
