interface LeaderboardEntry {
  rank: number
  name: string
  xp: number
  trend: 'up' | 'down' | 'same'
  isYou?: boolean
}

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  { rank: 1, name: 'Player_Aditi', xp: 8420, trend: 'same' },
  { rank: 2, name: 'Player_Rohan', xp: 7910, trend: 'up' },
  { rank: 3, name: 'Player_Vikram', xp: 7355, trend: 'down' },
  { rank: 4, name: 'Player_Sana', xp: 6980, trend: 'up' },
  { rank: 342, name: 'Krishna', xp: 3120, trend: 'up', isYou: true },
]

const RANK_STYLES: Record<number, string> = {
  1: 'text-amber',
  2: 'text-fog',
  3: 'text-violet',
}

const TREND_ICON: Record<
  LeaderboardEntry['trend'],
  { icon: string; color: string }
> = {
  up: { icon: '▲', color: 'text-cyan' },
  down: { icon: '▼', color: 'text-amber' },
  same: { icon: '—', color: 'text-fog/30' },
}

function Leaderboard() {
  return (
    <div className="bg-panel border border-panel-border rounded-xl p-5 h-full">
      <p className="text-xs font-mono text-cyan/60 mb-4">// leaderboard.top</p>

      <div className="space-y-1">
        {LEADERBOARD_DATA.map((entry) => {
          const trend = TREND_ICON[entry.trend]
          const rankColor = RANK_STYLES[entry.rank] ?? 'text-fog/50'

          return (
            <div
              key={entry.rank}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                entry.isYou
                  ? 'bg-cyan/10 border border-cyan/30'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`font-display font-bold w-8 text-sm ${rankColor}`}
                >
                  #{entry.rank}
                </span>
                <span
                  className={`font-mono text-sm ${
                    entry.isYou ? 'text-cyan font-semibold' : 'text-white/80'
                  }`}
                >
                  {entry.name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-fog/60">
                  {entry.xp.toLocaleString()} XP
                </span>
                <span className={`text-xs ${trend.color}`}>{trend.icon}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Leaderboard
