import { EventType, Role } from "../../src/generated/prisma";
import type { SeedDataset } from "./types";

// Public demo dataset (demo-lebenshilfe.codingforchange.com). Everything here is
// invented; no real child, family or employee appears in it.
//
// It differs from the development dataset on purpose. Munich's data exists to
// break things — half-filled records, missing Schweigepflichtsentbindungen,
// awkward split timetables. This one exists to be clicked through by someone
// seeing the product for the first time, so it is broader (more people, weeks of
// history) and tidier, with just enough rough edges to show that the app handles
// them: one Bescheid still pending, one Aufstockung awaiting approval, one
// Vertretung, one sick day.
//
// Mail domain: every address is under demo.codingforchange.com — a domain we
// control. Do not use a real Lebenshilfe domain here: the demo runs with a live
// Resend key, so anything the app sends would reach a real inbox.

const PASSWORD = "Demo-Hamburg-2026!";
const AT = "@demo.codingforchange.com";

const NELE = `nele.carstens${AT}`;
const JANNIK = `jannik.rohde${AT}`;
const SOPHIE = `sophie.lindner${AT}`;
const TOBIAS = `tobias.mahnke${AT}`;

const EMILIA = "demo-emilia-petersen";
const JONAS = "demo-jonas-brandt";
const LENI = "demo-leni-timm";
const MATS = "demo-mats-ohlsen";
const FINJA = "demo-finja-kruse";
const HENRI = "demo-henri-lorenzen";

const PLAN_HH = "demo-plan-hamburg";
const PLAN_GYM = "demo-plan-gymnasium";

function weekdays(startTime: string, endTime: string) {
  return [0, 1, 2, 3, 4].map((weekday) => ({ weekday, startTime, endTime }));
}

function assign(
  childId: string,
  profileEmail: string,
  days: number[],
  startTime: string,
  endTime: string,
  tandemOn?: number,
) {
  return days.map((weekday) => ({
    childId,
    profileEmail,
    weekday,
    startTime,
    endTime,
    tandem: weekday === tandemOn,
  }));
}

export const hamburgDemoDataset: SeedDataset = {
  label: "Hamburg (Demo)",

  users: [
    {
      email: `leitung${AT}`,
      password: PASSWORD,
      name: "Katrin Hansen",
      role: Role.OWNER,
    },
    {
      email: `koordination${AT}`,
      password: PASSWORD,
      name: "Sven Dittmer",
      role: Role.ADMIN,
    },
    {
      email: NELE,
      password: PASSWORD,
      name: "Nele Carstens",
      role: Role.SCHOOL_ASSISTANT,
    },
    {
      email: JANNIK,
      password: PASSWORD,
      name: "Jannik Rohde",
      role: Role.SCHOOL_ASSISTANT,
    },
    {
      email: SOPHIE,
      password: PASSWORD,
      name: "Sophie Lindner",
      role: Role.SCHOOL_ASSISTANT,
    },
    {
      email: TOBIAS,
      password: PASSWORD,
      name: "Tobias Mahnke",
      role: Role.SCHOOL_ASSISTANT,
    },
  ],

  pendingInvitation: {
    email: `mirko.thiel${AT}`,
    name: "Mirko Thiel",
    role: Role.SCHOOL_ASSISTANT,
    token: "demo-pending-mirko",
    weeklyHours: 16,
  },

  // Hamburg's actual structure: Eingliederungshilfe sits with the bezirkliche
  // Fachämter, schulische Begleitung with the Schulbehörde. Addresses are real
  // public offices; the mail addresses use .example so nothing can be sent.
  kostentraeger: [
    {
      id: "demo-kt-eghmitte",
      name: "Fachamt Eingliederungshilfe Hamburg-Mitte",
      email: "eingliederungshilfe@hamburg-mitte.example",
      address: "Klosterwall 2, 20095 Hamburg",
    },
    {
      id: "demo-kt-bsb",
      name: "Behörde für Schule und Berufsbildung",
      email: "schulbegleitung@bsb-hamburg.example",
      address: "Hamburger Straße 31, 22083 Hamburg",
    },
    {
      id: "demo-kt-jfh-altona",
      name: "Fachamt Jugend- und Familienhilfe Altona",
      email: "jugendhilfe@altona.example",
      address: "Platz der Republik 1, 22765 Hamburg",
    },
  ],

  // Relative to today so the demo always has a closure in view plus a future
  // range — a reseed in six months still looks current.
  holidayPlans: [
    {
      id: PLAN_HH,
      name: "Hamburg Standard 2026/27",
      entries: [
        { name: "Herbstferien", startOffset: -16, endOffset: -5 },
        { name: "Weihnachtsferien", startOffset: 48, endOffset: 62 },
      ],
    },
    {
      id: PLAN_GYM,
      name: "Gymnasium Sonderplan",
      entries: [
        { name: "Bewegliche Ferientage", startOffset: -16, endOffset: -3 },
        { name: "Weihnachtsferien", startOffset: 48, endOffset: 62 },
      ],
    },
  ],

  // Real Hamburg schools (public information). Coordinates are approximate —
  // accurate to the neighbourhood, which is all the map view needs.
  schools: [
    {
      id: "demo-school-sternschanze",
      name: "Grundschule Sternschanze",
      address: "Altonaer Straße 38, 20357 Hamburg",
      lat: 53.562,
      lng: 9.964,
      holidayPlanId: PLAN_HH,
    },
    {
      id: "demo-school-rothestrasse",
      name: "Grundschule Rothestraße",
      address: "Rothestraße 22, 22765 Hamburg",
      lat: 53.55,
      lng: 9.933,
      holidayPlanId: PLAN_HH,
    },
    {
      id: "demo-school-barmbek",
      name: "Stadtteilschule Barmbek",
      address: "Fraenkelstraße 11, 22307 Hamburg",
      lat: 53.588,
      lng: 10.043,
      holidayPlanId: PLAN_HH,
    },
    {
      id: "demo-school-isebek",
      name: "Schule An der Isebek",
      address: "Bismarckstraße 83, 20253 Hamburg",
      lat: 53.579,
      lng: 9.968,
      holidayPlanId: PLAN_HH,
    },
    {
      id: "demo-school-hamm",
      name: "Gymnasium Hamm",
      address: "Ebnerstraße 10, 20537 Hamburg",
      lat: 53.556,
      lng: 10.047,
      holidayPlanId: PLAN_GYM,
    },
  ],

  children: [
    {
      id: EMILIA,
      firstName: "Emilia",
      lastName: "Petersen",
      leosOne: true,
      bescheid: "Bescheid Fachamt Eingliederungshilfe Mitte, gültig bis 31.07.",
      sbIb: "SB",
      schweigepflichtsentbindung: true,
      bemerkung: "Braucht feste Abläufe; Übergänge gut ankündigen.",
      schoolId: "demo-school-sternschanze",
      kostentraegerId: "demo-kt-eghmitte",
    },
    {
      id: JONAS,
      firstName: "Jonas",
      lastName: "Brandt",
      leosOne: true,
      bescheid: "Folgebescheid der Schulbehörde vom Beginn des Schuljahres.",
      sbIb: "SB",
      schweigepflichtsentbindung: true,
      bemerkung: null,
      schoolId: "demo-school-rothestrasse",
      kostentraegerId: "demo-kt-bsb",
    },
    {
      id: LENI,
      firstName: "Leni",
      lastName: "Timm",
      leosOne: false,
      bescheid: null,
      sbIb: "IB",
      schweigepflichtsentbindung: false,
      bemerkung:
        "Erstantrag läuft — Schweigepflichtsentbindung liegt noch nicht vor.",
      schoolId: "demo-school-barmbek",
      kostentraegerId: "demo-kt-jfh-altona",
    },
    {
      id: MATS,
      firstName: "Mats",
      lastName: "Ohlsen",
      leosOne: true,
      bescheid: "Bescheid Fachamt Altona, Anschlussförderung beantragt.",
      sbIb: "IB",
      schweigepflichtsentbindung: true,
      bemerkung: "Logopädie dienstags 11–12 Uhr außerhalb der Schule.",
      schoolId: "demo-school-isebek",
      kostentraegerId: "demo-kt-jfh-altona",
    },
    {
      id: FINJA,
      firstName: "Finja",
      lastName: "Kruse",
      leosOne: true,
      bescheid: "Bescheid der Schulbehörde, gültig bis Schuljahresende.",
      sbIb: "SB",
      schweigepflichtsentbindung: true,
      bemerkung: null,
      schoolId: "demo-school-hamm",
      kostentraegerId: "demo-kt-bsb",
    },
    {
      id: HENRI,
      firstName: "Henri",
      lastName: "Lorenzen",
      leosOne: false,
      bescheid: "Bescheid Fachamt Eingliederungshilfe Mitte.",
      sbIb: "SB",
      schweigepflichtsentbindung: true,
      bemerkung: "Begleitung im Tandem an zwei Tagen pro Woche.",
      schoolId: "demo-school-sternschanze",
      kostentraegerId: "demo-kt-eghmitte",
    },
  ],

  childSchedules: {
    [EMILIA]: weekdays("08:00", "13:00"),
    [JONAS]: weekdays("08:00", "13:00"),
    [LENI]: weekdays("08:00", "14:00"),
    // Tuesday (weekday 1) splits around the logopaedics slot outside school.
    [MATS]: [
      { weekday: 0, startTime: "08:00", endTime: "13:00" },
      { weekday: 1, startTime: "08:00", endTime: "11:00" },
      { weekday: 1, startTime: "12:00", endTime: "13:00" },
      { weekday: 2, startTime: "08:00", endTime: "13:00" },
      { weekday: 3, startTime: "08:00", endTime: "13:00" },
      { weekday: 4, startTime: "08:00", endTime: "13:00" },
    ],
    [FINJA]: weekdays("08:00", "15:00"),
    [HENRI]: weekdays("08:00", "13:00"),
  },

  absences: [
    { childId: EMILIA, offset: -4, note: "Erkältung" },
    { childId: LENI, offset: -2, note: null },
    { childId: FINJA, offset: 3, note: "Arzttermin angekündigt" },
    { childId: MATS, offset: 6, note: "Familienreise mit Attest" },
  ],

  profileDetails: {
    [NELE]: {
      leosOne: true,
      outlook: true,
      weeklyHours: 25,
      introductionDayWeekdaysAgo: 60,
      zvNeuNachBescheid: false,
    },
    [JANNIK]: {
      leosOne: true,
      outlook: true,
      weeklyHours: 20,
      introductionDayWeekdaysAgo: 35,
      zvNeuNachBescheid: true,
      zvNeuNote:
        "Bescheid liegt vor — Aufstockung von 20 auf 25 Wochenstunden zum Monatsbeginn.",
    },
    [SOPHIE]: {
      leosOne: true,
      outlook: false,
      weeklyHours: 30,
      introductionDayWeekdaysAgo: 110,
      zvNeuNachBescheid: false,
    },
    [TOBIAS]: {
      leosOne: false,
      outlook: true,
      weeklyHours: 15,
      introductionDayWeekdaysAgo: 8,
      zvNeuNachBescheid: false,
    },
  },

  // Nele splits her week between Emilia and Henri; Jannik covers Jonas; Sophie
  // carries the two long school days (Leni, Finja); Tobias is new and part-time
  // on Mats. Henri is tandem on two days — the only child begleitet im Tandem.
  assignments: [
    ...assign(EMILIA, NELE, [0, 1, 2], "08:00", "13:00"),
    ...assign(HENRI, NELE, [3, 4], "08:00", "13:00", 3),
    ...assign(JONAS, JANNIK, [0, 1, 2, 3, 4], "08:00", "13:00"),
    ...assign(LENI, SOPHIE, [0, 2, 4], "08:00", "14:00"),
    ...assign(FINJA, SOPHIE, [1, 3], "08:00", "15:00"),
    ...assign(MATS, TOBIAS, [0, 2, 4], "08:00", "13:00"),
  ],

  vertretungen: [
    // Nele stands in for Jonas while Jannik is out — shows the Vertretung flow.
    { childId: JONAS, substituteEmail: NELE, weekdaysAgo: 3 },
    { childId: MATS, substituteEmail: JANNIK, weekdaysAgo: 7 },
  ],

  // Only the entries worth looking at are written out; `autoEvents` below fills
  // the surrounding weeks so the Monatsübersicht and the Stundennachweis have
  // real history behind them.
  eventPlans: {
    [NELE]: [
      {
        offset: -1,
        child: EMILIA,
        type: EventType.WORK,
        startTime: "08:00",
        endTime: "13:00",
        note: "Elterngespräch im Anschluss an den Unterricht.",
      },
      {
        offset: 0,
        child: EMILIA,
        type: EventType.WORK,
        startTime: "08:00",
        endTime: "13:00",
        note: null,
      },
    ],
    [JANNIK]: [
      {
        offset: -2,
        child: null,
        type: EventType.SICK,
        startTime: null,
        endTime: null,
        note: "Erkältung, AU liegt vor.",
      },
      {
        offset: -1,
        child: null,
        type: EventType.SICK,
        startTime: null,
        endTime: null,
        note: null,
      },
      {
        offset: 0,
        child: JONAS,
        type: EventType.WORK,
        startTime: "08:00",
        endTime: "13:00",
        note: "Wiedereinstieg nach Krankheit",
      },
    ],
    [SOPHIE]: [
      {
        offset: -1,
        child: FINJA,
        type: EventType.WORK,
        startTime: "08:00",
        endTime: "15:00",
        note: "Klassenausflug in die Hamburger Kunsthalle",
      },
    ],
    [TOBIAS]: [
      {
        offset: 0,
        child: MATS,
        type: EventType.WORK,
        startTime: "08:00",
        endTime: "13:00",
        note: "Zweite Woche in der Begleitung.",
      },
    ],
  },

  autoEvents: {
    emails: [NELE, JANNIK, SOPHIE, TOBIAS],
    fromOffset: -45,
    toOffset: 0,
  },

  monthlyReports: {
    supervisorName: "Katrin Hansen",
    emails: [NELE, JANNIK, SOPHIE],
  },

  workshops: [
    {
      id: "demo-ws-deeskalation",
      name: "Deeskalation im Schulalltag",
      description:
        "Grundlagen der gewaltfreien Kommunikation und Konfliktlösung im Schulkontext.",
    },
    {
      id: "demo-ws-erste-hilfe",
      name: "Erste Hilfe für Schulbegleiter:innen",
      description: "Auffrischung Erste-Hilfe-Maßnahmen mit Fokus auf Kinder.",
    },
    {
      id: "demo-ws-autismus",
      name: "Autismus-Spektrum in der Schulbegleitung",
      description:
        "Grundwissen zum Autismus-Spektrum und praktische Strategien für die Begleitung im Schulalltag.",
    },
    {
      id: "demo-ws-uk",
      name: "Unterstützte Kommunikation",
      description:
        "Einführung in Gebärden, Symbolkarten und Talker im Schulalltag.",
    },
  ],

  attendances: [
    { workshopId: "demo-ws-deeskalation", profileEmail: NELE, weekdaysAgo: 12 },
    { workshopId: "demo-ws-uk", profileEmail: NELE, weekdaysAgo: 4 },
    {
      workshopId: "demo-ws-deeskalation",
      profileEmail: JANNIK,
      weekdaysAgo: 12,
    },
    { workshopId: "demo-ws-erste-hilfe", profileEmail: SOPHIE, weekdaysAgo: 9 },
    { workshopId: "demo-ws-autismus", profileEmail: SOPHIE, weekdaysAgo: 25 },
    { workshopId: "demo-ws-erste-hilfe", profileEmail: TOBIAS, weekdaysAgo: 2 },
  ],
};
