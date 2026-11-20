import XPCore from '../components/XPCore'
import StatCard from '../components/StatCard'
import ModuleCard from '../components/ModuleCard'
import Leaderboard from '../components/Leaderboard'
import RecentBadges from '../components/RecentBadges'
import { useAuth } from '../context/AuthContext'
import { useArena } from '../context/ArenaContext'

function Dashboard() {
  const { user } = useAuth()
  const { openArena } = useArena()
  const name = user?.name ?? 'Player'

  return (
    <div className="min-h-screen px-8 py-10 max-w-6xl mx-auto">
      {/* Top section: XP Core + Player info */}
      <div className="relative bg-panel border border-panel-border rounded-2xl p-8 mb-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet/10 rounded-full blur-3xl" />

        <div className="relative flex items-center gap-10">
          <XPCore level={12} currentXP={420} xpToNextLevel={600} />

          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan to-violet flex items-center justify-center text-void font-display font-bold text-xl">
                {name[0]?.toUpperCase()}
              </div>

              <div>
                <p className="text-xs font-mono text-fog/50 uppercase tracking-widest">
                  Welcome back
                </p>

                <h1 className="text-2xl font-display font-bold text-white">
                  {name}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="bg-amber/10 text-amber border border-amber/30 px-3 py-1 rounded-full text-sm font-mono">
                🔥 7 day streak
              </span>

              <span className="bg-violet/10 text-violet border border-violet/30 px-3 py-1 rounded-full text-sm font-mono">
                Diamond II
              </span>

              <button
                onClick={openArena}
                className="border border-cyan/40 text-cyan hover:bg-cyan/10 px-3 py-1 rounded-full text-sm font-mono transition"
              >
                ✦ Ask Arena AI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <p className="text-xs font-mono text-cyan/60 mb-3">// stats.overview</p>

      <div className="flex flex-col md:flex-row gap-4">
        <StatCard label="Problems Solved" value={87} accent="cyan" />

        <StatCard label="Badges Earned" value={14} accent="violet" />

        <StatCard label="Global Rank" value={342} suffix="#" accent="amber" />
      </div>

      {/* Continue Learning Section */}
      <p className="text-xs font-mono text-cyan/60 mt-10 mb-3">
        // continue.learning
      </p>

      <div className="flex gap-4 overflow-x-auto pb-2">
        <ModuleCard title="Arrays" progress={80} icon="🔢" slug="arrays" />

        <ModuleCard title="Trees" progress={45} icon="🌳" slug="trees" />

        <ModuleCard title="Graphs" progress={20} icon="🕸️" slug="graphs" />

        <ModuleCard
          title="Dynamic Programming"
          progress={5}
          icon="🧩"
          slug="dynamic-programming"
        />
      </div>

      {/* Leaderboard and Recent Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
        {/* Leaderboard */}
        <div>
          <p className="text-xs font-mono text-cyan/60 mb-3">
            // global.leaderboard
          </p>

          <Leaderboard />
        </div>

        {/* Recent Badges */}
        <div>
          <p className="text-xs font-mono text-cyan/60 mb-3">
            // recent.badges
          </p>

          <RecentBadges />
        </div>
      </div>
    </div>
  )
}

export default Dashboard