// All learning content for each topic lives here.
// To add a topic: copy one block, change the slug + content. The /topic/:slug page picks it up automatically.
// Videos: put a real YouTube id in `youtubeId` to embed it. Without one, the card links to a YouTube search.

export interface NoteBlock { heading: string; points?: string[]; code?: string }
export interface Video { title: string; query: string; youtubeId: string }
export interface Problem { name: string; difficulty: "Easy" | "Medium" | "Hard"; url: string }
export interface QuizQ { q: string; options: string[]; answer: number; why: string }
export interface Topic {
  slug: string; title: string; icon: string; progress: number; tagline: string
  concepts: { name: string; desc: string }[]
  notes: NoteBlock[]; videos: Video[]; problems: Problem[]; quiz: QuizQ[]
}

export const topics: Record<string, Topic> = {
  arrays: {
    slug: "arrays",
    title: "Arrays",
    icon: "🔢",
    progress: 80,
    tagline: "Contiguous memory, O(1) index access, and the foundation of almost every interview problem.",
    concepts: [
      { name: "Indexing", desc: "Read or write any element by position in O(1)." },
      { name: "Two Pointers", desc: "Walk from both ends (or at different speeds) to avoid nested loops." },
      { name: "Sliding Window", desc: "Maintain a moving range to answer subarray questions in O(n)." },
      { name: "Prefix Sum", desc: "Precompute running totals so any range sum is O(1)." },
    ],
    notes: [
      {
        heading: "What is an array?",
        points: [
          "A block of contiguous memory holding elements of the same type.",
          "Access by index is O(1); insert/delete in the middle is O(n) because elements shift.",
          "Dynamic arrays (list, vector, ArrayList) double their capacity when full, giving amortized O(1) append.",
        ],
      },
      {
        heading: "Complexity cheat sheet",
        points: ["Access: O(1)", "Search (unsorted): O(n)", "Search (sorted, binary search): O(log n)", "Insert/Delete at end: O(1) amortized", "Insert/Delete in middle: O(n)"],
      },
      {
        heading: "Two pointers template",
        code: `let l = 0, r = arr.length - 1;
while (l < r) {
  const sum = arr[l] + arr[r];
  if (sum === target) return [l, r];
  if (sum < target) l++;
  else r--;
}`,
      },
    ],
    videos: [
      { title: "Arrays explained for beginners", query: "arrays data structure explained", youtubeId: "" },
      { title: "Two pointers technique", query: "two pointers technique leetcode", youtubeId: "" },
      { title: "Sliding window pattern", query: "sliding window algorithm explained", youtubeId: "" },
    ],
    problems: [
      { name: "Two Sum", difficulty: "Easy", url: "https://leetcode.com/problems/two-sum/" },
      { name: "Best Time to Buy and Sell Stock", difficulty: "Easy", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
      { name: "Product of Array Except Self", difficulty: "Medium", url: "https://leetcode.com/problems/product-of-array-except-self/" },
      { name: "Maximum Subarray", difficulty: "Medium", url: "https://leetcode.com/problems/maximum-subarray/" },
      { name: "Trapping Rain Water", difficulty: "Hard", url: "https://leetcode.com/problems/trapping-rain-water/" },
    ],
    quiz: [
      { q: "Time complexity of accessing arr[i]?", options: ["O(n)", "O(1)", "O(log n)", "O(n²)"], answer: 1, why: "Index maps directly to a memory address." },
      { q: "Inserting in the middle of an array costs…", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: 2, why: "Every element after the position must shift." },
      { q: "Which pattern finds the longest subarray with a property in O(n)?", options: ["Sliding window", "Recursion", "Bubble sort", "DFS"], answer: 0, why: "A window expands and shrinks while you scan once." },
    ],
  },

  trees: {
    slug: "trees",
    title: "Trees",
    icon: "🌳",
    progress: 45,
    tagline: "Hierarchical data: from binary trees to BSTs, traversals and recursion practice.",
    concepts: [
      { name: "Binary Tree", desc: "Each node has at most two children (left, right)." },
      { name: "BST", desc: "Left < node < right, which gives O(log n) search when balanced." },
      { name: "DFS Traversals", desc: "Inorder, preorder, postorder using recursion or a stack." },
      { name: "BFS / Level Order", desc: "Visit nodes level by level using a queue." },
    ],
    notes: [
      {
        heading: "Key terms",
        points: ["Root: top node. Leaf: node with no children.", "Height: longest path from a node down to a leaf.", "Depth: distance from the root to a node."],
      },
      {
        heading: "Traversal orders",
        points: ["Inorder: left, node, right (sorted order for a BST).", "Preorder: node, left, right (copying a tree).", "Postorder: left, right, node (deleting a tree)."],
      },
      {
        heading: "Recursive DFS template",
        code: `function dfs(node) {
  if (!node) return;
  // preorder work here
  dfs(node.left);
  // inorder work here
  dfs(node.right);
  // postorder work here
}`,
      },
    ],
    videos: [
      { title: "Binary trees explained", query: "binary tree data structure explained", youtubeId: "" },
      { title: "Tree traversals (DFS & BFS)", query: "tree traversal inorder preorder postorder", youtubeId: "" },
      { title: "Binary search tree basics", query: "binary search tree explained", youtubeId: "" },
    ],
    problems: [
      { name: "Maximum Depth of Binary Tree", difficulty: "Easy", url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/" },
      { name: "Invert Binary Tree", difficulty: "Easy", url: "https://leetcode.com/problems/invert-binary-tree/" },
      { name: "Binary Tree Level Order Traversal", difficulty: "Medium", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/" },
      { name: "Validate Binary Search Tree", difficulty: "Medium", url: "https://leetcode.com/problems/validate-binary-search-tree/" },
      { name: "Binary Tree Maximum Path Sum", difficulty: "Hard", url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/" },
    ],
    quiz: [
      { q: "Inorder traversal of a BST gives…", options: ["Random order", "Sorted order", "Reverse order", "Level order"], answer: 1, why: "Left < node < right means inorder is ascending." },
      { q: "Which structure does BFS use?", options: ["Stack", "Queue", "Heap", "Set"], answer: 1, why: "A queue processes nodes level by level." },
      { q: "A node with no children is called a…", options: ["Root", "Parent", "Leaf", "Edge"], answer: 2, why: "Leaves sit at the bottom of the tree." },
    ],
  },

  graphs: {
    slug: "graphs",
    title: "Graphs",
    icon: "🕸️",
    progress: 20,
    tagline: "Nodes and edges: model networks, maps, dependencies and relationships.",
    concepts: [
      { name: "Adjacency List", desc: "Map each node to its neighbors; best for sparse graphs." },
      { name: "BFS", desc: "Shortest path in unweighted graphs, level by level." },
      { name: "DFS", desc: "Explore as deep as possible; used for cycles, components, topological sort." },
      { name: "Dijkstra", desc: "Shortest path in weighted graphs with non-negative edges." },
    ],
    notes: [
      {
        heading: "Representations",
        points: ["Adjacency list: O(V + E) space, fast neighbor iteration.", "Adjacency matrix: O(V²) space, O(1) edge lookup."],
      },
      {
        heading: "BFS template",
        code: `const queue = [start];
const seen = new Set([start]);
while (queue.length) {
  const node = queue.shift();
  for (const next of graph[node]) {
    if (!seen.has(next)) {
      seen.add(next);
      queue.push(next);
    }
  }
}`,
      },
      { heading: "When to use what", points: ["Shortest path, unweighted: BFS.", "Connected components, cycle detection: DFS or Union-Find.", "Ordering with dependencies: topological sort.", "Weighted shortest path: Dijkstra."] },
    ],
    videos: [
      { title: "Graph theory introduction", query: "graph data structure introduction", youtubeId: "" },
      { title: "BFS vs DFS", query: "bfs vs dfs graph traversal", youtubeId: "" },
      { title: "Dijkstra's algorithm", query: "dijkstra algorithm explained", youtubeId: "" },
    ],
    problems: [
      { name: "Number of Islands", difficulty: "Medium", url: "https://leetcode.com/problems/number-of-islands/" },
      { name: "Clone Graph", difficulty: "Medium", url: "https://leetcode.com/problems/clone-graph/" },
      { name: "Course Schedule", difficulty: "Medium", url: "https://leetcode.com/problems/course-schedule/" },
      { name: "Network Delay Time", difficulty: "Medium", url: "https://leetcode.com/problems/network-delay-time/" },
      { name: "Word Ladder", difficulty: "Hard", url: "https://leetcode.com/problems/word-ladder/" },
    ],
    quiz: [
      { q: "Shortest path in an unweighted graph?", options: ["DFS", "BFS", "Binary search", "Merge sort"], answer: 1, why: "BFS reaches nodes in order of distance." },
      { q: "Space used by an adjacency list?", options: ["O(V)", "O(V²)", "O(V + E)", "O(E²)"], answer: 2, why: "One list per vertex plus every edge once or twice." },
      { q: "Dijkstra fails with…", options: ["Directed edges", "Negative edge weights", "Cycles", "Sparse graphs"], answer: 1, why: "It assumes a settled node can never be improved." },
    ],
  },

  "dynamic-programming": {
    slug: "dynamic-programming",
    title: "Dynamic Programming",
    icon: "🧩",
    progress: 5,
    tagline: "Break problems into overlapping subproblems and remember the answers.",
    concepts: [
      { name: "Overlapping Subproblems", desc: "The same smaller problem is solved many times." },
      { name: "Optimal Substructure", desc: "The best answer is built from best answers of subproblems." },
      { name: "Memoization", desc: "Top-down recursion with a cache." },
      { name: "Tabulation", desc: "Bottom-up: fill a table from the base cases." },
    ],
    notes: [
      {
        heading: "How to approach a DP problem",
        points: ["Define the state: what does dp[i] mean?", "Write the transition: how does dp[i] depend on earlier states?", "Set base cases.", "Decide the order and the final answer cell."],
      },
      {
        heading: "Fibonacci with memoization",
        code: `const memo = new Map();
function fib(n) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const res = fib(n - 1) + fib(n - 2);
  memo.set(n, res);
  return res;
}`,
      },
      { heading: "Classic patterns", points: ["1D: climbing stairs, house robber.", "2D grid: unique paths, edit distance.", "Knapsack: subset sum, coin change.", "Subsequence: LIS, LCS."] },
    ],
    videos: [
      { title: "Dynamic programming for beginners", query: "dynamic programming for beginners", youtubeId: "" },
      { title: "Memoization vs tabulation", query: "memoization vs tabulation dynamic programming", youtubeId: "" },
      { title: "Knapsack problem", query: "0/1 knapsack dynamic programming", youtubeId: "" },
    ],
    problems: [
      { name: "Climbing Stairs", difficulty: "Easy", url: "https://leetcode.com/problems/climbing-stairs/" },
      { name: "House Robber", difficulty: "Medium", url: "https://leetcode.com/problems/house-robber/" },
      { name: "Coin Change", difficulty: "Medium", url: "https://leetcode.com/problems/coin-change/" },
      { name: "Longest Increasing Subsequence", difficulty: "Medium", url: "https://leetcode.com/problems/longest-increasing-subsequence/" },
      { name: "Edit Distance", difficulty: "Hard", url: "https://leetcode.com/problems/edit-distance/" },
    ],
    quiz: [
      { q: "Memoization is…", options: ["Bottom-up table filling", "Top-down recursion with caching", "Greedy choice", "Sorting"], answer: 1, why: "You recurse and store results as you go." },
      { q: "Which property must a DP problem have?", options: ["Sorted input", "Overlapping subproblems", "A tree structure", "Unique elements"], answer: 1, why: "Without overlap, caching gives no benefit." },
      { q: "Naive recursive Fibonacci runs in…", options: ["O(n)", "O(log n)", "O(2ⁿ)", "O(1)"], answer: 2, why: "Each call branches into two, recomputing the same values." },
    ],
  },
};

export const topicList = Object.values(topics);
