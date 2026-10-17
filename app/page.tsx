export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-[var(--primary)]">
              AGRIORBIT
            </p>

            <h1 className="text-3xl font-bold text-[var(--text)]">
              Farmer & Field Data Collection Platform
            </h1>

            <p className="mt-3 text-[var(--muted)]">
              Digitizing structured agricultural field data collection.
            </p>
          </div>

          <div className="rounded-lg bg-[var(--light-green)] p-4">
            <p className="text-sm text-[var(--text)]">
              Development environment is working successfully.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}