// 📁 src/components/admin/Charts.jsx
// ✅ No name collisions with Recharts
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart as ReLineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = ["#E53E3E", "#3182CE", "#38A169", "#DD6B20", "#805AD5", "#319795"];

/** Column/Bar chart */
export function AppBarChart({ data, xKey = "mois", yKey = "total" }) {
  const safe = Array.isArray(data) ? data : [];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReBarChart data={safe}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey={yKey} />
      </ReBarChart>
    </ResponsiveContainer>
  );
}

/** Pie chart */
export function AppPieChart({ data, nameKey = "offre", valueKey = "total" }) {
  const safe = Array.isArray(data) ? data : [];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RePieChart>
        <Tooltip />
        <Pie
          data={safe}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {safe.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
      </RePieChart>
    </ResponsiveContainer>
  );
}

/** Line chart */
export function AppLineChart({ data, xKey = "mois", yKey = "total" }) {
  const safe = Array.isArray(data) ? data : [];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ReLineChart data={safe}>
        <XAxis dataKey={xKey} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Legend />
        <CartesianGrid stroke="#ccc" />
        <Line type="monotone" dataKey={yKey} stroke="#38A169" strokeWidth={2} />
      </ReLineChart>
    </ResponsiveContainer>
  );
}
