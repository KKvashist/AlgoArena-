import useTypewriter from '../hooks/useTypewriter'

const CODE_LINES = [
  'function solve(nums, target) {',
  'const map = new Map()',
  'for (let i = 0; i < nums.length; i++) {',
  'if (map.has(target - nums[i])) return true',
  'map.set(nums[i], i)',
  '}',
  '}',
]

function AuthSidePanel() {
  const typed = useTypewriter(
    ['Solve problems.', 'Earn XP.', 'Climb the leaderboard.', 'Level up.'],
    70,
    1500
  )

  return (
    <div
      className="hidden md:block relative overflow-hidden"
      style={{
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: '4rem',
        paddingRight: '4rem',
      }}
    >
      <div className="absolute top-10 left-10 w-72 h-72 bg-cyan/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-0 w-72 h-72 bg-violet/10 rounded-full blur-3xl" />

      <div className="relative">
        <p className="text-xs font-mono text-cyan/60 mb-3 tracking-widest">
          // algoarena.terminal
        </p>
        <h2 className="text-4xl font-display font-bold text-white mb-2 leading-tight">
          {typed}
          <span className="inline-block w-2 h-8 bg-cyan ml-1 animate-pulse align-middle" />
        </h2>
        <p className="text-fog/50 font-mono text-sm mb-10">
          Join thousands mastering DSA the fun way.
        </p>

        <div className="bg-void/60 border border-panel-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-panel-border">
            <span className="w-2.5 h-2.5 rounded-full bg-amber/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-cyan/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-violet/70" />
            <span className="ml-3 text-xs font-mono text-fog/40">two_sum.js</span>
          </div>
          <div className="p-4 font-mono text-xs leading-relaxed">
            {CODE_LINES.map((line, i) => (
              <p key={i} className="text-fog/70">
                <span className="text-fog/30 mr-3 select-none">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={
                    line.includes('function') || line.includes('for')
                      ? 'text-violet'
                      : line.includes('return') || line.includes('if')
                        ? 'text-cyan'
                        : 'text-fog/70'
                  }
                >
                  {line}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthSidePanel