import { useState } from "react";
import { ChecklistSection } from "./components/checklist-section";
import { ScheduleSection } from "./components/schedule-section";
import { Badge, Button, Card, Input } from "./components/ui";
import { useAuth } from "./lib/queries";

type TopLevelSection = "checklist" | "schedule";

export default function App() {
  const { authStatus, authError, dataError, loadingData, ready, login } = useAuth();
  const [section, setSection] = useState<TopLevelSection>("checklist");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (authStatus === "loading") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md space-y-3 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Gati</div>
          <h1 className="text-2xl font-semibold">Loading workspace</h1>
          <p className="text-sm text-muted">Checking access and loading data.</p>
        </Card>
      </div>
    );
  }

  if (authStatus !== "signed-in") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md space-y-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Gati</div>
            <h1 className="mt-1 text-2xl font-semibold">Enter PIN</h1>
            <p className="mt-2 text-sm text-muted">
              This device needs a shared PIN to sync with the backend.
            </p>
          </div>
          <Input
            inputMode="numeric"
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="PIN"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitPin();
              }
            }}
          />
          {authError ? <div className="text-sm text-rose-700">{authError}</div> : null}
          <Button
            onClick={() => void submitPin()}
            disabled={submitting || pin.trim().length === 0}
            className="w-full"
          >
            {submitting ? "Checking..." : "Unlock"}
          </Button>
        </Card>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md space-y-3 text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Gati</div>
          <h1 className="text-2xl font-semibold">Syncing data</h1>
          <p className="text-sm text-muted">
            {loadingData ? "Pulling your latest items." : "Waiting for app data."}
          </p>
          {dataError ? <div className="text-sm text-rose-700">{dataError}</div> : null}
        </Card>
      </div>
    );
  }

  async function submitPin() {
    if (!pin.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      await login(pin);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Gati</div>
            <h1 className="mt-1 text-2xl font-semibold">Momentum, mapped.</h1>
          </div>
          <Badge tone="muted">Local-first</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={section === "checklist" ? "default" : "secondary"}
            onClick={() => setSection("checklist")}
          >
            Checklist
          </Button>
          <Button
            variant={section === "schedule" ? "default" : "secondary"}
            onClick={() => setSection("schedule")}
          >
            Schedule
          </Button>
        </div>
      </Card>

      <ChecklistSection visible={section === "checklist"} />
      <ScheduleSection visible={section === "schedule"} />
    </div>
  );
}
