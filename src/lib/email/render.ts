import { render } from "@react-email/render";
import type { ReactElement } from "react";

export async function renderEmail(element: ReactElement) {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
