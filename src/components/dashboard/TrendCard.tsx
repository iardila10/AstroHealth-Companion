interface TrendCardProps {
  title: string;
  unit: string;
  color: string;
  values: number[];
}

function TrendCard({ title, unit, color, values }: TrendCardProps) {
  const recentValues = values.slice(-12);
  const minimum = Math.min(...recentValues);
  const maximum = Math.max(...recentValues);
  const range = maximum - minimum || 1;
  const points = recentValues
    .map((value, index) => {
      const x =
        recentValues.length < 2
          ? 5 + index * 90
          : 5 + (index / (recentValues.length - 1)) * 90;
      const y = 35 - ((value - minimum) / range) * 27;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <section className="trend-card">
      <div className="trend-card-heading">
        <div>
          <h3>{title}</h3>
          <span>Últimas mediciones · {unit}</span>
        </div>
        <span className="trend-live">HISTORIAL</span>
      </div>
      {recentValues.length > 0 ? (
        <svg
          className="trend-line"
          viewBox="0 0 100 42"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Tendencia de ${title}`}
        >
          <path className="trend-gridline" d="M0 8 H100 M0 21 H100 M0 34 H100" />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : (
        <div className="trend-empty">El historial aparecerá al registrar mediciones.</div>
      )}
      <div className="trend-card-footer">
        <span>{recentValues.length} registros</span>
        {recentValues.length > 0 && (
          <strong>
            {recentValues[recentValues.length - 1]} {unit}
          </strong>
        )}
      </div>
    </section>
  );
}

export default TrendCard;
