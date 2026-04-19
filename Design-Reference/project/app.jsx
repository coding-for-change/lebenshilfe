/* Timesheet — mobile-first */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ============================= ICONS ============================= */
const Icon = ({ children, size = 20, stroke = 2, style, fill = "none", color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
       fill={fill} stroke={color || "currentColor"} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
       style={{ flexShrink: 0, ...style }}>{children}</svg>
);
const IChevronL = (p) => <Icon {...p}><polyline points="15 18 9 12 15 6"/></Icon>;
const IChevronR = (p) => <Icon {...p}><polyline points="9 18 15 12 9 6"/></Icon>;
const IPlus = (p) => <Icon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>;
const IX = (p) => <Icon {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>;
const ICheck = (p) => <Icon {...p}><polyline points="20 6 9 17 4 12"/></Icon>;
const ITrash = (p) => <Icon {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></Icon>;
const IStethoscope = (p) => <Icon {...p}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .2.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></Icon>;
const IBriefcase = (p) => <Icon {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Icon>;
const IPen = (p) => <Icon {...p}><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></Icon>;
const ILock = (p) => <Icon {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Icon>;
const IShield = (p) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Icon>;
const ISettings = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>;
const ICal = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Icon>;
const IUser = (p) => <Icon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>;
const IUndo = (p) => <Icon {...p}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></Icon>;
const IList = (p) => <Icon {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></Icon>;
const IHome = (p) => <Icon {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Icon>;
const IClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></Icon>;
const IDown = (p) => <Icon {...p}><polyline points="6 9 12 15 18 9"/></Icon>;
const IChevronDn = IDown;

/* ============================= DATE HELPERS ============================= */
const DAYS_DE_FULL = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
const DAYS_SHORT = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const MONTHS_SHORT = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];

const pad = (n) => String(n).padStart(2,"0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const startOfWeekMon = (d) => {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7;
  return addDays(x, -dow);
};
const sameDay = (a, b) => ymd(a) === ymd(b);
const fmtTime = (mins) => `${pad(Math.floor(mins/60))}:${pad(mins%60)}`;
const parseTime = (s) => { const [h,m] = (s || "0:0").split(":").map(Number); return (h*60)+(m||0); };
const durFmt = (mins) => { const h = Math.floor(mins/60), m = mins%60; return m === 0 ? `${h}h` : `${h}h ${pad(m)}m`; };
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
const fmtDayLong = (d) => `${DAYS_DE_FULL[(d.getDay()+6)%7]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
const fmtDayMed = (d) => `${DAYS_SHORT[(d.getDay()+6)%7]}, ${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}`;
const weekNum = (d) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(),0,1));
  return Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
};

/* ============================= STORAGE ============================= */
const LS_ENTRIES = "ts.entries.v2";
const LS_TAB = "ts.tab.v1";

const loadLS = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function seed() {
  const existing = loadLS(LS_ENTRIES, null);
  if (existing) return existing;
  const today = startOfDay(new Date());
  const wk = startOfWeekMon(today);
  const entries = [];
  const mk = (dayOffset, start, end, type="work", signed=false) => entries.push({
    id: crypto.randomUUID(),
    date: ymd(addDays(wk, dayOffset)),
    type, start, end,
    note: "",
    userSig: signed ? { at: Date.now() - 86400000, name: "A. Müller" } : null,
    mgrSig: null,
  });
  const lastWk = addDays(wk, -7);
  for (let i=0;i<5;i++){
    entries.push({
      id: crypto.randomUUID(),
      date: ymd(addDays(lastWk, i)),
      type: "work", start: 480, end: 1020,
      note: "",
      userSig: { at: Date.now() - 7*86400000, name: "A. Müller" },
      mgrSig: null,
    });
  }
  mk(0, 8*60, 17*60, "work", true);
  mk(1, 8*60+15, 16*60+45, "work", true);
  mk(2, 0, 24*60, "sick", false);
  mk(3, 9*60, 17*60+30, "work", false);
  return entries;
}

/* ============================= APP ============================= */
function App() {
  const [tweaks, setTweaks] = useState(() => ({ ...window.TWEAKS }));
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [entries, setEntries] = useState(() => seed());
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [tab, setTab] = useState(() => loadLS(LS_TAB, "day"));
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [mgrFlow, setMgrFlow] = useState(null);

  useEffect(() => saveLS(LS_ENTRIES, entries), [entries]);
  useEffect(() => saveLS(LS_TAB, tab), [tab]);

  useEffect(() => {
    const accent = tweaks.accent || "indigo";
    const palette = {
      indigo:  ["#6366f1","#eef2ff","#c7d2fe","#3730a3"],
      violet:  ["#7c3aed","#f5f3ff","#ddd6fe","#5b21b6"],
      blue:    ["#2563eb","#eff6ff","#bfdbfe","#1e40af"],
      emerald: ["#059669","#ecfdf5","#a7f3d0","#065f46"],
      amber:   ["#d97706","#fffbeb","#fde68a","#92400e"],
    };
    const [v,s,b,fg] = palette[accent] || palette.indigo;
    const r = document.documentElement.style;
    r.setProperty("--accent", v); r.setProperty("--accent-soft", s);
    r.setProperty("--accent-border", b); r.setProperty("--accent-ink", fg);
  }, [tweaks.accent]);

  useEffect(() => {
    const onMsg = (e) => {
      const m = e.data;
      if (!m || typeof m !== "object") return;
      if (m.type === "__activate_edit_mode") { setEditMode(true); setTweaksOpen(true); }
      if (m.type === "__deactivate_edit_mode") { setEditMode(false); setTweaksOpen(false); }
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const updateTweak = (patch) => {
    setTweaks((prev) => {
      const next = { ...prev, ...patch };
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: patch }, "*");
      return next;
    });
  };

  const showToast = (msg) => {
    setToast({ msg, id: Date.now() });
    setTimeout(() => setToast((t) => (t && t.msg === msg ? null : t)), 2200);
  };

  const upsertEntry = (entry) => {
    setEntries((xs) => {
      const i = xs.findIndex(e => e.id === entry.id);
      if (i === -1) return [...xs, entry];
      const n = xs.slice(); n[i] = entry; return n;
    });
  };
  const deleteEntry = (id) => setEntries((xs) => xs.filter(e => e.id !== id));

  const openCreate = (date) => {
    setSheet({
      type: "entry",
      mode: "create",
      entry: {
        id: crypto.randomUUID(),
        date: ymd(date || selectedDate),
        type: "work",
        start: parseTime(tweaks.defaultStart || "08:00"),
        end: parseTime(tweaks.defaultEnd || "17:00"),
        note: "",
        userSig: null,
        mgrSig: null,
      }
    });
  };
  const openEdit = (entry) => setSheet({ type: "entry", mode: "edit", entry: { ...entry } });

  const signEntry = (id, dataUrl) => {
    setEntries((xs) => xs.map(e => e.id === id ? { ...e, userSig: { at: Date.now(), name: "A. Müller", dataUrl } } : e));
    showToast("Eintrag signiert");
  };
  const unsignEntry = (id) => {
    setEntries((xs) => xs.map(e => e.id === id ? { ...e, userSig: null, mgrSig: null } : e));
  };

  const entriesByDate = useMemo(() => {
    const m = {};
    for (const e of entries) (m[e.date] ||= []).push(e);
    for (const k of Object.keys(m)) m[k].sort((a,b)=>a.start-b.start);
    return m;
  }, [entries]);

  const selectedMonth = selectedDate;
  const monthEntries = useMemo(() => {
    const mk = monthKey(selectedMonth);
    return entries.filter(e => e.date.startsWith(mk));
  }, [entries, selectedMonth]);

  const openMgrFlow = () => {
    const unsigned = monthEntries.filter(e => !e.mgrSig);
    if (unsigned.length === 0) { showToast("Bereits komplett freigegeben"); return; }
    const allUserSigned = monthEntries.every(e => e.userSig);
    setMgrFlow({ stage: allUserSigned ? "intro" : "not-ready" });
  };

  const commitMgrSig = (sig) => {
    const mk = monthKey(selectedMonth);
    const count = entries.filter(e => e.date.startsWith(mk) && e.userSig && !e.mgrSig).length;
    setEntries((xs) => xs.map(e => e.date.startsWith(mk) && e.userSig && !e.mgrSig
      ? { ...e, mgrSig: { at: Date.now(), name: tweaks.manager || "Manager", dataUrl: sig } }
      : e));
    setMgrFlow({ stage: "done", count });
  };

  return (
    <div className="phone">
      <div className="phone-inner">
        <StatusBar/>
        <div className="content">
          {tab === "day" && (
            <DayView
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              entriesByDate={entriesByDate}
              openCreate={openCreate}
              openEdit={openEdit}
            />
          )}
          {tab === "month" && (
            <MonthView
              selectedDate={selectedDate}
              setSelectedDate={(d) => { setSelectedDate(d); setTab("day"); }}
              entriesByDate={entriesByDate}
              monthEntries={monthEntries}
              onMgr={openMgrFlow}
              tweaks={tweaks}
            />
          )}
          {tab === "settings" && (
            <SettingsView tweaks={tweaks} updateTweak={updateTweak}/>
          )}
        </div>

        {tab !== "settings" && (
          <button className="fab" onClick={() => openCreate(selectedDate)} aria-label="Neuer Eintrag">
            <IPlus size={24} stroke={2.2}/>
          </button>
        )}

        <TabBar tab={tab} setTab={setTab}/>
      </div>

      {sheet && sheet.type === "entry" && (
        <EntrySheet
          sheet={sheet}
          onClose={() => setSheet(null)}
          onSave={(e) => { upsertEntry(e); setSheet(null); showToast(sheet.mode === "create" ? "Erstellt" : "Gespeichert"); }}
          onDelete={(id) => { deleteEntry(id); setSheet(null); showToast("Gelöscht"); }}
          onSign={signEntry}
          onUnsign={(id) => { unsignEntry(id); showToast("Signatur entfernt"); }}
        />
      )}

      {mgrFlow && (
        <ManagerFlow
          state={mgrFlow}
          setState={setMgrFlow}
          monthDate={selectedMonth}
          monthEntries={monthEntries}
          managerName={tweaks.manager || "S. Weber"}
          onCommit={commitMgrSig}
        />
      )}

      {toast && (
        <div className="toast">
          <ICheck size={14} stroke={2.5}/>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ============================= STATUS BAR ============================= */
function StatusBar() {
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }, 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="status-bar">
      <span style={{ fontWeight: 600 }}>{time}</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 12 }}>●●●●</span>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 0a8 8 0 0 1 5.66 2.34l-1.41 1.41A6 6 0 0 0 8 2a6 6 0 0 0-4.24 1.76L2.34 2.34A8 8 0 0 1 8 0Zm0 4a4 4 0 0 1 2.83 1.17l-1.42 1.42A2 2 0 0 0 8 6a2 2 0 0 0-1.41.59L5.17 5.17A4 4 0 0 1 8 4Zm0 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x="0.5" y="0.5" width="18" height="10" rx="2" stroke="currentColor"/><rect x="2" y="2" width="14" height="7" rx="1" fill="currentColor"/><rect x="19" y="4" width="2" height="3" rx="0.5" fill="currentColor"/></svg>
      </div>
    </div>
  );
}

/* ============================= TAB BAR ============================= */
function TabBar({ tab, setTab }) {
  const items = [
    { id: "day",     label: "Tag",     icon: <IClock size={20}/> },
    { id: "month",   label: "Monat",   icon: <ICal size={20}/> },
    { id: "settings",label: "Mehr",    icon: <ISettings size={20}/> },
  ];
  return (
    <nav className="tab-bar">
      {items.map(i => (
        <button key={i.id} className={"tab-btn " + (tab === i.id ? "active" : "")} onClick={() => setTab(i.id)}>
          {i.icon}
          <span>{i.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ============================= DAY VIEW ============================= */
function DayView({ selectedDate, setSelectedDate, entriesByDate, openCreate, openEdit }) {
  const swipeRef = useRef(null);
  const [drag, setDrag] = useState(null);

  const week = useMemo(() => {
    const start = startOfWeekMon(selectedDate);
    return Array.from({length:7}, (_,i) => addDays(start, i));
  }, [selectedDate]);

  const prevDay = () => setSelectedDate(d => addDays(d, -1));
  const nextDay = () => setSelectedDate(d => addDays(d, 1));

  /* Swipe */
  useEffect(() => {
    const el = swipeRef.current;
    if (!el) return;
    let startX = 0, startY = 0, tracking = false, locked = null;
    const onStart = (e) => {
      const t = e.touches ? e.touches[0] : e;
      startX = t.clientX; startY = t.clientY;
      tracking = true; locked = null;
    };
    const onMove = (e) => {
      if (!tracking) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - startX, dy = t.clientY - startY;
      if (!locked && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (locked === "x") {
        setDrag(dx);
        e.preventDefault();
      }
    };
    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (locked === "x") {
        if (drag > 60) prevDay();
        else if (drag < -60) nextDay();
      }
      setDrag(0);
      locked = null;
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [drag, selectedDate]);

  const dayKey = ymd(selectedDate);
  const entries = entriesByDate[dayKey] || [];
  const workMins = entries.filter(e => e.type === "work").reduce((s,e)=>s+(e.end-e.start),0);
  const sick = entries.some(e => e.type === "sick");
  const allSigned = entries.length > 0 && entries.every(e => e.userSig);

  return (
    <>
      {/* Header */}
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow">KW {weekNum(selectedDate)} · {MONTHS[selectedDate.getMonth()]}</div>
            <div className="page-title">Arbeitszeit</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="icon-btn" onClick={() => setSelectedDate(startOfDay(new Date()))} aria-label="Heute">
              <IHome size={18}/>
            </button>
          </div>
        </div>

        {/* Week strip */}
        <div className="week-strip">
          <button className="icon-btn sm" onClick={() => setSelectedDate(d => addDays(d, -7))} aria-label="Vorherige Woche">
            <IChevronL size={16}/>
          </button>
          <div className="week-days">
            {week.map(d => {
              const isSel = sameDay(d, selectedDate);
              const isToday = sameDay(d, new Date());
              const dayEntries = entriesByDate[ymd(d)] || [];
              const hasSick = dayEntries.some(e => e.type === "sick");
              const hasWork = dayEntries.some(e => e.type === "work");
              const anyUnsigned = dayEntries.some(e => !e.userSig);
              return (
                <button key={ymd(d)} className={"week-day " + (isSel ? "selected " : "") + (isToday ? "today " : "")}
                  onClick={() => setSelectedDate(d)}>
                  <span className="wd-dow">{DAYS_SHORT[(d.getDay()+6)%7]}</span>
                  <span className="wd-num">{d.getDate()}</span>
                  <span className="wd-dots">
                    {hasWork && <span className="dot" style={{ background: "var(--accent)" }}/>}
                    {hasSick && <span className="dot" style={{ background: "var(--sick)" }}/>}
                    {dayEntries.length > 0 && anyUnsigned && <span className="dot" style={{ background: "#f59e0b" }}/>}
                    {dayEntries.length > 0 && !anyUnsigned && <span className="dot" style={{ background: "var(--ok)" }}/>}
                  </span>
                </button>
              );
            })}
          </div>
          <button className="icon-btn sm" onClick={() => setSelectedDate(d => addDays(d, 7))} aria-label="Nächste Woche">
            <IChevronR size={16}/>
          </button>
        </div>
      </header>

      {/* Day summary + entries */}
      <div ref={swipeRef}
        className="swipe-area"
        style={{ transform: `translateX(${drag || 0}px)`, transition: drag ? "none" : "transform .2s ease" }}>
        {/* Day heading */}
        <div className="day-heading">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="icon-btn sm ghost" onClick={prevDay}><IChevronL size={18}/></button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div className="day-heading-title">{fmtDayLong(selectedDate)}</div>
              {sameDay(selectedDate, new Date()) && <div className="day-heading-sub">Heute</div>}
              {!sameDay(selectedDate, new Date()) && (
                <div className="day-heading-sub">
                  {Math.round((selectedDate - startOfDay(new Date())) / 86400000)} Tage
                  {selectedDate < new Date() ? " zurück" : " voraus"}
                </div>
              )}
            </div>
            <button className="icon-btn sm ghost" onClick={nextDay}><IChevronR size={18}/></button>
          </div>

          {/* Summary pills */}
          {entries.length > 0 && (
            <div className="pills">
              {sick ? (
                <span className="pill sick"><IStethoscope size={13}/> Krank · ganztägig</span>
              ) : (
                <>
                  <span className="pill accent"><IClock size={13}/> {durFmt(workMins)}</span>
                  <span className="pill muted">{entries.length} {entries.length === 1 ? "Eintrag" : "Einträge"}</span>
                  {allSigned && <span className="pill ok"><ICheck size={13} stroke={2.5}/> Signiert</span>}
                </>
              )}
            </div>
          )}
        </div>

        {/* Entries list */}
        {entries.length === 0 ? (
          <EmptyState onAdd={() => openCreate(selectedDate)}/>
        ) : (
          <div className="entries-list">
            {entries.map(e => <EntryCard key={e.id} entry={e} onClick={() => openEdit(e)}/>)}
          </div>
        )}

        {/* Swipe hint */}
        <div className="swipe-hint">
          <IChevronL size={12}/> Wischen für Tage <IChevronR size={12}/>
        </div>
      </div>
    </>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <ICal size={28} color="var(--muted-fg)"/>
      </div>
      <div className="empty-title">Keine Einträge</div>
      <div className="empty-sub">Tippe auf <strong>+</strong> um eine Arbeitszeit<br/>oder einen Krankheitstag zu erfassen.</div>
      <button className="btn accent" onClick={onAdd}>
        <IPlus size={16}/> Eintrag hinzufügen
      </button>
    </div>
  );
}

function EntryCard({ entry, onClick }) {
  const signed = !!entry.userSig;
  const mgr = !!entry.mgrSig;
  const dur = entry.end - entry.start;

  return (
    <button className={"entry-card " + entry.type + (signed ? " signed" : "")} onClick={onClick}>
      <div className="entry-card-accent"/>
      <div className="entry-card-body">
        <div className="entry-card-row">
          <div className="entry-card-type">
            {entry.type === "work" ? <IBriefcase size={14}/> : <IStethoscope size={14}/>}
            <span>{entry.type === "work" ? "Arbeit" : "Krankheit"}</span>
          </div>
          {signed ? (
            mgr ? (
              <span className="tag ok-solid"><IShield size={11}/> freigegeben</span>
            ) : (
              <span className="tag ok"><ICheck size={11} stroke={3}/> signiert</span>
            )
          ) : (
            <span className="tag warn">nicht signiert</span>
          )}
        </div>
        <div className="entry-card-time mono">
          {entry.type === "sick" ? "Ganztägig" : `${fmtTime(entry.start)} – ${fmtTime(entry.end)}`}
        </div>
        <div className="entry-card-meta">
          {entry.type === "work" && durFmt(dur)}
          {entry.note && <> · {entry.note}</>}
          {signed && <> · signiert am {new Date(entry.userSig.at).toLocaleDateString("de-DE")}</>}
        </div>
      </div>
    </button>
  );
}

/* ============================= MONTH VIEW ============================= */
function MonthView({ selectedDate, setSelectedDate, entriesByDate, monthEntries, onMgr, tweaks }) {
  const [cursor, setCursor] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeekMon(firstOfMonth);
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const workMins = monthEntries.filter(e=>e.type==="work").reduce((s,e)=>s+(e.end-e.start),0);
  const sickDays = monthEntries.filter(e=>e.type==="sick").length;
  const userSigned = monthEntries.filter(e=>e.userSig).length;
  const mgrSigned = monthEntries.filter(e=>e.mgrSig).length;
  const total = monthEntries.length;
  const userPct = total ? Math.round(userSigned/total*100) : 0;
  const mgrDone = total > 0 && mgrSigned === total;

  return (
    <>
      <header className="page-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="eyebrow">Übersicht</div>
            <div className="page-title">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="icon-btn" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth()-1, 1))}>
              <IChevronL size={18}/>
            </button>
            <button className="icon-btn" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth()+1, 1))}>
              <IChevronR size={18}/>
            </button>
          </div>
        </div>
      </header>

      {/* Calendar grid */}
      <div className="month-grid-wrap">
        <div className="month-dow">
          {DAYS_SHORT.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="month-grid">
          {days.map(d => {
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = sameDay(d, new Date());
            const dayEntries = entriesByDate[ymd(d)] || [];
            const hasSick = dayEntries.some(e => e.type === "sick");
            const hasWork = dayEntries.some(e => e.type === "work");
            const allSigned = dayEntries.length > 0 && dayEntries.every(e => e.userSig);
            const fullyApproved = dayEntries.length > 0 && dayEntries.every(e => e.mgrSig);
            return (
              <button
                key={ymd(d)}
                className={"month-cell " + (inMonth ? "" : "dim ") + (isToday ? "today " : "")}
                onClick={() => setSelectedDate(d)}>
                <span className="mc-num">{d.getDate()}</span>
                <span className="mc-bar">
                  {hasWork && <span className="bar" style={{ background: fullyApproved ? "var(--ok)" : allSigned ? "var(--accent)" : "var(--accent-border)" }}/>}
                  {hasSick && <span className="bar" style={{ background: "var(--sick)" }}/>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats card */}
      <div className="stat-card">
        <div className="stat-row">
          <Stat label="Arbeitszeit" value={durFmt(workMins)} />
          <Stat label="Krank" value={`${sickDays}T`} tone={sickDays > 0 ? "sick" : "default"}/>
        </div>
        <div className="stat-row">
          <Stat label="Eigene Signatur" value={`${userSigned}/${total}`} sub={`${userPct}%`}/>
          <Stat label="Freigabe" value={mgrDone ? "Komplett" : `${mgrSigned}/${total}`} tone={mgrDone ? "ok" : "default"}/>
        </div>

        {/* Progress bar */}
        <div className="progress-group">
          <div className="progress-label">
            <span>Freigabe-Fortschritt</span>
            <span className="mono">{total ? Math.round(mgrSigned/total*100) : 0}%</span>
          </div>
          <div className="progress">
            <div className="progress-user" style={{ width: `${userPct}%` }}/>
            <div className="progress-mgr" style={{ width: `${total ? (mgrSigned/total*100) : 0}%` }}/>
          </div>
          <div className="progress-legend">
            <span><span className="legend-swatch" style={{ background: "var(--accent)" }}/> Signiert</span>
            <span><span className="legend-swatch" style={{ background: "var(--ok)" }}/> Freigegeben</span>
          </div>
        </div>
      </div>

      {/* Monthly sign-off CTA */}
      <div className="cta-card">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div className="cta-icon">
            <IShield size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="cta-title">Monat freigeben</div>
            <div className="cta-sub">
              {mgrDone ? "Dieser Monat ist bereits vollständig vom Vorgesetzten freigegeben." :
               userSigned < total ? `Zuerst ${total - userSigned} eigene Signatur${total - userSigned === 1 ? "" : "en"} erforderlich.` :
               `Gerät an ${tweaks.manager || "Vorgesetzte/n"} übergeben, um ${total - mgrSigned} Einträge freizugeben.`}
            </div>
          </div>
        </div>
        <button className="btn accent lg" onClick={onMgr} disabled={mgrDone} style={{ width: "100%", marginTop: 12 }}>
          {mgrDone ? <><ICheck size={14} stroke={2.5}/> Freigegeben</> : <><IShield size={14}/> An Vorgesetzten übergeben</>}
        </button>
      </div>
    </>
  );
}

function Stat({ label, value, sub, tone = "default" }) {
  const color = tone === "ok" ? "var(--ok)" : tone === "sick" ? "var(--sick)" : "var(--fg)";
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/* ============================= ENTRY SHEET ============================= */
function EntrySheet({ sheet, onClose, onSave, onDelete, onSign, onUnsign }) {
  const [entry, setEntry] = useState(sheet.entry);
  const [sigOpen, setSigOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const locked = !!entry.userSig;
  const dateObj = new Date(entry.date + "T00:00:00");
  const dur = Math.max(0, entry.end - entry.start);
  const valid = entry.type === "sick" || (entry.end > entry.start && dur >= 15);

  const update = (patch) => setEntry((e) => ({ ...e, ...patch }));

  return (
    <Sheet onClose={onClose} title={sheet.mode === "create" ? "Neuer Eintrag" : "Eintrag"}>
      {/* Date strip */}
      <div className="sheet-date">
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: "var(--accent-soft)", color: "var(--accent-ink)",
          border: "1px solid var(--accent-border)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          fontWeight: 600, lineHeight: 1,
        }}>
          <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
            {MONTHS_SHORT[dateObj.getMonth()]}
          </span>
          <span style={{ fontSize: 17, letterSpacing: "-0.02em" }}>{dateObj.getDate()}</span>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>
            {DAYS_DE_FULL[(dateObj.getDay()+6)%7]}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted-fg)" }}>
            {dateObj.getDate()}. {MONTHS[dateObj.getMonth()]} {dateObj.getFullYear()}
          </div>
        </div>
      </div>

      {locked && (
        <div className="locked-banner">
          <ILock size={14}/>
          Signiert — Signatur aufheben um zu bearbeiten.
        </div>
      )}

      {/* Type segmented */}
      <div className="field">
        <div className="field-label">Art</div>
        <div className="type-seg">
          <TypeBtn
            active={entry.type === "work"}
            disabled={locked}
            onClick={() => update({ type: "work" })}
            icon={<IBriefcase size={18}/>}
            label="Arbeit"
            color="var(--accent)"
            softColor="var(--accent-soft)"
          />
          <TypeBtn
            active={entry.type === "sick"}
            disabled={locked}
            onClick={() => update({ type: "sick", start: 0, end: 24*60 })}
            icon={<IStethoscope size={18}/>}
            label="Krank"
            color="var(--sick)"
            softColor="var(--sick-soft)"
          />
        </div>
      </div>

      {/* Times */}
      {entry.type === "work" && (
        <>
          <div className="field">
            <div className="field-label">Zeiten</div>
            <div className="time-row">
              <TimePicker label="Start" value={entry.start} onChange={(v) => update({ start: v })} disabled={locked}/>
              <div className="time-arrow">→</div>
              <TimePicker label="Ende" value={entry.end} onChange={(v) => update({ end: v })} disabled={locked}/>
            </div>
            <div className="duration-bar">
              <IClock size={13} color="var(--muted-fg)"/>
              <span>
                Dauer: <strong className="mono">{entry.end > entry.start ? durFmt(dur) : "—"}</strong>
              </span>
            </div>
          </div>

          <div className="field">
            <div className="field-label">Schnellauswahl</div>
            <div className="quick-row">
              {[
                { s: 8*60, e: 17*60, l: "08–17" },
                { s: 7*60, e: 15*60+30, l: "07–15:30" },
                { s: 9*60, e: 18*60, l: "09–18" },
                { s: 13*60, e: 21*60, l: "13–21" },
              ].map(q => (
                <button key={q.l} className="quick-chip" disabled={locked}
                  onClick={() => update({ start: q.s, end: q.e })}>
                  {q.l}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Note */}
      <div className="field">
        <div className="field-label">Notiz <span style={{ color: "var(--muted-fg)", fontWeight: 400 }}>(optional)</span></div>
        <input
          className="input"
          placeholder={entry.type === "sick" ? "z.B. Arzttermin" : "z.B. Wohngruppe Nord"}
          value={entry.note || ""}
          disabled={locked}
          onChange={(e) => update({ note: e.target.value })}
        />
      </div>

      {/* Signature state */}
      {entry.userSig && (
        <div className="sig-state">
          <div className="sig-state-icon">
            <ICheck size={16} stroke={3}/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="sig-state-title">Signiert von {entry.userSig.name}</div>
            <div className="sig-state-sub">
              {new Date(entry.userSig.at).toLocaleDateString("de-DE", { dateStyle: "medium" })}
              {" · "}
              {new Date(entry.userSig.at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
            </div>
            {entry.mgrSig && (
              <div className="sig-state-mgr">
                <IShield size={11}/> Freigegeben von {entry.mgrSig.name}
              </div>
            )}
          </div>
          {!entry.mgrSig && (
            <button className="btn sm" onClick={() => onUnsign(entry.id)}>
              <IUndo size={12}/>
            </button>
          )}
        </div>
      )}

      {/* Bottom actions */}
      <div className="sheet-actions">
        {sheet.mode === "edit" && !locked && (
          confirmDelete ? (
            <div style={{ display: "flex", gap: 8, width: "100%" }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>Abbrechen</button>
              <button className="btn destructive" style={{ flex: 1 }} onClick={() => onDelete(entry.id)}>
                <ITrash size={14}/> Wirklich löschen
              </button>
            </div>
          ) : (
            <>
              <button className="btn ghost-destructive" onClick={() => setConfirmDelete(true)}>
                <ITrash size={14}/>
              </button>
              {!entry.userSig ? (
                <button className="btn accent lg" style={{ flex: 1 }} disabled={!valid}
                  onClick={() => { onSave(entry); setTimeout(() => setSigOpen(true), 0); }}>
                  <IPen size={15}/> Speichern & signieren
                </button>
              ) : (
                <button className="btn primary lg" style={{ flex: 1 }} disabled={!valid}
                  onClick={() => onSave(entry)}>
                  Speichern
                </button>
              )}
            </>
          )
        )}
        {sheet.mode === "create" && (
          <>
            <button className="btn" onClick={onClose}>Abbrechen</button>
            <button className="btn accent lg" style={{ flex: 1 }} disabled={!valid}
              onClick={() => { onSave(entry); setTimeout(() => setSigOpen(true), 0); }}>
              <IPen size={15}/> Speichern & signieren
            </button>
          </>
        )}
        {locked && (
          <button className="btn primary lg" style={{ width: "100%" }} onClick={onClose}>
            Schließen
          </button>
        )}
      </div>

      {sigOpen && (
        <SignaturePad
          title="Arbeitszeit bestätigen"
          subtitle={entry.type === "work"
            ? `${fmtDayMed(dateObj)} · ${fmtTime(entry.start)}–${fmtTime(entry.end)} (${durFmt(dur)})`
            : `${fmtDayMed(dateObj)} · Krank, ganztägig`}
          signerLabel="A. Müller (Mitarbeiter)"
          onCancel={() => setSigOpen(false)}
          onConfirm={(dataUrl) => { onSign(entry.id, dataUrl); setSigOpen(false); onClose(); }}
        />
      )}
    </Sheet>
  );
}

function TypeBtn({ active, onClick, icon, label, color, softColor, disabled }) {
  return (
    <button className={"type-btn " + (active ? "active" : "")} disabled={disabled} onClick={onClick}
      style={{
        "--tb-color": color,
        "--tb-soft": softColor,
      }}>
      <span className="type-btn-icon">{icon}</span>
      <span className="type-btn-label">{label}</span>
    </button>
  );
}

function TimePicker({ label, value, onChange, disabled }) {
  return (
    <div className="time-picker">
      <div className="time-picker-label">{label}</div>
      <input
        type="time" step="900"
        className="time-input mono"
        value={fmtTime(value)}
        disabled={disabled}
        onChange={(e) => onChange(parseTime(e.target.value))}
      />
    </div>
  );
}

/* ============================= SHEET (full-screen) ============================= */
function Sheet({ title, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="sheet-handle-wrap" onClick={onClose}>
          <div className="sheet-handle"/>
        </div>
        <header className="sheet-header">
          <button className="icon-btn ghost" onClick={onClose} aria-label="Schließen">
            <IX size={18}/>
          </button>
          <div className="sheet-title">{title}</div>
          <div style={{ width: 34 }}/>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/* ============================= SIGNATURE PAD ============================= */
function SignaturePad({ title, subtitle, signerLabel, onCancel, onConfirm }) {
  const canvasRef = useRef(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#09090b";
      ctx.lineWidth = 2.4;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  let drawing = false;
  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const start = (e) => {
    e.preventDefault();
    drawing = true;
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y); ctx.stroke();
    if (!hasInk) setHasInk(true);
  };
  const end = () => { drawing = false; };
  const clear = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasInk(false);
  };

  return (
    <div className="sheet-overlay top">
      <div className="sheet sig-sheet">
        <div className="sheet-handle-wrap" onClick={onCancel}>
          <div className="sheet-handle"/>
        </div>
        <header className="sheet-header">
          <button className="icon-btn ghost" onClick={onCancel}>
            <IX size={18}/>
          </button>
          <div className="sheet-title">Unterschrift</div>
          <div style={{ width: 34 }}/>
        </header>
        <div className="sheet-body">
          <div className="sig-title">{title}</div>
          <div className="sig-sub">{subtitle}</div>
          <div className="sig-signer"><IUser size={12}/> {signerLabel}</div>

          <div className="sig-canvas-wrap">
            <canvas
              ref={canvasRef}
              className="sig-pad"
              onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
              onTouchStart={start} onTouchMove={move} onTouchEnd={end}
            />
            {!hasInk && (
              <div className="sig-placeholder">Hier unterschreiben</div>
            )}
            <div className="sig-line"/>
            <div className="sig-date-stamp mono">× {new Date().toLocaleDateString("de-DE")}</div>
          </div>

          <div className="sig-actions">
            <button className="btn" onClick={clear}>Leeren</button>
            <button className="btn accent lg" style={{ flex: 1 }} disabled={!hasInk}
              onClick={() => onConfirm(canvasRef.current.toDataURL("image/png"))}>
              <ICheck size={15} stroke={2.5}/> Bestätigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================= MANAGER FLOW ============================= */
function ManagerFlow({ state, setState, monthDate, monthEntries, managerName, onCommit }) {
  const unsigned = monthEntries.filter(e => !e.userSig);
  const toApprove = monthEntries.filter(e => e.userSig && !e.mgrSig);
  const workMins = monthEntries.filter(e=>e.type==="work").reduce((s,e)=>s+(e.end-e.start),0);
  const sickDays = monthEntries.filter(e=>e.type==="sick").length;

  if (state.stage === "not-ready") {
    return (
      <Sheet title="Freigabe" onClose={() => setState(null)}>
        <div className="warn-banner">
          <strong>Es fehlen noch {unsigned.length} Signatur{unsigned.length === 1 ? "" : "en"}.</strong>
          <div style={{ marginTop: 6 }}>
            Bitte zuerst alle Einträge selbst signieren, bevor der Monat freigegeben werden kann.
          </div>
        </div>
        <button className="btn primary lg" style={{ width: "100%" }} onClick={() => setState(null)}>
          Verstanden
        </button>
      </Sheet>
    );
  }

  if (state.stage === "intro") {
    return (
      <Sheet title="Freigabe Vorgesetzter" onClose={() => setState(null)}>
        <div className="mgr-hero">
          <div className="mgr-hero-icon"><IShield size={24}/></div>
          <div className="mgr-hero-title">Gerät übergeben</div>
          <div className="mgr-hero-sub">
            Bitte geben Sie Ihr Telefon nun an<br/><strong>{managerName}</strong>.
          </div>
        </div>

        <div className="summary-grid">
          <div>
            <div className="summary-label">Monat</div>
            <div className="summary-value">{MONTHS[monthDate.getMonth()]}</div>
          </div>
          <div>
            <div className="summary-label">Stunden</div>
            <div className="summary-value mono">{durFmt(workMins)}</div>
          </div>
          <div>
            <div className="summary-label">Krank</div>
            <div className="summary-value">{sickDays}T</div>
          </div>
          <div>
            <div className="summary-label">Einträge</div>
            <div className="summary-value">{toApprove.length}</div>
          </div>
        </div>

        <div className="field-label" style={{ marginTop: 20, marginBottom: 8 }}>Zu prüfende Einträge</div>
        <div className="mgr-list">
          {monthEntries.map((e, i) => (
            <div key={e.id} className="mgr-list-row">
              <span className="mono" style={{ minWidth: 40, color: "var(--muted-fg)", fontSize: 12 }}>
                {e.date.slice(8, 10)}.{e.date.slice(5, 7)}.
              </span>
              <span className="mono" style={{ color: "var(--fg-soft)", fontSize: 12, minWidth: 82 }}>
                {fmtTime(e.start)}–{fmtTime(e.end)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: e.type === "work" ? "var(--accent)" : "var(--sick)", fontWeight: 500, flex: 1 }}>
                {e.type === "work" ? <IBriefcase size={11}/> : <IStethoscope size={11}/>}
                {e.type === "work" ? durFmt(e.end-e.start) : "krank"}
              </span>
              {e.mgrSig ? (
                <span className="tag ok-solid"><ICheck size={10} stroke={3}/></span>
              ) : e.userSig ? (
                <span className="tag ok"><ICheck size={10} stroke={3}/></span>
              ) : (
                <span className="tag warn">!</span>
              )}
            </div>
          ))}
        </div>

        <div className="sheet-actions">
          <button className="btn" onClick={() => setState(null)}>Abbrechen</button>
          <button className="btn accent lg" style={{ flex: 1 }} disabled={toApprove.length === 0}
            onClick={() => setState({ ...state, stage: "sign" })}>
            <IPen size={15}/> Weiter zur Unterschrift
          </button>
        </div>
      </Sheet>
    );
  }

  if (state.stage === "sign") {
    return (
      <SignaturePad
        title={`${MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()}`}
        subtitle={`${toApprove.length} Einträge · ${durFmt(workMins)} · ${sickDays} Krank`}
        signerLabel={`${managerName} (Vorgesetzte/r)`}
        onCancel={() => setState({ ...state, stage: "intro" })}
        onConfirm={(dataUrl) => onCommit(dataUrl)}
      />
    );
  }

  if (state.stage === "done") {
    return (
      <Sheet title="" onClose={() => setState(null)}>
        <div className="success">
          <div className="success-icon"><ICheck size={36} stroke={2.5}/></div>
          <div className="success-title">Monat freigegeben</div>
          <div className="success-sub">
            {state.count} Einträge für {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}<br/>
            wurden von {managerName} unterschrieben.
          </div>
          <button className="btn primary lg" style={{ width: "100%", marginTop: 20 }}
            onClick={() => setState(null)}>
            Fertig
          </button>
        </div>
      </Sheet>
    );
  }
  return null;
}

/* ============================= SETTINGS ============================= */
function SettingsView({ tweaks, updateTweak }) {
  return (
    <>
      <header className="page-header">
        <div className="eyebrow">Einstellungen</div>
        <div className="page-title">Mehr</div>
      </header>

      <div className="profile-card">
        <div className="avatar">AM</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>A. Müller</div>
          <div style={{ fontSize: 12, color: "var(--muted-fg)" }}>Betreuer · Wohngruppe Nord</div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Darstellung</div>
        <div className="settings-card">
          <div className="settings-row">
            <div>
              <div className="settings-label">Akzentfarbe</div>
              <div className="settings-hint">Primärfarbe der App</div>
            </div>
            <div className="color-swatches">
              {[
                { key: "indigo",  v: "#6366f1" },
                { key: "violet",  v: "#7c3aed" },
                { key: "blue",    v: "#2563eb" },
                { key: "emerald", v: "#059669" },
                { key: "amber",   v: "#d97706" },
              ].map(c => (
                <button key={c.key} className={"swatch " + (tweaks.accent === c.key ? "active" : "")}
                  style={{ background: c.v }}
                  onClick={() => updateTweak({ accent: c.key })} aria-label={c.key}/>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Arbeitszeiten</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-label">Standardstart</div>
            <input className="time-input mono" type="time" step="900"
              value={tweaks.defaultStart || "08:00"}
              onChange={(e) => updateTweak({ defaultStart: e.target.value })}/>
          </div>
          <div className="settings-sep"/>
          <div className="settings-row">
            <div className="settings-label">Standardende</div>
            <input className="time-input mono" type="time" step="900"
              value={tweaks.defaultEnd || "17:00"}
              onChange={(e) => updateTweak({ defaultEnd: e.target.value })}/>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Vorgesetzte/r</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-label">Name</div>
            <input className="input" style={{ maxWidth: 160, textAlign: "right" }}
              value={tweaks.manager || ""}
              onChange={(e) => updateTweak({ manager: e.target.value })}/>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Daten</div>
        <div className="settings-card">
          <button className="settings-row settings-action" onClick={() => {
            if (confirm("Alle lokalen Einträge löschen?")) {
              localStorage.removeItem(LS_ENTRIES);
              location.reload();
            }
          }}>
            <div>
              <div className="settings-label" style={{ color: "var(--sick)" }}>Alle Daten zurücksetzen</div>
              <div className="settings-hint">Lokale Einträge löschen</div>
            </div>
            <IChevronR size={16} color="var(--muted-fg)"/>
          </button>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "var(--muted-fg)", padding: "16px 0 8px" }}>
        Zeiterfassung · Version 1.0
      </div>
    </>
  );
}

/* ============================= MOUNT ============================= */
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);