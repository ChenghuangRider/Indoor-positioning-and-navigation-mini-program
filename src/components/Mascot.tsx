// 泉速吉祥物（水滴造型 2D 扁平化）
export default function Mascot({ size = 64, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={animate ? 'mascot-bounce' : ''}
      aria-label="泉速吉祥物"
    >
      {/* 水滴身体 */}
      <path
        d="M50 8 C50 8 22 42 22 62 a28 28 0 0 0 56 0 C78 42 50 8 50 8 Z"
        fill="#4A90D9"
        stroke="#3EC1D3"
        strokeWidth="3"
      />
      {/* 高光 */}
      <ellipse cx="38" cy="52" rx="7" ry="11" fill="#7FB8EC" opacity="0.8" />
      {/* 眼睛 */}
      <circle cx="42" cy="62" r="4" fill="#1B3A5C" />
      <circle cx="60" cy="62" r="4" fill="#1B3A5C" />
      <circle cx="43.5" cy="60.5" r="1.3" fill="#fff" />
      <circle cx="61.5" cy="60.5" r="1.3" fill="#fff" />
      {/* 微笑 */}
      <path d="M44 71 q7 6 14 0" stroke="#1B3A5C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* 腮红 */}
      <ellipse cx="34" cy="68" rx="4" ry="2.5" fill="#F6A5C0" opacity="0.7" />
      <ellipse cx="68" cy="68" rx="4" ry="2.5" fill="#F6A5C0" opacity="0.7" />
      {/* 头顶小水花 */}
      <path d="M50 4 q-4 -6 -8 -3 M50 4 q4 -6 8 -3" stroke="#3EC1D3" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}
