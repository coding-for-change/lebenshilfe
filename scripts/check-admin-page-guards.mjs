// Fails when a page under src/app/admin does not check admin access itself.
//
// The admin layout's requireAdmin() is not enough: on client-side navigation
// Next.js renders only the route segments below the shared layout, and the
// client says which segments it already has. A crafted request can therefore
// reach an admin page without the layout's check ever running. Each page must
// call requireAdmin() (or requireOwner()) itself before loading any data.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src/app/admin";
const GUARD = /await\s+require(Admin|Owner)\(\)/;

function pages(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name === "page.tsx" || name === "page.ts" ? [path] : [];
  });
}

const missing = pages(ROOT).filter((p) => !GUARD.test(readFileSync(p, "utf8")));
if (missing.length > 0) {
  console.error(
    "These admin pages do not call `await requireAdmin()` themselves:\n" +
      missing.map((p) => `  - ${p}`).join("\n"),
  );
  process.exit(1);
}
console.log(`All ${pages(ROOT).length} admin pages check admin access.`);
