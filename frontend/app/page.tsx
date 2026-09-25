"use client";

import {
  Activity,
  AlertTriangle,
  Bell,
  HeartPulse,
  LayoutDashboard,
  Settings,
  Users,
  TrendingUp,
  Thermometer,
  Wind,
  Droplets,
  Clock,
} from "lucide-react";

const patients = [
  {
    name: "M. Anderson",
    id: "PT-10482",
    bed: "ICU-04",
    hr: 118,
    bp: "92/58",
    spo2: 91,
    rr: 27,
    temp: 38.9,
    lactate: 3.8,
    risk: 87,
    status: "Critical",
  },
  {
    name: "J. Williams",
    id: "PT-10477",
    bed: "ICU-02",
    hr: 102,
    bp: "101/64",
    spo2: 94,
    rr: 23,
    temp: 38.1,
    lactate: 2.7,
    risk: 64,
    status: "Watch",
  },
  {
    name: "S. Patel",
    id: "PT-10491",
    bed: "ICU-07",
    hr: 96,
    bp: "109/68",
    spo2: 96,
    rr: 19,
    temp: 37.7,
    lactate: 1.9,
    risk: 42,
    status: "Watch",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#061019] text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-64 border-r border-white/10 bg-[#030b12] lg:block">
          <div className="flex h-24 items-center gap-3 border-b border-white/10 px-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Activity size={24} />
            </div>

            <div>
              <h1 className="text-lg font-semibold">SepsisAI</h1>
              <p className="text-xs text-slate-500">
                Clinical intelligence
              </p>
            </div>
          </div>

          <nav className="space-y-2 p-4">
            <NavItem icon={<LayoutDashboard size={19} />} text="Overview" active />
            <NavItem icon={<Users size={19} />} text="Patients" />
            <NavItem icon={<Bell size={19} />} text="Alerts" />
            <NavItem icon={<TrendingUp size={19} />} text="Analytics" />
            <NavItem icon={<Settings size={19} />} text="Settings" />
          </nav>
        </aside>

        {/* MAIN */}
        <section className="flex-1">
          {/* HEADER */}
          <header className="flex h-24 items-center justify-between border-b border-white/10 px-6 lg:px-10">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-slate-500">
                ICU MONITORING CENTER
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Overview</h2>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden items-center gap-2 text-sm text-emerald-400 md:flex">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
                Live monitoring
              </div>

              <div className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
                <Clock size={16} />
                20:42
              </div>

              <button className="rounded-xl border border-white/10 p-3 text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-400">
                <Bell size={18} />
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#0c1b27] text-sm font-semibold text-slate-400">
                DR
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <div className="p-6 lg:p-10">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs tracking-[0.18em] text-slate-500">
                  TUESDAY, SEPTEMBER 6, 2026 · 20:42 LOCAL TIME
                </p>

                <h3 className="mt-4 text-3xl font-semibold">
                  Good evening, Dr. Rivera
                </h3>

                <p className="mt-2 text-slate-400">
                  Here is the current status of your intensive care unit.
                </p>
              </div>

              <button className="hidden rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400 md:block">
                Start clinical rounds
              </button>
            </div>

            {/* STAT CARDS */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard
                title="TOTAL ICU PATIENTS"
                value="24"
                description="2 admissions today"
                icon={<Users size={20} />}
              />

              <StatCard
                title="HIGH-RISK PATIENTS"
                value="02"
                description="Requires immediate review"
                icon={<AlertTriangle size={20} />}
                danger
              />

              <StatCard
                title="MEDIUM-RISK PATIENTS"
                value="02"
                description="Close monitoring advised"
                icon={<AlertTriangle size={20} />}
                warning
              />

              <StatCard
                title="LOW-RISK PATIENTS"
                value="02"
                description="Stable condition"
                icon={<HeartPulse size={20} />}
                success
              />

              <StatCard
                title="AVERAGE SEPSIS RISK"
                value="51%"
                description="↑ 4% from 6 hours ago"
                icon={<Activity size={20} />}
              />
            </div>

            {/* CHART + ALERTS */}
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.8fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-[#0b1a26] p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs tracking-[0.15em] text-slate-500">
                      UNIT OVERVIEW
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">
                      Average sepsis risk
                    </h3>
                  </div>

                  <div className="text-xs text-slate-500">
                    <span className="mr-5 text-cyan-400">━ Risk score</span>
                    <span>━ Alert threshold</span>
                  </div>
                </div>

                <div className="mt-8 h-56">
                  <RiskChart />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0b1a26] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs tracking-[0.15em] text-slate-500">
                      REQUIRES REVIEW
                    </p>
                    <h3 className="mt-2 text-xl font-semibold">
                      Recent alerts
                    </h3>
                  </div>

                  <button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-cyan-400 hover:border-cyan-400/40">
                    View all →
                  </button>
                </div>

                <div className="mt-5">
                  <AlertRow
                    title="Rising lactate detected"
                    patient="PT-10482 · ICU-04"
                    time="20:38"
                  />

                  <AlertRow
                    title="MAP below threshold"
                    patient="PT-10486 · ICU-03"
                    time="20:31"
                  />

                  <AlertRow
                    title="Respiratory rate elevated"
                    patient="PT-10477 · ICU-02"
                    time="20:12"
                  />
                </div>
              </div>
            </div>

            {/* ATTENTION + CAPACITY */}
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.8fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-[#0b1a26] p-6">
                <p className="text-xs tracking-[0.15em] text-slate-500">
                  PRIORITIZED BY MODEL
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  Patients requiring attention
                </h3>

                <div className="mt-5 space-y-2">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between rounded-xl px-3 py-4 hover:bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-11 w-1 rounded-full ${
                            patient.risk >= 70
                              ? "bg-red-400"
                              : "bg-amber-400"
                          }`}
                        />

                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-xs text-slate-500">
                            {patient.id} · {patient.bed}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {patient.risk >= 70
                              ? "Immediate clinical review recommended"
                              : "Continue close monitoring"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          patient.risk >= 70
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {patient.risk}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0b1a26] p-6">
                <p className="text-xs tracking-[0.15em] text-slate-500">
                  UNIT CAPACITY
                </p>

                <h3 className="mt-2 text-xl font-semibold">
                  ICU utilization
                </h3>

                <div className="mt-8">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-semibold">24</span>
                    <span className="mb-1 text-sm text-slate-500">
                      / 28 beds occupied
                    </span>
                  </div>

                  <div className="mt-5 h-2 rounded-full bg-slate-800">
                    <div className="h-2 w-[86%] rounded-full bg-cyan-400" />
                  </div>

                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>4 beds available</span>
                    <span>86% utilized</span>
                  </div>
                </div>

                <div className="mt-8 space-y-4 border-t border-white/10 pt-5">
                  <StatusRow label="Telemetry connected" value="24 / 24" />
                  <StatusRow label="Data freshness" value="< 30 sec" />
                </div>
              </div>
            </div>

            {/* PATIENT TABLE */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1a26]">
              <div className="flex items-center justify-between border-b border-white/10 p-6">
                <div>
                  <p className="text-xs tracking-[0.15em] text-slate-500">
                    LIVE TELEMETRY
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">
                    Patient monitoring
                  </h3>
                </div>

                <button className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400/40">
                  Search
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-xs tracking-wider text-slate-500">
                      <th className="px-6 py-4">PATIENT</th>
                      <th>BED</th>
                      <th>HR</th>
                      <th>BP</th>
                      <th>SPO₂</th>
                      <th>RR</th>
                      <th>TEMP</th>
                      <th>LACTATE</th>
                      <th>SEPSIS RISK</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {patients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="border-b border-white/10 text-sm transition hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-5">
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-xs text-slate-500">
                            {patient.id}
                          </p>
                        </td>

                        <td>{patient.bed}</td>
                        <td>{patient.hr} bpm</td>
                        <td>{patient.bp}</td>
                        <td>{patient.spo2}%</td>
                        <td>{patient.rr}</td>
                        <td className="text-amber-400">
                          {patient.temp}°
                        </td>
                        <td className="text-red-400">
                          {patient.lactate}
                        </td>

                        <td>
                          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                            {patient.risk}%
                          </span>
                        </td>

                        <td>
                          <span className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="h-2 w-2 rounded-full bg-red-400" />
                            {patient.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function NavItem({
  icon,
  text,
  active = false,
}: {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
        active
          ? "bg-cyan-500/10 text-cyan-400"
          : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-200"
      }`}
    >
      {icon}
      {text}
    </button>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  danger,
  warning,
  success,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  danger?: boolean;
  warning?: boolean;
  success?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1a26] p-5">
      <div className="flex items-start justify-between">
        <p className="max-w-[130px] text-xs font-medium tracking-wider text-slate-500">
          {title}
        </p>

        <div
          className={`rounded-lg p-2 ${
            danger
              ? "bg-red-500/10 text-red-400"
              : warning
              ? "bg-amber-500/10 text-amber-400"
              : success
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-cyan-500/10 text-cyan-400"
          }`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-5 text-3xl font-semibold">{value}</p>

      <p
        className={`mt-3 text-xs ${
          danger
            ? "text-red-400"
            : warning
            ? "text-amber-400"
            : success
            ? "text-emerald-400"
            : "text-cyan-400"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function AlertRow({
  title,
  patient,
  time,
}: {
  title: string;
  patient: string;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-4 last:border-0">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
          <AlertTriangle size={17} />
        </div>

        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{patient}</p>
        </div>
      </div>

      <span className="text-xs text-slate-500">{time}</span>
    </div>
  );
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-slate-400">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        {label}
      </div>

      <span className="font-medium text-slate-300">{value}</span>
    </div>
  );
}

function RiskChart() {
  const points = "0,180 100,174 200,160 300,142 400,117 500,88 600,62";

  return (
    <svg
      viewBox="0 0 600 200"
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      <line
        x1="0"
        y1="70"
        x2="600"
        y2="70"
        stroke="currentColor"
        className="text-amber-400/50"
        strokeDasharray="6 6"
      />

      <line
        x1="0"
        y1="120"
        x2="600"
        y2="120"
        stroke="currentColor"
        className="text-slate-700"
        strokeDasharray="4 6"
      />

      <line
        x1="0"
        y1="170"
        x2="600"
        y2="170"
        stroke="currentColor"
        className="text-slate-700"
        strokeDasharray="4 6"
      />

      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-cyan-400"
      />

      <polygon
        points={`${points} 600,200 0,200`}
        fill="currentColor"
        className="text-cyan-400/10"
      />
    </svg>
  );
}