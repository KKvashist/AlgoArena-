// Generated once, outside the component — not tied to render
const dots = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  top: Math.random() * 100,
  left: Math.random() * 100,
  size: Math.random() * 2 + 1,
  delay: Math.random() * 3,
}))

function BackgroundFX() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Drifting glow orbs */}
      <div className="bg-orb absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-3xl" />
      <div
        className="bg-orb absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet/10 rounded-full blur-3xl"
        style={{ animationDelay: '4s' }}
      />

      {/* Twinkling particles */}
      {dots.map((dot) => (
        <div
          key={dot.id}
          className="bg-twinkle absolute rounded-full bg-cyan"
          style={{
            top: `${dot.top}%`,
            left: `${dot.left}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            animationDelay: `${dot.delay}s`,
          }}
        />
      ))}

      {/* Scanline sweep */}
      <div className="bg-scanline absolute left-0 w-full h-32 bg-gradient-to-b from-transparent via-cyan/5 to-transparent" />
    </div>
  )
}

export default BackgroundFX
