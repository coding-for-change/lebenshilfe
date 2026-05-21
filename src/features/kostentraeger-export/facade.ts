import {
  ExportRequestSchema,
  type ExportDay,
  type ExportDocument,
  type ExportMonth,
  type ExportRequest,
} from "./schemas";
import {
  findChildForExport,
  listWorkEventsForChildInRange,
  type ExportWorkEvent,
} from "./services";
import {
  dateLabelShort,
  daysInMonth,
  durationHours,
  isWeekend,
  monthLabel,
  roundHours,
  weekdayShort,
} from "./format";

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/** Inclusive list of `{ year, month }` markers between two months. */
function monthsInRange(
  from: { year: number; month: number },
  to: { year: number; month: number },
): { year: number; month: number }[] {
  const result: { year: number; month: number }[] = [];
  let year = from.year;
  let month = from.month;
  while (year < to.year || (year === to.year && month <= to.month)) {
    result.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return result;
}

/** Builds one month sheet, listing every calendar day. */
function buildMonth(
  year: number,
  month: number,
  events: ExportWorkEvent[],
): ExportMonth {
  const days: ExportDay[] = [];
  let directHours = 0;

  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    const date = utcDate(year, month, day);
    const dayEvents = events.filter(
      (event) =>
        event.date.getUTCFullYear() === year &&
        event.date.getUTCMonth() + 1 === month &&
        event.date.getUTCDate() === day,
    );

    const ranges: string[] = [];
    const assistantNames = new Set<string>();
    const notes: string[] = [];
    let hours = 0;

    for (const event of dayEvents) {
      if (event.startTime && event.endTime) {
        ranges.push(`${event.startTime} - ${event.endTime}`);
        hours += durationHours(event.startTime, event.endTime);
      }
      if (event.user?.name) assistantNames.add(event.user.name);
      const note = event.note?.trim();
      if (note) notes.push(note);
    }

    hours = roundHours(hours);
    directHours += hours;

    days.push({
      iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      dateLabel: dateLabelShort(date),
      weekday: weekdayShort(date),
      isWeekend: isWeekend(date),
      uhrzeit: ranges.join(", "),
      hours,
      schulbegleiter: [...assistantNames].join(", "),
      bemerkungen: notes.join(" | "),
    });
  }

  directHours = roundHours(directHours);

  return {
    year,
    month,
    label: monthLabel(year, month),
    days,
    directHours,
    indirectHours: 0,
    totalHours: directHours,
  };
}

export const CostBearerExportFacade = {
  /**
   * Builds the Einsatznachweis document(s) for a child and period. Returns a
   * single document for `combined` scope, or one document per Schulbegleiter
   * for `per-assistant` scope.
   *
   * Free of HTTP/session context so it can be reused from scripts or CRON.
   */
  async build(input: ExportRequest): Promise<ExportDocument[]> {
    const request = ExportRequestSchema.parse(input);

    const child = await findChildForExport(request.childId);
    if (!child) {
      throw new Error("Kind nicht gefunden.");
    }
    const childName = `${child.firstName} ${child.lastName}`.trim();

    const months = monthsInRange(request.from, request.to);
    const rangeStart = utcDate(request.from.year, request.from.month, 1);
    const rangeEnd = utcDate(
      request.to.month === 12 ? request.to.year + 1 : request.to.year,
      request.to.month === 12 ? 1 : request.to.month + 1,
      1,
    );

    const events = await listWorkEventsForChildInRange(
      request.childId,
      rangeStart,
      rangeEnd,
    );

    if (request.scope === "combined") {
      return [
        {
          childName,
          schulbegleiterName: null,
          months: months.map((marker) =>
            buildMonth(marker.year, marker.month, events),
          ),
        },
      ];
    }

    // per-assistant: group entries by the Schulbegleiter who logged them.
    const byAssistant = new Map<
      string,
      { name: string; events: ExportWorkEvent[] }
    >();
    for (const event of events) {
      const entry = byAssistant.get(event.userId) ?? {
        name: event.user?.name ?? "Unbekannt",
        events: [],
      };
      entry.events.push(event);
      byAssistant.set(event.userId, entry);
    }

    if (byAssistant.size === 0) {
      throw new Error(
        "Im gewählten Zeitraum gibt es keine Einträge für dieses Kind.",
      );
    }

    return [...byAssistant.values()]
      .sort((a, b) => a.name.localeCompare(b.name, "de"))
      .map((assistant) => ({
        childName,
        schulbegleiterName: assistant.name,
        months: months.map((marker) =>
          buildMonth(marker.year, marker.month, assistant.events),
        ),
      }));
  },
};
