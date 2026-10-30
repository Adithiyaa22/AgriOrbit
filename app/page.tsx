import Link from "next/link";
import {
  ArrowRight,
  CloudOff,
  Database,
  MapPinned,
  ShieldCheck,
  Smartphone,
  Sprout,
  Wifi,
  Leaf,
  BarChart3,
  Sprout as SproutIcon,
  Droplets,
} from "lucide-react";
import PWAInstallButton from "@/components/pwa/PWAInstallButton";

const features = [
  {
    icon: Sprout,
    title: "Farmer Profiles",
    description: "Capture structured farmer information and keep records organized in one place.",
  },
  {
    icon: MapPinned,
    title: "Field Data",
    description: "Register agricultural fields and keep field-level information connected to farmers.",
  },
  {
    icon: CloudOff,
    title: "Offline Surveys",
    description: "Continue collecting survey data when network connectivity is unavailable.",
  },
  {
    icon: Database,
    title: "Secure Sync",
    description: "Sync collected field data when the connection returns without changing the existing workflow.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6faf7] text-slate-800">
      <div className="absolute inset-x-0 top-0 -z-0 h-[620px] bg-[radial-gradient(circle_at_50%_0%,rgba(46,125,50,0.13),transparent_62%)]" />
      <div className="absolute -left-32 top-40 -z-0 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="absolute -right-32 top-72 -z-0 h-80 w-80 rounded-full bg-lime-100/50 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-emerald-100/80 py-5">
          <Link href="/" className="flex items-center gap-3" aria-label="AgriOrbit home">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2e7d32] text-white shadow-lg shadow-emerald-900/10">
              <Sprout size={23} strokeWidth={2.4} />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-[#24652a]">AgriOrbit</div>
              <div className="text-[11px] font-medium tracking-wide text-slate-500">FIELD DATA COLLECTION</div>
            </div>
          </Link>

          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-white px-5 text-sm font-bold text-[#24652a] shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50"
          >
            Sign In
          </Link>
        </header>

        <section className="relative pt-14 text-center sm:pt-20 lg:pt-24">
          <div className="agri-hero-orbit agri-hero-3d" aria-hidden="true">
            <div className="agri-orbit-ring agri-orbit-ring-one" />
            <div className="agri-orbit-ring agri-orbit-ring-two" />
            <div className="agri-orbit-ring agri-orbit-ring-three" />
            <div className="agri-orbit-core"><SproutIcon size={42} strokeWidth={1.8} /></div>
            <div className="agri-orbit-leaf agri-leaf-one"><Leaf size={20} /></div>
            <div className="agri-orbit-leaf agri-leaf-two"><Leaf size={16} /></div>
            <div className="agri-orbit-leaf agri-leaf-three"><Leaf size={18} /></div>
            <div className="agri-orbit-drop"><Droplets size={17} /></div>
          </div>
          <div className="relative z-10 mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-xs font-bold text-[#2e7d32] shadow-sm backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Farmer &amp; Field Data Collection Platform
            <ArrowRight size={13} />
          </div>

          <h1 className="relative z-10 mx-auto mt-7 max-w-5xl text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Empower field surveys anywhere —{" "}
            <span className="bg-gradient-to-r from-[#2e7d32] via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              online or offline.
            </span>
          </h1>

          <p className="relative z-10 mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Collect farmer profiles, register agricultural fields, and submit surveys even when connectivity is unreliable. Data can be synchronized when the connection returns.
          </p>

          <div className="relative z-10 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PWAInstallButton />
            <Link
              href="/login"
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md sm:w-auto"
            >
              Continue in Browser
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="relative z-10 mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Smartphone size={14} className="text-[#2e7d32]" /> Android-friendly PWA</span>
            <span className="inline-flex items-center gap-1.5"><Wifi size={14} className="text-[#2e7d32]" /> Online + offline workflow</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#2e7d32]" /> Role-based access</span>
          </div>
        </section>

        <div className="relative mx-auto mt-12 h-10 max-w-5xl sm:mt-14" aria-hidden="true">
          <div className="agri-field-line agri-field-line-a" />
          <div className="agri-field-line agri-field-line-b" />
          <div className="agri-field-line agri-field-line-c" />
        </div>

        <section className="agri-3d-card agri-preview-scene mx-auto mt-3 max-w-6xl sm:mt-5 lg:mt-8" aria-label="AgriOrbit application preview">
          <div className="agri-preview-shell rounded-[28px] bg-slate-950 p-2 shadow-[0_30px_80px_rgba(15,23,42,0.20)] ring-1 ring-slate-900/10 sm:p-3">
            <div className="overflow-hidden rounded-[22px] border border-white/10 bg-white">
              <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-xs text-slate-300 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                </div>
                <div className="hidden rounded-md bg-slate-800 px-4 py-1.5 text-[10px] text-slate-400 sm:block">agriorbit · field collection</div>
                <div className="flex items-center gap-1.5 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</div>
              </div>

              <div className="bg-slate-50 p-4 text-left sm:p-7">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">Field Survey Dashboard</h2>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">FIELD DATA</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Farmer records, registered fields and survey collection</p>
                  </div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    <CloudOff size={15} /> Offline ready
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    ["Farmers", "58", "Registered"],
                    ["Fields", "86", "Mapped"],
                    ["Surveys", "124", "Recorded"],
                    ["Photos", "248", "Collected"],
                  ].map(([label, value, caption]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="text-xs font-semibold text-slate-500">{label}</div>
                      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
                      <div className="mt-1 text-[10px] font-medium text-emerald-600">{caption}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">Recent field activity</div>
                        <div className="mt-1 text-xs text-slate-500">Latest collection activity from the field team</div>
                      </div>
                      <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">SYNCED</span>
                    </div>
                    <div className="mt-5 space-y-3">
                      {["Farmer profile updated", "New field registered", "Survey submitted"].map((item, index) => (
                        <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">{index + 1}</div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-bold text-slate-700">{item}</div>
                            <div className="mt-0.5 text-[10px] text-slate-400">Field collection workflow</div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">Today</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-sm font-extrabold text-slate-900">Collection status</div>
                    <div className="mt-1 text-xs text-slate-500">Stay productive even with limited connectivity.</div>
                    <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800">Data ready to sync</span>
                        <span className="text-lg font-black text-emerald-700">12</span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
                        <div className="h-full w-3/4 rounded-full bg-emerald-500" />
                      </div>
                      <p className="mt-3 text-[10px] leading-5 text-emerald-700/80">Your field team can continue collecting and synchronize when connectivity returns.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-600">Built for field teams</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Designed for real-world data collection.</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">A focused workflow for capturing reliable farmer, field and survey information without making the field process complicated.</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="agri-feature-card group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-[#2e7d32] group-hover:text-white">
                  <Icon size={21} />
                </div>
                <h3 className="mt-5 font-extrabold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-emerald-100 py-7 text-center text-xs text-slate-500">
          AgriOrbit · Farmer &amp; Field Data Collection Platform
        </footer>
      </div>
    </main>
  );
}
