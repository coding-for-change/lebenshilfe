// Local development seed. Data lives in scripts/seed/dataset-muenchen.ts; the
// insert logic is shared with the demo seed in scripts/seed/engine.ts.
import { seedMain } from "./seed/engine";
import { muenchenDataset } from "./seed/dataset-muenchen";

void seedMain(muenchenDataset);
