export default function AdminDashboard() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="rounded-xl border bg-card px-8 py-10 text-center shadow-sm">
        <h1 className="text-xl font-semibold">
          Willkommen im Verwaltungsbereich.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Wähle links einen Bereich, um zu beginnen.
        </p>
      </div>
    </div>
  );
}
