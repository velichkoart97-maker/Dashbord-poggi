// Логотип заказчика PoggiPlay: знак «P» на двух «плеях» + надпись.
// На тёмном фоне надпись светлая, цвета знака как в оригинале.
export function PoggiLogo({ height = 40 }: { height?: number }) {
  return (
    <svg height={height} viewBox="0 0 190 64" role="img" aria-label="PoggiPlay">
      <g fontFamily="var(--font-ui), sans-serif" fontWeight={700} fontSize="25" fill="#E9ECFF">
        <text x="0" y="27">Poggi</text>
        <text x="14" y="56">Play</text>
      </g>
      <g transform="translate(92 2)">
        <polygon points="12,8 12,52 46,30" fill="#EE3466" stroke="#EE3466" strokeWidth="14" strokeLinejoin="round" />
        <polygon points="40,8 40,52 78,30" fill="#4A8FF0" stroke="#4A8FF0" strokeWidth="14" strokeLinejoin="round" />
        <rect x="18" y="1" width="50" height="58" rx="24" fill="#2B2C8C" />
        <text x="43" y="45" textAnchor="middle" fill="#FFFFFF" fontFamily="var(--font-ui), sans-serif" fontWeight={800} fontSize="40">P</text>
      </g>
    </svg>
  );
}
