export default function FlowLines() {
  return (
    <svg
      className="flow-lines"
      viewBox="0 0 1440 800"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id="flow"
          x1="0"
          y1="700"
          x2="1300"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#b7e887" stopOpacity="0" />
          <stop offset=".35" stopColor="#9cda6d" />
          <stop offset=".7" stopColor="#54c9a6" />
          <stop offset="1" stopColor="#c1efab" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: 22 }, (_, i) => (
        <path
          key={i}
          d={`M ${-200 + i * 12} ${760 + i * 8} C ${480 + i * 4} ${770 - i * 13}, ${750 - i * 4} ${160 + i * 8}, ${1490 - i * 7} ${-130 + i * 14}`}
          stroke="url(#flow)"
          strokeWidth=".85"
        />
      ))}
      {[0, 5, 10, 15].map((i) => (
        <circle key={i} r="2.5" fill="#7bc9a0">
          <animateMotion
            dur={`${17 + i}s`}
            repeatCount="indefinite"
            path={`M ${-200 + i * 12} ${760 + i * 8} C ${480 + i * 4} ${770 - i * 13}, ${750 - i * 4} ${160 + i * 8}, ${1490 - i * 7} ${-130 + i * 14}`}
          />
        </circle>
      ))}
    </svg>
  );
}
