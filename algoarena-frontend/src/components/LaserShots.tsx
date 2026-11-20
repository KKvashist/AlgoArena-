const shots = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  top: Math.random() * 60,
  duration: 3 + Math.random() * 2,
  delay: Math.random() * 12,
  color: i % 2 === 0 ? 'bg-cyan' : 'bg-violet',
}))

function LaserShots() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {shots.map((shot) => (
        <div
          key={shot.id}
          className={`laser-shot absolute h-0.5 w-24 ${shot.color} rounded-full`}
          style={{
            top: `${shot.top}%`,
            left: 0,
            boxShadow: '0 0 8px currentColor',
            animationDuration: `${shot.duration}s`,
            animationDelay: `${shot.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default LaserShots