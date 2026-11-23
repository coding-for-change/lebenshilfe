// Fails when a Server Action is called without runAction().
//
// Server Actions return an ActionResult instead of throwing (see
// src/lib/server-action.ts). A bare `await fooAction()` would ignore a refused
// request ({ ok: false }) and carry on as if it had succeeded, so every call of
// an identifier imported from an `actions` module must be the direct argument
// of runAction(...). Using an action in a type (`typeof fooAction`) is fine.
// Passing an action on as a value is only allowed where the receiver calls it
// through runAction itself (ALLOWED_VALUE_USES).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const ROOT = "src";
const ALLOWED_VALUE_USES = new Set([
  // MapsConsentProvider calls onSetConsent through runAction (src/lib/maps/maps-consent.tsx).
  "src/app/layout.tsx:setMapsConsentAction",
]);

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === "generated" ? [] : files(path);
    return /\.(ts|tsx)$/.test(name) && name !== "actions.ts" ? [path] : [];
  });
}

const problems = [];
for (const file of files(ROOT)) {
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const actions = new Set();
  for (const st of sf.statements) {
    if (
      !ts.isImportDeclaration(st) ||
      !/(^|\/)actions$/.test(st.moduleSpecifier.text)
    )
      continue;
    const nb = st.importClause?.namedBindings;
    if (st.importClause?.isTypeOnly || !nb || !ts.isNamedImports(nb)) continue;
    for (const el of nb.elements) if (!el.isTypeOnly) actions.add(el.name.text);
  }
  if (actions.size === 0) continue;
  (function visit(node) {
    if (ts.isIdentifier(node) && actions.has(node.text)) {
      const parent = node.parent;
      const where = `${relative(".", file)}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;
      if (ts.isImportSpecifier(parent) || ts.isTypeQueryNode(parent)) {
        // import or `typeof fooAction`: fine
      } else if (ts.isCallExpression(parent) && parent.expression === node) {
        const outer = parent.parent;
        const wrapped =
          ts.isCallExpression(outer) &&
          ts.isIdentifier(outer.expression) &&
          outer.expression.text === "runAction" &&
          outer.arguments[0] === parent;
        if (!wrapped)
          problems.push(
            `${where}  ${node.text}(…) is not wrapped in runAction(…)`,
          );
      } else if (
        !ALLOWED_VALUE_USES.has(`${relative(".", file)}:${node.text}`)
      ) {
        problems.push(
          `${where}  ${node.text} is passed on as a value; call it through runAction(…)`,
        );
      }
    }
    ts.forEachChild(node, visit);
  })(sf);
}

if (problems.length > 0) {
  console.error(
    "Server Action calls must go through runAction():\n" +
      problems.map((p) => `  - ${p}`).join("\n"),
  );
  process.exit(1);
}
console.log("All Server Action calls go through runAction().");
