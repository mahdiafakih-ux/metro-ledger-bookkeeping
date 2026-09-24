export default function PortalLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading…</span>
      <div className="space-y-2">
        <div className="portal-skeleton h-7 w-64 rounded-md" />
        <div className="portal-skeleton h-4 w-80 max-w-full rounded-md" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="portal-skeleton h-44 rounded-xl lg:col-span-2" />
        <div className="portal-skeleton h-44 rounded-xl" />
      </div>
      <div className="portal-skeleton h-64 rounded-xl" />
    </div>
  );
}
