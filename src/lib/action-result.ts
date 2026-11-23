// What every Server Action returns. Server Actions never throw for expected
// failures: in production Next.js replaces the message of a thrown error with
// a generic, English placeholder before it reaches the browser (and the HTTP
// 500 makes the "new version available" notice appear), so a user would never
// see why something was refused. Returning the message as a value keeps it.
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * An expected, user-facing failure: a business rule or a refused request
 * ("Es existiert bereits ein Benutzer mit dieser E-Mail.").
 *
 * Its message is shown to the user as is, so it must be written for them:
 * German, actionable, and free of internals or personal data. Every other
 * error (database, bugs) stays generic on the client on purpose.
 */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

/** The data type of a wrapped Server Action, e.g. ActionData<typeof listFooAction>. */
export type ActionData<
  F extends (...args: never[]) => Promise<ActionResult<unknown>>,
> = Extract<Awaited<ReturnType<F>>, { ok: true }>["data"];
