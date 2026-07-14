import { logger } from "@/lib/logger";

export async function onRequestError(
  err: Error,
  request: unknown,
  context: unknown,
) {
  const rawUrl = (request as { url?: string })?.url;
  logger.error(
    {
      err,
      request: {
        method: (request as { method?: string })?.method,
        // path only — the query string may carry reset/invite tokens or ids
        path: rawUrl ? rawUrl.split("?")[0] : undefined,
      },
      context,
    },
    "Global Request Error",
  );
}
