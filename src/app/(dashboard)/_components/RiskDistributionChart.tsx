"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ClauseType, RiskSeverity } from "@prisma/client";

interface RiskDistributionChartProps {
  data: {
    clause_type: ClauseType;
    risk_severity: RiskSeverity;
    count: number;
  }[];
}

const colorMap: Record<RiskSeverity, string> = {
  LOW: "#22c55e", // green-500
  MEDIUM: "#eab308", // yellow-500
  HIGH: "#f97316", // orange-500
  CRITICAL: "#ef4444", // red-500
};

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  type TransformedData = {
    name: ClauseType;
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };

  // Transform data for stacked bar chart: { clause_type: string, LOW: number, MEDIUM: number, HIGH: number, CRITICAL: number }
  const transformed = data.reduce((acc, curr) => {
    let existing = acc.find(item => item.name === curr.clause_type);
    if (!existing) {
      existing = { name: curr.clause_type, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
      acc.push(existing);
    }
    existing[curr.risk_severity] = curr.count;
    return acc;
  }, [] as TransformedData[]);

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={transformed} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="LOW" stackId="a" fill={colorMap.LOW} radius={[0, 0, 0, 0]} />
          <Bar dataKey="MEDIUM" stackId="a" fill={colorMap.MEDIUM} radius={[0, 0, 0, 0]} />
          <Bar dataKey="HIGH" stackId="a" fill={colorMap.HIGH} radius={[0, 0, 0, 0]} />
          <Bar dataKey="CRITICAL" stackId="a" fill={colorMap.CRITICAL} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
