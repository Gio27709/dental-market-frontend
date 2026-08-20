import PropTypes from "prop-types";
import { shortDate } from "./format";
import {
  ComposedChart, Area, Bar, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from "recharts";

/**
 * Curva diaria de alcance, vistas e interacciones. La usan el historial de la
 * lista (todas las publicaciones) y la ficha de una sola: mismos datos, misma
 * lectura, así que mismo gráfico.
 *
 * El alcance va de área y las vistas de línea encima a propósito: el alcance
 * es siempre el número mayor y de fondo se lee como el techo de las vistas.
 */
export default function PostsDailyChart({ data, height = 256 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false} tickLine={false} minTickGap={24}
          />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            labelFormatter={shortDate}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="impressions" name="Alcance" stroke="#c4b5fd" fill="#ede9fe" strokeWidth={2} />
          <Bar dataKey="likes" name="Me gusta" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={10} />
          <Bar dataKey="comments" name="Comentarios" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={10} />
          <Line type="monotone" dataKey="views" name="Vistas" stroke="#531575" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

PostsDailyChart.propTypes = {
  data: PropTypes.array,
  height: PropTypes.number,
};
