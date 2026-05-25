# Feature: Vertretung (Substitution Management)

## Summary

The **Vertretung** feature allows admins to mark a specific calendar day as a substitution day — meaning a different Schulbegleiter (SB) steps in for the originally assigned SB for a particular child. The substitute SB then sees the assignment in their own calendar and can log a timesheet entry (Eintrag) for it.

---

## Business Context

Sometimes a Schulbegleiter cannot attend on a specific day and another colleague covers for them. This needs to be:

1. Recorded centrally by the admin so the right person is informed
2. Visible to the substitute SB in their day, week, and month views
3. Usable as the basis for a timesheet entry (Eintrag) by the substitute

---

## Data Model

A new `ChildVertretung` table stores date-specific substitutions:

| Field             | Type      | Notes                                          |
|-------------------|-----------|------------------------------------------------|
| `id`              | cuid      | Primary key                                    |
| `childId`         | FK        | The child being accompanied                    |
| `originalUserId`  | FK (null) | The original SB (currently not set via UI)     |
| `substituteUserId`| FK        | The SB who covers for that day                 |
| `date`            | Date      | The specific date (not recurring)              |
| `startTime`       | String    | Derived from the child's Stundenplan           |
| `endTime`         | String    | Derived from the child's Stundenplan           |

The time span is always **auto-derived** from the child's Stundenplan (earliest `startTime` → latest `endTime` for that weekday). It cannot be entered or edited manually.

---

## Feature Behaviour

### Admin (Kinder-Kalender)

- In the weekly calendar, each day cell has a `+` button that opens a dropdown with: **Zuweisung**, **Vertretung**, **Krankheit**
- The **Vertretung** option is only shown when:
  - The child has at least one **Zuweisung** (Assignment) on that weekday
  - There is **no existing Vertretung** already recorded for that specific date
- On selecting Vertretung, the admin picks the substitute SB from a combobox. The time is shown read-only, derived from the Stundenplan
- After saving, the original SB chip is shown with a **strikethrough / greyed-out** style. The amber **Vertretung** chip appears below it
- Clicking the amber chip opens an edit popover where **only the substitute SB** can be changed (time is not editable)
- The X button on the chip deletes the Vertretung

### Substitute SB (Timesheet)

- **Tag-Ansicht**: An amber card appears (similar to the Krankheit card) showing "Vertretung", the child's name, and the time
- **Wochen-Ansicht**: An amber time block appears in the week grid at the correct time position
- **Monat-Ansicht (Lehrer Ansicht)**: An amber dot appears on substitute days in the monthly calendar grid

### Eintrag (Timesheet Entry) for Vertretung Days

- The substitute SB can create an Eintrag for a Vertretung day even without a recurring Zuweisung
- The child assigned via Vertretung appears in the "Kind" selector of the Neuer-Eintrag sheet
- An amber **"Vertretung"** badge is shown next to the child's name in the form
- A **"Vertretung (Vorname)"** quick-slot is pre-filled with the agreed time and shown at the top of the time picker

---

## Testing Steps

### Prerequisites

- At least one child exists with:
  - A **Stundenplan** entry (e.g. Monday 08:00–13:00)
  - A **Zuweisung** (e.g. to SB "Anna" on Monday)
- At least one second Schulbegleiter account exists (e.g. "Ben") to act as substitute
- You are logged in as **Admin**

---

### Test 1 — Vertretung option visibility rules

1. Open **Admin → Kinder → [Child] → Kalender**
2. Navigate to a week where the child has a Zuweisung on Monday
3. Click the `+` button in the **Monday** column → confirm **Vertretung** appears in the dropdown
4. Click the `+` button in a weekday with **no Zuweisung** → confirm **Vertretung** does **not** appear
5. Create a Vertretung on Monday (see Test 2)
6. Click `+` on Monday again → confirm **Vertretung** option is **no longer shown** (one already exists)

---

### Test 2 — Creating a Vertretung

1. Click `+` → **Vertretung** on a day with a Zuweisung
2. Confirm the time shown (e.g. "Zeit: 08:00–13:00 (laut Stundenplan)") matches the Stundenplan
3. Select substitute SB "Ben" from the combobox
4. Click **Anlegen**
5. Confirm:
   - The original SB chip (e.g. "Anna") is now shown with **strikethrough and greyed** styling
   - An amber **"Ben"** chip appears below it
   - No time input was shown during creation

---

### Test 3 — Editing a Vertretung

1. Click the amber **"Ben"** chip
2. Confirm the edit popover shows:
   - A Vertreter combobox (currently "Ben")
   - Read-only time info: "Zeit: 08:00–13:00 (laut Stundenplan)"
   - No editable time inputs
3. Change the substitute to a different SB and click **Speichern**
4. Confirm the chip updates to show the new name

---

### Test 4 — Deleting a Vertretung

1. Hover over the amber Vertretung chip → an **X** button appears
2. Click X → confirm the Vertretung is removed
3. Confirm the original SB chip (e.g. "Anna") is no longer strikethrough
4. Confirm the `+` dropdown shows **Vertretung** again (since no Vertretung exists now)

---

### Test 5 — Substitute SB sees Vertretung in their calendar

1. Log in as **Ben** (the substitute SB)
2. Navigate to the **Tag** tab on the day of the Vertretung
3. Confirm an amber **"Vertretung"** card appears, showing the child's name and time
4. Navigate to the **Woche** tab
5. Confirm an amber time block appears in the week grid at the correct time
6. Navigate to **Lehrer Ansicht** (Monat tab)
7. Confirm an amber dot appears on the correct day

---

### Test 6 — Substitute SB can log an Eintrag

1. Log in as **Ben** on the Vertretung day
2. Tap **Neuer Eintrag** (the `+` button / FAB)
3. Select the Vertretung date
4. Confirm:
   - The child's name appears in the form (not "An diesem Tag ist dir kein Kind zugewiesen")
   - An amber **"Vertretung"** badge is shown next to the child's name
   - A **"Vertretung (Vorname)"** quick-slot button appears pre-filled with the Stundenplan time
5. Select the quick-slot, sign, and save
6. Confirm the Eintrag appears in Ben's timesheet

---

### Test 7 — Vertretung removed: substitute no longer sees it

1. Log in as **Admin**, delete the Vertretung (see Test 4)
2. Log in as **Ben**
3. Confirm the amber Vertretung card/block is gone from Tag and Woche views
4. Confirm the Neuer-Eintrag form no longer shows the child for that day

---

## Known Limitations

- `originalUserId` is stored in the DB but currently always `null` — the original SB is not explicitly recorded (the Zuweisung already implies who the original SB is)
- Only one Vertretung per child per day is supported
- The Vertretung time is always taken from the Stundenplan at creation time; if the Stundenplan is later changed, existing Vertretungen are not automatically updated
