const DSA_TERMS = [
  'Array',
  'Stack',
  'Queue',
  'Graph',
  'Tree',
  'Recursion',
  'O(log n)',
  'O(n²)',
  'Hash Map',
  'Binary Search',
  'DP',
  'Linked List',
  'Heap',
  'DFS',
  'BFS',
  'Greedy',
]

// Generated once — fixed positions/timings, not on every render
const words = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  text: DSA_TERMS[i % DSA_TERMS.length],
  left: Math.random() * 100,
  duration: 8 + Math.random() * 10,
  delay: Math.random() * 10,
  size: Math.random() > 0.7 ? 'text-sm' : 'text-xs',
}))

function FallingWords() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {words.map((word) => (
        <span
          key={word.id}
          className={`fall-word absolute font-mono ${word.size} text-cyan/20`}
          style={{
            left: `${word.left}%`,
            animationDuration: `${word.duration}s`,
            animationDelay: `${word.delay}s`,
          }}
        >
          {word.text}
        </span>
      ))}
    </div>
  )
}

export default FallingWords