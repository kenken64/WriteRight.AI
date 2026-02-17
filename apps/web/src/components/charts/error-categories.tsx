"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/** Truncate long error category text for chart labels */
function truncateCategory(text: string, maxLen: number = 30): string {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
}

interface ErrorCategoriesProps {
  data: { category: string; count: number }[];
}

export function ErrorCategories({ data }: ErrorCategoriesProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const chartData = sorted.map((d) => ({
    ...d,
    label: truncateCategory(d.category),
  }));

  // Scale height based on number of categories (min 200, ~40px per bar)
  const chartHeight = Math.max(200, sorted.length * 40 + 40);

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <h3 className="text-sm font-medium text-gray-500 mb-2">Common Error Categories</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" fontSize={12} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            fontSize={11}
            width={120}
            tick={{ fill: '#6b7280' }}
            interval={0}
          />
          <Tooltip
            formatter={(value: number) => [value, 'Occurrences']}
            labelFormatter={(label) => {
              const match = chartData.find((d) => d.label === label);
              return match?.category ?? label;
            }}
          />
          <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
