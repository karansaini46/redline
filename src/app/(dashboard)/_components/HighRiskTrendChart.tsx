"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";

interface HighRiskTrendChartProps {
  data: {
    date: string;
    count: number;
  }[];
}

export function HighRiskTrendChart({ data }: HighRiskTrendChartProps) {
  // Sort data by date just in case
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Let's compute a cumulative sum to show the trend properly, as requested by "trend over the last 90 days".
  // Or we just plot the raw count of high-risk contracts per day.
  // The prompt asks for "high-risk contract count over the last 90 days". We'll just plot the query results (daily counts).
  // If the query didn't return a day, it would be 0, but since it's a line chart, Recharts connects the dots.
  
  const formattedData = sortedData.map(item => ({
    ...item,
    displayDate: format(parseISO(item.date), "MMM d")
  }));

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="displayDate" 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            minTickGap={20}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip 
            cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '3 3' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ fontWeight: 'bold', color: '#374151' }}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#ef4444" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            name="High-Risk Contracts"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
