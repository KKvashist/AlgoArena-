// All concept games live here. Key = "<topic slug>:<concept name>" (must match topics.ts).

export interface GNode { id: string; label: string; sub?: string; x: number; y: number; shape?: 'box' | 'circle' }
export interface GEdge { from: string; to: string; w?: number }
export interface ClickRound { prompt: string; hint: string; answer: string[]; ordered: boolean; explain: string }
export interface ClickGameSpec { kind: 'click'; nodes: GNode[]; edges: GEdge[]; weights?: boolean; rounds: ClickRound[] }
export interface PointerPuzzle { arr: number[]; target: number }
export interface PointerGameSpec { kind: 'pointers'; puzzles: PointerPuzzle[] }
export interface WindowGameSpec { kind: 'window'; arr: number[]; k: number }
export interface FillCell { label: string; top?: string; given?: number; answer: number; rule: string; work: string }
export interface FillGameSpec { kind: 'fill'; intro: string; cells: FillCell[]; final?: { q: string; answer: number; explain: string } }
export interface MemoGameSpec { kind: 'memo' }
export type GameSpec = ClickGameSpec | PointerGameSpec | WindowGameSpec | FillGameSpec | MemoGameSpec

/* ---------- helpers ---------- */
const arrayNodes = (values: number[]): GNode[] =>
  values.map((v, i) => ({ id: String(i), label: String(v), sub: `[${i}]`, x: 45 + i * 52, y: 100, shape: 'box' }))

function prefixCells(arr: number[]): FillCell[] {
  const out: FillCell[] = []
  let run = 0
  arr.forEach((v, i) => {
    const prev = run
    run += v
    out.push({
      label: `prefix[${i}]`,
      top: `arr[${i}] = ${v}`,
      given: i === 0 ? run : undefined,
      answer: run,
      rule: i === 0 ? 'prefix[0] = arr[0]' : `prefix[${i}] = prefix[${i - 1}] + arr[${i}]`,
      work: i === 0 ? `${v}` : `${prev} + ${v} = ${run}`,
    })
  })
  return out
}

function coinCells(coins: number[], upto: number): FillCell[] {
  const dp: number[] = [0]
  const out: FillCell[] = [{ label: 'dp[0]', top: 'amount 0', given: 0, answer: 0, rule: 'base case', work: '0 coins' }]
  for (let i = 1; i <= upto; i++) {
    const usable = coins.filter((c) => c <= i)
    const opts = usable.map((c) => dp[i - c])
    const best = Math.min(...opts) + 1
    dp[i] = best
    out.push({
      label: `dp[${i}]`,
      top: `amount ${i}`,
      given: i <= 2 ? best : undefined,
      answer: best,
      rule: `dp[${i}] = 1 + min(${usable.map((c) => `dp[${i - c}]`).join(', ')})`,
      work: `1 + min(${opts.join(', ')}) = ${best}`,
    })
  }
  return out
}

function fibCells(n: number): FillCell[] {
  const dp: number[] = [0, 1]
  const out: FillCell[] = [
    { label: 'dp[0]', given: 0, answer: 0, rule: 'base case', work: '0' },
    { label: 'dp[1]', given: 1, answer: 1, rule: 'base case', work: '1' },
  ]
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]
    out.push({ label: `dp[${i}]`, answer: dp[i], rule: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}]`, work: `${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}` })
  }
  return out
}

/* ---------- shared structures ---------- */
const treeNodes: GNode[] = [
  { id: '8', label: '8', x: 200, y: 30 },
  { id: '3', label: '3', x: 110, y: 85 },
  { id: '10', label: '10', x: 290, y: 85 },
  { id: '1', label: '1', x: 65, y: 140 },
  { id: '6', label: '6', x: 155, y: 140 },
  { id: '14', label: '14', x: 335, y: 140 },
  { id: '4', label: '4', x: 125, y: 195 },
  { id: '7', label: '7', x: 185, y: 195 },
  { id: '13', label: '13', x: 305, y: 195 },
]
const treeEdges: GEdge[] = [
  { from: '8', to: '3' }, { from: '8', to: '10' }, { from: '3', to: '1' }, { from: '3', to: '6' },
  { from: '10', to: '14' }, { from: '6', to: '4' }, { from: '6', to: '7' }, { from: '14', to: '13' },
]

const graphNodes: GNode[] = [
  { id: 'A', label: 'A', x: 50, y: 110 }, { id: 'B', label: 'B', x: 140, y: 40 }, { id: 'C', label: 'C', x: 140, y: 180 },
  { id: 'D', label: 'D', x: 260, y: 40 }, { id: 'E', label: 'E', x: 260, y: 180 }, { id: 'F', label: 'F', x: 350, y: 110 },
]
const graphEdges: GEdge[] = [
  { from: 'A', to: 'B', w: 4 }, { from: 'A', to: 'C', w: 2 }, { from: 'B', to: 'C', w: 1 }, { from: 'B', to: 'D', w: 5 },
  { from: 'C', to: 'E', w: 10 }, { from: 'D', to: 'F', w: 3 }, { from: 'E', to: 'F', w: 4 },
]
const plainGraphEdges: GEdge[] = graphEdges.map((e) => ({ from: e.from, to: e.to }))

const memoNodes: GNode[] = [
  { id: 'f5', label: 'f5', x: 200, y: 25 }, { id: 'f4', label: 'f4', x: 120, y: 68 }, { id: 'f3c', label: 'f3', x: 290, y: 68 },
  { id: 'f3', label: 'f3', x: 70, y: 111 }, { id: 'f2c', label: 'f2', x: 170, y: 111 }, { id: 'f2', label: 'f2', x: 40, y: 154 },
  { id: 'f1c', label: 'f1', x: 105, y: 154 }, { id: 'f1', label: 'f1', x: 20, y: 197 }, { id: 'f0', label: 'f0', x: 65, y: 197 },
]
const memoEdges: GEdge[] = [
  { from: 'f5', to: 'f4' }, { from: 'f5', to: 'f3c' }, { from: 'f4', to: 'f3' }, { from: 'f4', to: 'f2c' },
  { from: 'f3', to: 'f2' }, { from: 'f3', to: 'f1c' }, { from: 'f2', to: 'f1' }, { from: 'f2', to: 'f0' },
]

/* ---------- the games ---------- */
export const games: Record<string, GameSpec> = {
  /* ===== ARRAYS ===== */
  'arrays:Indexing': {
    kind: 'click',
    nodes: arrayNodes([12, 7, 25, 3, 18, 9, 31]),
    edges: [],
    rounds: [
      { prompt: 'Click arr[3]', hint: 'Indexes start at 0, so arr[0] is the first box.', answer: ['3'], ordered: false, explain: 'The computer jumps straight to start + 3 × size. That is why access is O(1).' },
      { prompt: 'Click the LAST element (arr[n-1])', hint: 'The array has 7 elements, so the last index is 6.', answer: ['6'], ordered: false, explain: 'Last index is always length − 1.' },
      { prompt: 'Click the box that holds the value 25', hint: 'Searching by value means checking boxes one by one, which is O(n).', answer: ['2'], ordered: false, explain: 'Finding by index is O(1), but finding by value is O(n) unless the array is sorted.' },
    ],
  },
  'arrays:Two Pointers': {
    kind: 'pointers',
    puzzles: [{ arr: [1, 3, 4, 6, 8, 11, 15], target: 17 }, { arr: [2, 5, 7, 9, 13, 20], target: 16 }],
  },
  'arrays:Sliding Window': { kind: 'window', arr: [2, 1, 5, 1, 3, 2, 9, 1], k: 3 },
  'arrays:Prefix Sum': {
    kind: 'fill',
    intro: 'Build the prefix array. Each cell is the running total up to that index.',
    cells: prefixCells([3, 1, 4, 1, 5, 9, 2]),
    final: { q: 'Now answer instantly: what is the sum of arr[2..5]? Use prefix[5] − prefix[1].', answer: 19, explain: 'prefix[5] − prefix[1] = 23 − 4 = 19. Any range sum is O(1) after the O(n) setup.' },
  },

  /* ===== TREES ===== */
  'trees:Binary Tree': {
    kind: 'click',
    nodes: treeNodes,
    edges: treeEdges,
    rounds: [
      { prompt: 'Click the ROOT node', hint: 'The root is the only node with no parent.', answer: ['8'], ordered: false, explain: 'Root = top of the tree.' },
      { prompt: 'Click ALL leaf nodes', hint: 'A leaf has no children.', answer: ['1', '4', '7', '13'], ordered: false, explain: 'Leaves are the nodes at the bottom with no children: 1, 4, 7, 13.' },
      { prompt: 'Click every node that has EXACTLY two children', hint: 'Look for nodes with both a left and a right child.', answer: ['8', '3', '6'], ordered: false, explain: '10 and 14 have only one child each, so they do not count.' },
    ],
  },
  'trees:BST': {
    kind: 'click',
    nodes: treeNodes,
    edges: treeEdges,
    rounds: [
      { prompt: 'Search for 7: click the nodes you compare with, in order', hint: 'Smaller goes left, bigger goes right. Start at the root.', answer: ['8', '3', '6', '7'], ordered: true, explain: '7<8 go left, 7>3 go right, 7>6 go right, found 7. Only 4 steps instead of checking all 9 nodes.' },
      { prompt: 'Search for 13: click the nodes in order', hint: '13 is bigger than the root.', answer: ['8', '10', '14', '13'], ordered: true, explain: '13>8 right, 13>10 right, 13<14 left, found.' },
      { prompt: 'Insert 5: click the path you walk until you find the empty spot', hint: 'The last node you click is the parent of the new node.', answer: ['8', '3', '6', '4'], ordered: true, explain: '5<8 left, 5>3 right, 5<6 left, 5>4 so 5 becomes the right child of 4.' },
    ],
  },
  'trees:DFS Traversals': {
    kind: 'click',
    nodes: treeNodes,
    edges: treeEdges,
    rounds: [
      { prompt: 'INORDER (left, node, right): click nodes in order', hint: 'Go as far left as possible first. For a BST this gives sorted values.', answer: ['1', '3', '4', '6', '7', '8', '10', '13', '14'], ordered: true, explain: 'Inorder on a BST always gives sorted order.' },
      { prompt: 'PREORDER (node, left, right): click nodes in order', hint: 'Visit a node the moment you reach it, then go left, then right.', answer: ['8', '3', '1', '6', '4', '7', '10', '14', '13'], ordered: true, explain: 'Preorder visits the parent before its children, which is useful for copying a tree.' },
      { prompt: 'POSTORDER (left, right, node): click nodes in order', hint: 'A node is visited only after both its children are done.', answer: ['1', '4', '7', '6', '3', '13', '14', '10', '8'], ordered: true, explain: 'Postorder visits children first, which is useful for deleting a tree.' },
    ],
  },
  'trees:BFS / Level Order': {
    kind: 'click',
    nodes: treeNodes,
    edges: treeEdges,
    rounds: [
      { prompt: 'Level order: click the nodes level by level, left to right', hint: 'Finish the whole row before going down. A queue does this for you.', answer: ['8', '3', '10', '1', '6', '14', '4', '7', '13'], ordered: true, explain: 'BFS uses a queue: pop a node, push its children.' },
      { prompt: 'Click all nodes on the third level (root is level 1)', hint: 'Two steps down from the root.', answer: ['1', '6', '14'], ordered: false, explain: 'Level 3 holds 1, 6 and 14.' },
    ],
  },

  /* ===== GRAPHS ===== */
  'graphs:Adjacency List': {
    kind: 'click',
    nodes: graphNodes,
    edges: plainGraphEdges,
    rounds: [
      { prompt: 'Click all neighbours of B', hint: 'Neighbours are nodes joined to B by a line.', answer: ['A', 'C', 'D'], ordered: false, explain: 'Adjacency list entry: B → [A, C, D].' },
      { prompt: 'Click all neighbours of E', hint: 'Follow the lines from E.', answer: ['C', 'F'], ordered: false, explain: 'E → [C, F].' },
      { prompt: 'Click the nodes with the MOST neighbours', hint: 'Count lines for each node. Two nodes tie.', answer: ['B', 'C'], ordered: false, explain: 'B and C each have 3 neighbours (degree 3). Others have 2.' },
    ],
  },
  'graphs:BFS': {
    kind: 'click',
    nodes: graphNodes,
    edges: plainGraphEdges,
    rounds: [
      { prompt: 'BFS from C (visit neighbours alphabetically): click the visit order', hint: 'Visit all neighbours of C first (A, B, E), then their neighbours.', answer: ['C', 'A', 'B', 'E', 'D', 'F'], ordered: true, explain: 'Distance 0: C. Distance 1: A, B, E. Distance 2: D (via B), F (via E). BFS finds shortest paths in unweighted graphs.' },
    ],
  },
  'graphs:DFS': {
    kind: 'click',
    nodes: graphNodes,
    edges: plainGraphEdges,
    rounds: [
      { prompt: 'DFS from C (take the alphabetically first unvisited neighbour): click the visit order', hint: 'Go deep first: C → A → ... keep going until stuck, then backtrack.', answer: ['C', 'A', 'B', 'D', 'F', 'E'], ordered: true, explain: 'C→A→B→D→F→E. DFS dives as deep as possible and backtracks only when stuck.' },
    ],
  },
  'graphs:Dijkstra': {
    kind: 'click',
    nodes: graphNodes,
    edges: graphEdges,
    weights: true,
    rounds: [
      { prompt: "Dijkstra from A: click nodes in the order they are SETTLED", hint: 'After settling A you know B=4 and C=2. Always settle the unsettled node with the smallest known distance, then update its neighbours.', answer: ['A', 'C', 'B', 'D', 'F', 'E'], ordered: true, explain: 'Final distances: A=0, C=2, B=3 (via C), D=8, F=11, E=12 (via C). Settled order: A, C, B, D, F, E.' },
    ],
  },

  /* ===== DYNAMIC PROGRAMMING ===== */
  'dynamic-programming:Overlapping Subproblems': { kind: 'memo' },
  'dynamic-programming:Optimal Substructure': {
    kind: 'fill',
    intro: 'Minimum coins needed for each amount using coins 1, 2 and 5. Each answer is built from smaller answers.',
    cells: coinCells([1, 2, 5], 11),
    final: { q: 'Suppose the LAST coin used for amount 11 is a 5. Then dp[11] = 1 + dp[?]. Enter the amount you jump back to.', answer: 6, explain: 'With a 5 coin: dp[11] = 1 + dp[6] = 1 + 2 = 3. The best answer for 11 contains the best answer for 6, and that is optimal substructure.' },
  },
  'dynamic-programming:Memoization': {
    kind: 'click',
    nodes: memoNodes,
    edges: memoEdges,
    rounds: [
      { prompt: 'Click the BASE CASE calls that are computed directly (f1 and f0 at the bottom)', hint: 'Base cases are the deepest-left calls that stop recursing.', answer: ['f1', 'f0'], ordered: false, explain: 'fib(1)=1 and fib(0)=0 need no recursion.' },
      { prompt: 'Calls run left to right. Click every call answered instantly from the CACHE', hint: 'A call is a cache hit if that same fib(k) was already computed earlier (further left or deeper).', answer: ['f1c', 'f2c', 'f3c'], ordered: false, explain: 'f3, f2 and f1 were already stored, so they return instantly and their subtrees are never expanded. That turns O(2ⁿ) into O(n).' },
    ],
  },
  'dynamic-programming:Tabulation': {
    kind: 'fill',
    intro: 'Bottom-up: start from the base cases and fill the table left to right. No recursion needed.',
    cells: fibCells(9),
    final: { q: 'What would dp[10] be? (dp[9] + dp[8])', answer: 55, explain: '34 + 21 = 55. Tabulation just keeps filling the next cell.' },
  },
}
