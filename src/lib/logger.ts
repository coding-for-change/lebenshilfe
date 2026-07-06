import pino from "pino";

const isBrowser = typeof window !== "undefined";

// Defense-in-depth: strip these PII/secret field names from server logs (shipped
// to Alloy) even if a future call site passes them. Targeted names, not a blanket
// "name", so useful non-PII keys like err.name survive.
const REDACT_PATHS = [
  "email",
  "firstName",
  "lastName",
  "name",
  "childName",
  "childNameText",
  "supervisorName",
  "schulbegleiterName",
  "subjectName",
  "note",
  "bemerkung",
  "bemerkungen",
  "bescheid",
  "zvNeuNote",
  "address",
  "password",
  "token",
  "signaturePngBase64",
  "signatureKey",
  "*.email",
  "*.firstName",
  "*.lastName",
  "*.childName",
  "*.childNameText",
  "*.note",
  "*.bemerkung",
  "*.bescheid",
  "*.address",
  "*.password",
  "*.token",
  "*.signaturePngBase64",
  "err.meta",
  "error.meta",
];

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
        redact: { paths: REDACT_PATHS, remove: true },
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
