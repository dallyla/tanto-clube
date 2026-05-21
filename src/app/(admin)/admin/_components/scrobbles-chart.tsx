"use client";

import { useState } from "react";

interface Props {
  dayData: number[];
  highlightDay: number | null;
  monthName: string;
  currentDay: number;
}

export function ScrobblesChart({ dayData, highlightDay, monthName, currentDay }: Props) {
  const [activeBar, setActiveBar] = useState<number | null>(null);

  const numDays = dayData.length;
  const maxCount = Math.max(...dayData, 1);

  const vbW = 560;
  const barAreaH = 100;
  // extra space: 16px for day numbers + 18px for month labels at bottom
  const vbH = barAreaH + 34;
  const totalSlot = vbW / numDays;
  const barW = Math.max(totalSlot * 0.68, 3);

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      width="100%"
      style={{ display: "block", overflow: "visible" }}
      aria-label={`Scrobbles por dia em ${monthName}`}
    >
      {dayData.map((count, i) => {
        const cx = i * totalSlot + totalSlot / 2;
        const x = cx - barW / 2;
        const h = count > 0 ? Math.max((count / maxCount) * barAreaH, 3) : 2;
        const y = barAreaH - h;
        const isHighlight = highlightDay === i + 1;
        const isActive = activeBar === i;
        const day = i + 1;

        // Tooltip box: clamp so it never goes outside vbW
        const tipW = count >= 1000 ? 52 : count >= 100 ? 44 : 36;
        const tipX = Math.min(Math.max(cx - tipW / 2, 0), vbW - tipW);
        const tipY = Math.max(y - 30, -28);

        return (
          <g
            key={i}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setActiveBar(i)}
            onMouseLeave={() => setActiveBar(null)}
            onClick={() => setActiveBar(activeBar === i ? null : i)}
          >
            {/* Wide invisible hit area */}
            <rect x={x - 3} y={0} width={barW + 6} height={barAreaH + 16} fill="transparent" />

            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, 2)}
              rx="2"
              style={{
                fill: isHighlight ? "#c4314b" : "#c8a45c",
                opacity: isActive ? 1 : count === 0 ? 0.22 : 0.82,
                transition: "opacity 0.12s",
              }}
            />

            {/* Day number label */}
            <text
              x={cx}
              y={barAreaH + 14}
              style={{
                fill: isActive
                  ? isHighlight ? "#c4314b" : "#c8a45c"
                  : "rgba(244,234,213,0.38)",
                fontSize: "8px",
                fontFamily: "system-ui, sans-serif",
                textAnchor: "middle",
                transition: "fill 0.12s",
              }}
            >
              {day}
            </text>

            {/* Tooltip */}
            {isActive && (
              <g>
                <rect
                  x={tipX}
                  y={tipY}
                  width={tipW}
                  height={20}
                  rx="4"
                  style={{ fill: "#1a1008", opacity: 0.95 }}
                />
                <text
                  x={tipX + tipW / 2}
                  y={tipY + 14}
                  style={{
                    fill: isHighlight ? "#c4314b" : "#c8a45c",
                    fontSize: "11px",
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: "700",
                    textAnchor: "middle",
                  }}
                >
                  {count > 0 ? count.toLocaleString("pt-BR") : "—"}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Bottom: "1 mai" label */}
      <text
        x="0"
        y={vbH}
        style={{
          fill: "rgba(244,234,213,0.28)",
          fontSize: "9px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        1 {monthName.slice(0, 3)}
      </text>

      {/* Bottom: last day label */}
      <text
        x={vbW}
        y={vbH}
        style={{
          fill: "rgba(244,234,213,0.28)",
          fontSize: "9px",
          fontFamily: "system-ui, sans-serif",
          textAnchor: "end",
        }}
      >
        {currentDay} {monthName.slice(0, 3)}
      </text>

      {/* Launch day marker */}
      {highlightDay !== null && highlightDay <= numDays && (
        <>
          <line
            x1={((highlightDay - 1) * totalSlot + totalSlot / 2)}
            y1={barAreaH + 16}
            x2={((highlightDay - 1) * totalSlot + totalSlot / 2)}
            y2={barAreaH + 21}
            style={{ stroke: "#c4314b", strokeWidth: 1 }}
          />
          <text
            x={Math.min(
              Math.max((highlightDay - 1) * totalSlot + totalSlot / 2, 52),
              vbW - 60
            )}
            y={vbH}
            style={{
              fill: "#c4314b",
              fontSize: "9px",
              fontFamily: "system-ui, sans-serif",
              textAnchor: "middle",
            }}
          >
            {highlightDay} {monthName.slice(0, 3)} · lançamento
          </text>
        </>
      )}
    </svg>
  );
}
