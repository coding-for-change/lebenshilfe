// Seeds the public demo instance (demo-lebenshilfe.codingforchange.com). Runs on
// every container start: the compose template of infra-v2's role
// `lebenshilfe_demo` runs it before the server (see docs-internal/DEMO.md).
//
// Only the rows this dataset owns are replaced (see wipe() in seed/engine.ts),
// so a real person invited into the demo keeps their account across resets.
import { seedMain } from "./seed/engine";
import { hamburgDemoDataset } from "./seed/dataset-hamburg-demo";

if (process.env.ALLOW_DEMO_SEED !== "true") {
  // The demo dataset deletes and recreates its own rows. That is harmless on the
  // demo instance and catastrophic if someone points this at production by
  // mistake, so it refuses to run without an explicit opt-in that only the
  // demo's compose template in infra-v2 sets.
  console.error(
    "Refusing to seed: set ALLOW_DEMO_SEED=true to confirm this is the demo database.",
  );
  process.exit(1);
}

void seedMain(hamburgDemoDataset);
