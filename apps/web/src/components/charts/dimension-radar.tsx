"use client";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

/** Abbreviate long dimension names to fit mobile radar chart */
const DIMENSION_ABBREV: Record<string, string> = {
  'Task Fulfilment': 'Task',
  'Language & Style': 'Lang/Style',
  'Language & Expression': 'Lang/Expr',
  'Organisation & Structure': 'Structure',
  'Organisation & Coherence': 'Coherence',
  'Style & Expression': 'Style',
  'Content & Development': 'Content',
};

function abbreviate(label: string): string {
  if (DIMENSION_ABBREV[label]) return DIMENSION_ABBREV[label];
  // Fallback: take first word before & or limit to 10 chars
  const short = label.split(/\s*[&]\s*/)[0].trim();
  return short.length > 10 ? short.slice(0, 9) + '…' : short;
}

interface DimensionRadarProps {
  data: { dimension: string; score: number; maxScore: number }[];
}

export function DimensionRadar({ data }: DimensionRadarProps) {
  const normalized = data.map((d) => ({
    dimension: d.dimension,
    label: abbreviate(d.dimension),
    score: d.score,
    fullMark: d.maxScore,
  }));

  return (
    <div className="w-full h-[280px] sm:h-[300px]">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Dimension Breakdown</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={normalized} cx="50%" cy="50%" outerRadius="60%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="label" fontSize={11} tick={{ fill: '#6b7280' }} />
          <PolarRadiusAxis domain={[0, 10]} tick={false} />
          <Tooltip
            formatter={(value: number) => [value, 'Score']}
            labelFormatter={(label) => {
              const match = normalized.find((d) => d.label === label);
              return match?.dimension ?? label;
            }}
          />
          <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
