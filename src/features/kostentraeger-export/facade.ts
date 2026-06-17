import {
  ExportRequestSchema,
  type ExportDay,
  type ExportDocument,
  type ExportMonth,
  type ExportRequest,
} from "./schemas";
import {
  findChildForExport,
  listEventsForChildInRange,
  type ExportEvent,
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

function eventDuration(event: ExportEvent): number {
  if (!event.startTime || !event.endTime) return 0;
  return durationHours(event.startTime, event.endTime);
}

/** Total hours of events of a given type that fall in a given calendar month. */
function sumHoursInMonth(
  events: ExportEvent[],
  year: number,
  month: number,
  type: "WORK" | "INDIRECT",
): number {
  let total = 0;
  for (const event of events) {
    if (
      event.type === type &&
      event.date.getUTCFullYear() === year &&
      event.date.getUTCMonth() + 1 === month
    ) {
      total += eventDuration(event);
    }
  }
  return total;
}

/**
 * Distributes `total` across slots in proportion to `weights`, with each
 * share rounded to a multiple of 0.5. Uses the largest-remainder method so
 * the rounded shares still sum to `total` (when `total` lies on the 0.5
 * grid; otherwise the sum lands on the nearest 0.5).
 */
function distributeToHalfPreserveSum(
  total: number,
  weights: number[],
): number[] {
  if (weights.length === 0) return [];

  const sumWeights = weights.reduce((sum, w) => sum + w, 0);
  const raw =
    sumWeights > 0
      ? weights.map((w) => total * (w / sumWeights))
      : weights.map(() => total / weights.length);

  const floors = raw.map((share) => Math.floor(share * 2) / 2);
  const sumFloors = floors.reduce((sum, value) => sum + value, 0);
  const gridded = Math.round(total * 2) / 2;
  const extras = Math.max(0, Math.round((gridded - sumFloors) * 2));
  if (extras === 0) return floors;

  const order = raw
    .map((share, index) => ({ index, remainder: share - floors[index] }))
    .sort((a, b) => b.remainder - a.remainder);

  const result = [...floors];
  for (let k = 0; k < extras && k < order.length; k += 1) {
    result[order[k].index] += 0.5;
  }
  return result;
}

/**
 * Per-month, per-Schulbegleiter share of the auffüllen budget. Weighted by
 * each assistant's logged INDIRECT hours; falls back to logged WORK hours;
 * finally an equal split. Rounded to 0.5 via largest-remainder so the shares
 * still sum to the approved indirect target.
 */
function monthlyFillTargets(
  fillTarget: number | null,
  year: number,
  month: number,
  assistants: { events: ExportEvent[] }[],
): (number | null)[] {
  if (fillTarget == null || fillTarget <= 0) {
    return assistants.map(() => fillTarget);
  }

  const indirect = assistants.map((a) =>
    sumHoursInMonth(a.events, year, month, "INDIRECT"),
  );
  const totalIndirect = indirect.reduce((sum, hours) => sum + hours, 0);

  let weights: number[];
  if (totalIndirect > 0) {
    weights = indirect;
  } else {
    const direct = assistants.map((a) =>
      sumHoursInMonth(a.events, year, month, "WORK"),
    );
    const totalDirect = direct.reduce((sum, hours) => sum + hours, 0);
    weights = totalDirect > 0 ? direct : assistants.map(() => 1);
  }

  return distributeToHalfPreserveSum(fillTarget, weights);
}

/**
 * Builds one month sheet, listing every calendar day.
 *
 * The "Indirekte Leistung" row combines real logged INDIRECT hours with the
 * optional "auffüllen" safety net: it never reports less than what was logged,
 * and (when `fillTarget` is set) tops up to the approved indirect-service
 * hours from the Bescheid.
 */
function buildMonth(
  year: number,
  month: number,
  events: ExportEvent[],
  fillTarget: number | null,
): ExportMonth {
  const days: ExportDay[] = [];
  let directHours = 0;
  let loggedIndirectHours = 0;

  // Sum INDIRECT hours across the whole month up front; they don't appear in
  // day rows, only in the "Indirekte Leistung" summary line.
  for (const event of events) {
    if (
      event.type === "INDIRECT" &&
      event.date.getUTCFullYear() === year &&
      event.date.getUTCMonth() + 1 === month
    ) {
      loggedIndirectHours += eventDuration(event);
    }
  }
  loggedIndirectHours = roundHours(loggedIndirectHours);

  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    const date = utcDate(year, month, day);
    const dayEvents = events.filter(
      (event) =>
        event.type === "WORK" &&
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
      signatureKey: dayEvents[0]?.signatureKey ?? null,
    });
  }

  directHours = roundHours(directHours);
  const indirectHours = roundHours(
    Math.max(loggedIndirectHours, fillTarget ?? 0),
  );

  return {
    year,
    month,
    label: monthLabel(year, month),
    days,
    directHours,
    indirectHours,
    totalHours: roundHours(directHours + indirectHours),
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

    // When "auffüllen" is on, ensure the "Indirekte Leistung" row reaches the
    // child's approved indirect-service hours from the Bescheid.
    const fillTarget = request.fillWithIndirect
      ? (child.approvedIndirectHours ?? 0)
      : null;

    const months = monthsInRange(request.from, request.to);
    const rangeStart = utcDate(request.from.year, request.from.month, 1);
    const rangeEnd = utcDate(
      request.to.month === 12 ? request.to.year + 1 : request.to.year,
      request.to.month === 12 ? 1 : request.to.month + 1,
      1,
    );

    const events = await listEventsForChildInRange(
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
            buildMonth(marker.year, marker.month, events, fillTarget),
          ),
        },
      ];
    }

    // per-assistant: group entries by the Schulbegleiter who logged them.
    const byAssistant = new Map<
      string,
      { name: string; events: ExportEvent[] }
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

    const sortedAssistants = [...byAssistant.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "de"),
    );

    // Distribute the auffüllen budget across all assistants per month once,
    // so the rounded per-sheet shares still sum to the approved target.
    const targetsByMonth = months.map((marker) =>
      monthlyFillTargets(
        fillTarget,
        marker.year,
        marker.month,
        sortedAssistants,
      ),
    );

    return sortedAssistants.map((assistant, assistantIndex) => ({
      childName,
      schulbegleiterName: assistant.name,
      months: months.map((marker, monthIndex) =>
        buildMonth(
          marker.year,
          marker.month,
          assistant.events,
          targetsByMonth[monthIndex][assistantIndex],
        ),
      ),
    }));
  },
};
