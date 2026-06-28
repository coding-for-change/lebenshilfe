import { logger } from "@/lib/logger";

export async function onRequestError(
  err: Error,
  request: unknown,
  context: unknown,
) {
  logger.error(
    {
      err,
      request: {
        method: (request as { method?: string })?.method,
        url: (request as { url?: string })?.url,
      },
      context,
    },
    "Global Request Error",
  );
}
