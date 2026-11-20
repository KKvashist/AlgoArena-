import { useState, useMemo } from "react";
import {
  Boxes, Type, Link2, Layers, ListOrdered, TreePine, Share2,
  Repeat, ArrowUpDown, Search, Hash, Diamond, TrendingUp, Binary,
  MoveHorizontal, GitBranch, Divide, Sigma,
} from "lucide-react";

const TOPICS = [
  { name: "Arrays", icon: Boxes, progress: 80, category: "Linear" },
  { name: "Strings", icon: Type, progress: 62, category: "Linear" },
  { name: "Linked List", icon: Link2, progress: 30, category: "Linear" },
  { name: "Stack", icon: Layers, progress: 0, category: "Linear" },
  { name: "Queue", icon: ListOrdered, progress: 0, category: "Linear" },
  { name: "Trees", icon: TreePine, progress: 45, category: "Non-Linear" },
  { name: "Graphs", icon: Share2, progress: 20, category: "Non-Linear" },
  { name: "Heaps", icon: Diamond, progress: 10, category: "Non-Linear" },
  { name: "Tries", icon: GitBranch, progress: 0, category: "Non-Linear" },
  { name: "Recursion & Backtracking", icon: Repeat, progress: 25, category: "Technique" },
  { name: "Sorting", icon: ArrowUpDown, progress: 55, category: "Technique" },
  { name: "Searching & Binary Search", icon: Search, progress: 40, category: "Technique" },
  { name: "Hashing", icon: Hash, progress: 35, category: "Technique" },
  { name: "Sliding Window & Two Pointers", icon: MoveHorizontal, progress: 15, category: "Technique" },
  { name: "Greedy", icon: TrendingUp, progress: 8, category: "Technique" },
  { name: "Bit Manipulation", icon: Binary, progress: 0, category: "Technique" },
  { name: "Divide & Conquer", icon: Divide, progress: 12, category: "Technique" },
  { name: "Dynamic Programming", icon: Sigma, progress: 5, category: "Advanced" },
];

const CATEGORIES = ["All", "Linear", "Non-Linear", "Technique", "Advanced"];

function barClasses(p: number) {
  if (p === 0) return "bg-fog/20";
  if (p < 30) return "bg-gradient-to-r from-amber to-amber/70";
  if (p < 70) return "bg-gradient-to-r from-cyan to-violet";
  return "bg-gradient-to-r from-cyan to-cyan/70";
}

export default function StackTopicsGrid() {
  const [active, setActive] = useState("All");

  const filtered = useMemo(
    () => (active === "All" ? TOPICS : TOPICS.filter((t) => t.category === active)),
    [active]
  );

  return (
    <div className="min-h-screen px-8 py-10 max-w-6xl mx-auto">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="text-2xl font-display font-bold text-white">All Topics</h1>
        <p className="text-xs font-mono text-cyan/60">// topics.overview</p>
      </div>
      <p className="text-sm text-fog/50 mb-8">
        {TOPICS.filter((t) => t.progress > 0).length} of {TOPICS.length} started
      </p>

      <div className="flex gap-2 mb-8 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-mono border transition-colors ${
              active === c
                ? "bg-cyan/10 text-cyan border-cyan/30"
                : "border-panel-border text-fog/50 hover:text-fog/80"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.name}
              className="group bg-panel border border-panel-border rounded-2xl p-5 hover:border-cyan/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-full bg-void/40 border border-panel-border flex items-center justify-center">
                  <Icon size={17} className="text-fog/60 group-hover:text-cyan transition-colors" />
                </div>
                {t.progress === 100 && (
                  <span className="text-[10px] font-mono text-cyan border border-cyan/30 rounded-full px-2 py-0.5">
                    done
                  </span>
                )}
              </div>
              <div className="text-[15px] font-medium text-white mb-3">{t.name}</div>
              <div className="h-1.5 rounded-full bg-void/40 overflow-hidden">
                <div className={`h-full rounded-full ${barClasses(t.progress)}`} style={{ width: `${Math.max(t.progress, 2)}%` }} />
              </div>
              <div className="mt-2 text-xs font-mono text-fog/50">{t.progress}% complete</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
