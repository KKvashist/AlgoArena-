import Hero from '../components/Hero'
import LiveStats from '../components/LiveStats'
import FeatureCard from '../components/FeatureCard'
import LiveFeed from '../components/LiveFeed'
import { Welcome } from '../components/Greeting'
import { useAuth } from '../context/AuthContext'

function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
      {user && (
        <div className="mb-8">
          <p className="text-xs font-mono text-cyan/60 mb-1">
            // session.user
          </p>
          <Welcome />
          <p className="text-fog/60 mt-1 text-sm">
            {(user.loginCount ?? 2) <= 1
              ? "Let's build your personal DSA journey. Press Get Started below."
              : `Level ${user.level} · ${user.xp} XP — let's keep the streak going.`}
          </p>
        </div>
      )}

      <Hero />
      <LiveStats />

      <p className="text-xs font-mono text-cyan/60 mt-16 mb-4">
        // platform.features
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
        <FeatureCard
          icon="🤖"
          title="AI Tutor"
          description="Get instant, personalized guidance whenever you're stuck on a concept or problem."
          accent="cyan"
        />
        <FeatureCard
          icon="💻"
          title="Coding Lab"
          description="Write, run, and test real code in-browser with instant feedback and judging."
          accent="violet"
        />
        <FeatureCard
          icon="🎮"
          title="Game Zone"
          description="Learn DSA concepts through interactive mini-games instead of dry repetition."
          accent="amber"
        />
        <FeatureCard
          icon="🏆"
          title="Gamification"
          description="Earn XP, unlock badges, and climb the leaderboard as you master new topics."
          accent="cyan"
        />
      </div>

      <p className="text-xs font-mono text-cyan/60 mb-4">// system.feed</p>
      <LiveFeed />
    </div>
  )
}

export default Home
