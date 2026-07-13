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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333333" />
          <XAxis 
            dataKey="displayDate" 
            tick={{ fontSize: 11, fill: '#a3a3a3', fontFamily: 'var(--font-geist-mono)' }} 
            tickLine={false}
            axisLine={{ stroke: '#333333' }}
            minTickGap={20}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#a3a3a3', fontFamily: 'var(--font-geist-mono)' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip 
            cursor={{ stroke: '#333333', strokeWidth: 1, strokeDasharray: '3 3' }}
            contentStyle={{ borderRadius: '0px', border: '1px solid #333333', backgroundColor: '#0a0a0a', boxShadow: 'none' }}
            itemStyle={{ color: '#ffffff' }}
            labelStyle={{ fontWeight: 'normal', color: '#a3a3a3', fontFamily: 'var(--font-geist-mono)', fontSize: '12px' }}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#ffffff" 
            strokeWidth={2}
            dot={{ r: 3, fill: '#ffffff', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0, fill: '#ffffff' }}
            name="High-Risk Contracts"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
