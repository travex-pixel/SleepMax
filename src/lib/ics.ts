/*
  A calendar file is the one reminder mechanism a web page can offer that
  actually works when the page is closed: the user's own calendar app does the
  reminding. Generated entirely on the device.
*/

import type { Thought } from "./thoughts";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Floating local time, no zone, so 9am means 9am wherever the device wakes up. */
export function formatLocal(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

export function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fold lines at 75 octets per RFC 5545. */
export function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > 73) {
      out.push(cur);
      cur = " " + ch;
      bytes = 1 + b;
    } else {
      cur += ch;
      bytes += b;
    }
  }
  out.push(cur);
  return out.join("\r\n");
}

export function tomorrowAt(hour: number, now = new Date()): Date {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export function buildIcs(thoughts: Thought[], when: Date, stamp = new Date()): string {
  const end = new Date(when.getTime() + 15 * 60_000);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OFFMODE//Parked thoughts//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  const summary = thoughts.length === 1 ? (thoughts[0]?.text ?? "Parked thought") : `${thoughts.length} things you parked last night`;
  const description = thoughts.map((t) => `• ${t.text}`).join("\n");
  lines.push(
    "BEGIN:VEVENT",
    `UID:offmode-${stamp.getTime()}@local`,
    `DTSTAMP:${formatLocal(stamp)}`,
    `DTSTART:${formatLocal(when)}`,
    `DTEND:${formatLocal(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Parked last night",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function downloadIcs(content: string, filename = "offmode-tomorrow.ics"): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
