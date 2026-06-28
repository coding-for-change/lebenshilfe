import pino from "pino";

const isBrowser = typeof window !== "undefined";

export const logger = pino({
  level: process.env.NEXT_PUBLIC_LOG_LEVEL || "info",
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  ...(isBrowser
    ? {
        browser: {
          asObject: true,
        },
      }
    : {
        transport:
          process.env.LOG_PRETTY === "true"
            ? {
                target: "pino-pretty",
                options: {
                  colorize: true,
                },
              }
            : undefined,
      }),
});

export type BusinessEvent =
  | "TIMESHEET_CREATED"
  | "MONTHLY_REPORT_SUBMITTED"
  | "CHILD_CREATED"
  | "CHILD_ASSIGNED"
  | "SCHOOL_ASSISTANT_CREATED"
  | "COST_BEARER_CREATED"
  | "WORKSHOP_CREATED"
  | "USER_INVITED";

export function logBusinessEvent(
  event: BusinessEvent,
  data: Record<string, unknown> = {},
) {
  logger.info(
    {
      isBusinessEvent: true,
      event,
      ...data,
    },
    `Business Event: ${event}`,
  );
}
