"use client";

import Link from "next/link";
import { campaigns, fleetMix, metrics, topStreets, type CampaignStatus } from "@/content/dashboard";
import { useAuth } from "@/lib/auth";
import { firstName } from "@/lib/machines/session";

function Spark({ points, trend }: { points: number[]; trend: "up" | "down" }) {
  const w = 120;
  const h = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / (max - min || 1)) * (h - 4) - 2;
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className={`spark spark--${trend}`} viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <path d={`${d} L${w} ${h} L0 ${h} Z`} className="spark__area" />
      <path d={d} className="spark__line" />
    </svg>
  );
}

const STATUS_CLASS: Record<CampaignStatus, string> = {
  Live: "live",
  Scheduled: "scheduled",
  "In production": "production",
  Draft: "draft",
};

/** Overview page of the signed-in app. All numbers are SAMPLE data from content/dashboard.ts. */
export default function DashboardView() {
  const { account } = useAuth();
  if (!account) return null;
  const fleetTotal = fleetMix.reduce((n, f) => n + f.count, 0);
  const topScans = Math.max(...topStreets.map((s) => s.scans));

  return (
    <div className="dview">
      <section className="dview__hello">
        <div>
          <h1>Welcome back, {firstName(account)}</h1>
          <p>Here&rsquo;s how your vehicles are performing over the last 30 days.</p>
        </div>
        <span className="dview__sample" title="Connect your campaigns to see live numbers">
          Sample data
        </span>
      </section>

      <section className="dview__metrics" aria-label="Key metrics">
        {metrics.map((m) => (
          <article key={m.label} className="metric">
            <p className="metric__label">{m.label}</p>
            <p className="metric__value">{m.value}</p>
            <div className="metric__foot">
              <span className={`metric__delta metric__delta--${m.trend}`}>{m.delta}</span>
              <Spark points={m.spark} trend={m.trend} />
            </div>
          </article>
        ))}
      </section>

      <div className="dview__grid">
        <section className="dcard dcard--wide" aria-labelledby="campaigns-title">
          <header className="dcard__head">
            <h2 id="campaigns-title">Campaigns</h2>
            <Link href="/contact" className="dcard__action">
              Plan a campaign →
            </Link>
          </header>
          <div className="dtable__wrap">
            <table className="dtable">
              <thead>
                <tr>
                  <th scope="col">Campaign</th>
                  <th scope="col">Format</th>
                  <th scope="col">Vehicles</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">
                    Impressions
                  </th>
                  <th scope="col" className="num">
                    QR scans
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.name}>
                    <th scope="row">{c.name}</th>
                    <td>{c.format}</td>
                    <td>{c.vehicles}</td>
                    <td>
                      <span className={`pill pill--${STATUS_CLASS[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="num">{c.impressions}</td>
                    <td className="num">{c.scans}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dcard" aria-labelledby="fleet-title">
          <header className="dcard__head">
            <h2 id="fleet-title">Fleet on the road</h2>
            <span className="dcard__meta">{fleetTotal} vehicles</span>
          </header>
          <ul className="bars">
            {fleetMix.map((f) => (
              <li key={f.label}>
                <span>{f.label}</span>
                <span className="bars__track">
                  <i style={{ width: `${(f.count / fleetTotal) * 100}%` }} />
                </span>
                <strong>{f.count}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="dcard" aria-labelledby="streets-title">
          <header className="dcard__head">
            <h2 id="streets-title">Top streets by QR scans</h2>
          </header>
          <ul className="bars bars--orange">
            {topStreets.map((s) => (
              <li key={s.street}>
                <span>{s.street}</span>
                <span className="bars__track">
                  <i style={{ width: `${(s.scans / topScans) * 100}%` }} />
                </span>
                <strong>{s.scans.toLocaleString("en-US")}</strong>
              </li>
            ))}
          </ul>
        </section>

        <section className="dcard dcard--wide dcard--steps" aria-labelledby="next-title">
          <header className="dcard__head">
            <h2 id="next-title">Get your first campaign on the road</h2>
          </header>
          <ol className="steps-mini">
            <li>
              <strong>Complete your profile</strong>
              <span>Add your name and company so we can tailor proposals.</span>
              <Link href="/dashboard/settings">Open settings</Link>
            </li>
            <li>
              <strong>Pick formats and streets</strong>
              <span>Buses, trains or taxis, on the routes your customers use.</span>
              <Link href="/#formats">Explore formats</Link>
            </li>
            <li>
              <strong>Send your creative</strong>
              <span>Our Wrap Studio fits it to each vehicle and adds a QR code.</span>
              <Link href="/contact">Talk to the studio</Link>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
