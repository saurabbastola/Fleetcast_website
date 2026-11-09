"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import { useInView } from "@/lib/useInView";

type Country = { id: string; name: string; d: string; active: boolean; order: number; cx: number };
type Tip = { name: string; active: boolean; x: number; y: number };
/** Shape loading: loading → ready | error. Exposed as `data-status`. */
type MapLoad = { status: "loading" } | { status: "ready"; countries: Country[] } | { status: "error" };

const W = 960;
const H = 620;

/**
 * World map with Fleetcast's markets highlighted. Country shapes come from the
 * `world-atlas` package (Natural Earth, 1:110m) and are loaded lazily.
 */
export default function GlobalMap({ markets }: { markets: string[] }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 });
  const box = useRef<HTMLDivElement | null>(null);
  const [load, setLoad] = useState<MapLoad>({ status: "loading" });
  const countries = load.status === "ready" ? load.countries : null;
  const [tip, setTip] = useState<Tip | null>(null);
  const marketKey = markets.join(",");

  useEffect(() => {
    let cancelled = false;
    Promise.all([import("world-atlas/countries-110m.json"), import("topojson-client")])
      .then(([atlas, topo]) => {
        if (cancelled) return;
        const raw = (atlas as unknown as { default?: unknown }).default ?? atlas;
        const topology = raw as Topology;
        const fc = topo.feature(topology, topology.objects.countries) as unknown as FeatureCollection<
          Geometry,
          { name?: string }
        >;
        const features = fc.features.filter((f) => String(f.id ?? "") !== "010"); // drop Antarctica
        const projection = geoMercator().fitExtent(
          [
            [2, 2],
            [W - 2, H - 2],
          ],
          { type: "FeatureCollection", features } as FeatureCollection
        );
        const path = geoPath(projection);
        const active = new Set(marketKey.split(","));
        const list: Country[] = features
          .map((f) => {
            const id = String(f.id ?? "");
            return {
              id,
              name: f.properties?.name ?? "",
              d: path(f) ?? "",
              active: active.has(id),
              order: 0,
              cx: path.centroid(f)[0] || 0,
            };
          })
          .filter((c) => c.d);
        list
          .filter((c) => c.active)
          .sort((a, b) => a.cx - b.cx)
          .forEach((c, i) => {
            c.order = i;
          });
        setLoad({ status: "ready", countries: list });
      })
      .catch(() => !cancelled && setLoad({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [marketKey]);

  const move = (e: ReactMouseEvent<SVGPathElement>, c: Country) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({ name: c.name, active: c.active, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={(el) => {
        ref.current = el;
        box.current = el;
      }}
      className={`gmap${inView ? " is-in" : ""}${countries ? " is-ready" : ""}`}
      data-status={load.status}
    >
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="World map highlighting the countries where Fleetcast runs campaigns">
        {countries?.map((c) => (
          <path
            key={c.id + c.name}
            d={c.d}
            className={`gmap__c${c.active ? " is-active" : ""}`}
            style={{ "--i": c.order } as CSSProperties}
            onMouseMove={(e) => move(e, c)}
            onMouseLeave={() => setTip(null)}
          />
        ))}
      </svg>
      {load.status === "error" && <p className="gmap__error">The map couldn&rsquo;t load. Refresh the page to try again.</p>}
      {tip && tip.name && (
        <div className="gmap__tip" style={{ left: tip.x, top: tip.y }}>
          <strong>{tip.name}</strong>
          {tip.active && <span>Active market</span>}
        </div>
      )}
    </div>
  );
}
