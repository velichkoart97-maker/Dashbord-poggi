// Логотип WWMAAI, отрисован по образцу: жирный геометрический шрифт (Montserrat 800).
// tone="light" — для тёмного фона дашборда, tone="brand" — оригинальный сливовый цвет.
export function WwmaaiLogo({ height = 30, tone = "light" }: { height?: number; tone?: "light" | "brand" }) {
  const fill = tone === "brand" ? "#5B1A3F" : "url(#wwmaai-grad)";
  return (
    <svg height={height} viewBox="0 0 236 40" role="img" aria-label="WWMAAI">
      <defs>
        <linearGradient id="wwmaai-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FBE9DF" />
          <stop offset="0.6" stopColor="#F6B597" />
          <stop offset="1" stopColor="#EE7B62" />
        </linearGradient>
      </defs>
      <text x="0" y="33" fill={fill} fontFamily="var(--font-logo), Montserrat, sans-serif"
        fontWeight={800} fontSize="40" letterSpacing="1">WWMAAI</text>
    </svg>
  );
}
