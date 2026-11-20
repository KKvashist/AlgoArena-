// "What is this concept, why do we use it" notes shown after every game round (won or lost).
// Lookup is by concept name, case-insensitive (see noteFor). Add a new game = add one entry here.

export interface ConceptNote {
  what: string // plain-language definition
  why: string // why programmers use it
  example: string // a real-life picture
  mistake: string // the usual slip (shown after a failed round)
}

const N: Record<string, ConceptNote> = {
  /* ===== Array Breach levels ===== */
  'index access': {
    what: 'An array keeps its values in one row of memory. Every slot has a number (its index), and counting starts at 0.',
    why: 'The computer can jump straight to slot i using start + i × size. That takes the same tiny time for 10 or 10 million items: O(1).',
    example: 'Like a row of lockers: if you know the locker number you walk straight to it. You never open the others.',
    mistake: 'Counting from 1. The first slot is arr[0], and the last is arr[n - 1].',
  },
  'linear search': {
    what: 'Checking the slots one by one, from the start, until you find the value you want or reach the end.',
    why: 'It works on any array, sorted or not. Cost grows with the size: in the worst case you look at all n items, so O(n).',
    example: 'Looking for one friend in a crowd by checking each face. Fine for 10 people, slow for 10,000.',
    mistake: 'Stopping too early, or forgetting the "not found" case when you reach the end.',
  },
  insertion: {
    what: 'Putting a new value into the middle of an array. Every item after that spot must shift one place right to make room.',
    why: 'Arrays have no gaps, so the shifting is needed. It teaches the cost of inserting: O(n) in the worst case.',
    example: 'Squeezing a new person into the middle of a seated row: everyone after them has to move one seat over.',
    mistake: 'Shifting from the front. Move the LAST item first, or you overwrite values you still need.',
  },
  deletion: {
    what: 'Removing a value from an array. Every item after it shifts one place left to close the gap.',
    why: 'Arrays stay packed with no holes, so deleting costs O(n) in the worst case. Knowing this helps you pick a better structure when you delete often.',
    example: 'When someone leaves the middle of a queue of chairs, everyone behind slides forward one seat.',
    mistake: 'Shifting from the end. Move the item right after the gap first, then the next, in order.',
  },
  reversal: {
    what: 'Turning an array around by swapping mirrored pairs: index i with index n - 1 - i, until you reach the middle.',
    why: 'It needs only n/2 swaps and no extra array: O(n) time and O(1) extra space. Reversal shows up inside many bigger problems.',
    example: 'Flipping a row of cards by swapping the first with the last, the second with the second-last, and so on.',
    mistake: 'Going all the way to the end. After the middle you would swap everything back and undo your work.',
  },
  'two pointers': {
    what: 'Use two position markers (usually one at each end) and move them toward each other depending on what you see.',
    why: 'On a sorted array it finds a pair with a target sum in one pass: O(n) instead of checking every pair, O(n²).',
    example: 'Two people searching a sorted bookshelf from both ends: too small, the left one steps right; too big, the right one steps left.',
    mistake: 'Moving the wrong pointer. Sum too small means move the LEFT pointer up; sum too big means move the RIGHT pointer down.',
  },
  'null boss': {
    what: 'Sorting by swapping neighbours that are out of order. Repeat until no pair is out of order. This is bubble sort.',
    why: 'Each swap removes exactly one "inversion" (a pair in the wrong order), so you always make progress. It is simple, but slow for big arrays: O(n²).',
    example: 'Arranging students by height by only swapping two who stand next to each other and are in the wrong order.',
    mistake: 'Swapping two items that are already in the right order. Only swap a neighbour pair that is out of order.',
  },

  /* ===== Arrays ===== */
  indexing: {
    what: 'Reading an item by its position (index). arr[3] is the 4th item, because counting starts at 0.',
    why: 'Direct access by index is O(1), the fastest possible. Finding by value, in contrast, is O(n) unless the array is sorted.',
    example: 'Page numbers in a book: go to page 57 directly, but finding a sentence means reading through.',
    mistake: 'Off-by-one errors: the last index is length − 1, not length.',
  },
  'sliding window': {
    what: 'A fixed-size frame that slides along the array one step at a time. You update the result by dropping the item that leaves and adding the one that enters.',
    why: 'Instead of re-adding k items at every position (O(n·k)), you do one subtract and one add per step: O(n).',
    example: 'A train window moving along a street: each moment one house leaves the view and one new house enters.',
    mistake: 'Recomputing the whole window each time. Reuse the old sum: new = old − leaving + entering.',
  },
  'prefix sum': {
    what: 'A helper array where each cell holds the running total up to that index: prefix[i] = prefix[i−1] + arr[i].',
    why: 'After one O(n) pass, the sum of ANY range is O(1): prefix[r] − prefix[l−1]. Great when you answer many range queries.',
    example: 'A bank passbook with a running balance: to know what you spent between two dates, subtract the two balances.',
    mistake: 'Using prefix[l] instead of prefix[l−1] when subtracting, which drops the first item of the range.',
  },

  /* ===== Trees ===== */
  'binary tree': {
    what: 'A hierarchy of nodes. The top node is the root, and each node has at most two children (left and right). Nodes with no children are leaves.',
    why: 'Trees store things that are naturally nested (folders, family trees, expressions) and make search and sorting structures possible.',
    example: 'A company chart or a folder structure: one boss at the top, branches below.',
    mistake: 'Mixing up leaf (no children) and a node with only one child.',
  },
  bst: {
    what: 'A binary tree with one rule: everything in the left subtree is smaller than the node, everything in the right is bigger.',
    why: 'That rule lets you throw away half the tree at each step, so search, insert and delete take about O(log n) when the tree is balanced.',
    example: 'The "higher or lower" guessing game: every answer cuts the possibilities in half.',
    mistake: 'Going the wrong way. Smaller than the node means LEFT, bigger means RIGHT.',
  },
  'dfs traversals': {
    what: 'Visiting every node by going deep first. The three orders are: inorder (left, node, right), preorder (node, left, right), postorder (left, right, node).',
    why: 'Inorder on a BST gives sorted values. Preorder is used to copy a tree. Postorder is used to delete a tree or evaluate an expression.',
    example: 'Exploring a maze by following one corridor to the end before backing up and trying the next.',
    mistake: 'Visiting the node at the wrong moment. The name tells you when: PRE = before children, IN = between, POST = after.',
  },
  'bfs / level order': {
    what: 'Visiting a tree level by level, left to right. A queue does the work: take a node out, put its children at the back.',
    why: 'It finds the nodes closest to the root first, which is useful for shortest paths and for printing a tree by level.',
    example: 'Ripples in a pond: the circle spreads outward one ring at a time.',
    mistake: 'Going deep instead of finishing the whole row first.',
  },

  /* ===== Graphs ===== */
  'adjacency list': {
    what: 'A way to store a graph: for every node, keep a list of the nodes it is connected to. B → [A, C, D] means B touches A, C and D.',
    why: 'It uses memory only for real connections, and you can list a node\'s neighbours quickly. Most graph algorithms are built on it.',
    example: 'A phone contacts list: for each person, only the people they actually know.',
    mistake: 'Forgetting that in an undirected graph the link goes both ways: if A is a neighbour of B, B is a neighbour of A.',
  },
  bfs: {
    what: 'Breadth-first search explores a graph in rings: first the start, then all its neighbours, then their neighbours, using a queue.',
    why: 'In an unweighted graph it finds the shortest path (fewest edges). Used in maps, social networks ("friends of friends") and puzzles.',
    example: 'Finding the nearest ATM by checking every place 1 block away, then 2 blocks away, and so on.',
    mistake: 'Not marking nodes as visited, which makes you go round in circles.',
  },
  dfs: {
    what: 'Depth-first search goes as deep as possible along one path, then backtracks when stuck and tries the next option.',
    why: 'Good for exploring everything: finding connected parts, detecting cycles, solving mazes and puzzles. Uses a stack or recursion.',
    example: 'Walking a maze with a ball of thread: go down a corridor until a dead end, then return to the last fork.',
    mistake: 'Backtracking too early. Keep going deep until you really have no unvisited neighbour.',
  },
  dijkstra: {
    what: 'An algorithm for the cheapest path in a graph whose edges have weights. Always settle the unsettled node with the smallest known distance, then update its neighbours.',
    why: 'GPS and routing use this idea to find the fastest route. It works as long as no edge weight is negative.',
    example: 'Choosing the fastest route by always extending the cheapest trip you have found so far.',
    mistake: 'Settling a node too early. Pick the smallest known distance each time, not the nearest-looking neighbour.',
  },

  /* ===== Dynamic programming ===== */
  'overlapping subproblems': {
    what: 'When a big problem splits into smaller ones and the SAME small problems appear again and again. fib(5) computes fib(3) twice, fib(2) three times.',
    why: 'Spotting repeats is the first clue that dynamic programming will help: solve each small problem once and reuse it.',
    example: 'Doing the same homework sum over and over instead of writing the answer down the first time.',
    mistake: 'Thinking more recursion is always fine. Without reuse the number of calls explodes: O(2ⁿ).',
  },
  'optimal substructure': {
    what: 'The best answer to a big problem is built from the best answers to smaller versions of it. dp[11] uses the best answer for dp[6].',
    why: 'It tells you that a table of smaller answers is enough to build the final one. Both parts (this and overlapping subproblems) are needed for DP.',
    example: 'The fastest trip A→C through B is the fastest A→B plus the fastest B→C.',
    mistake: 'Using the wrong earlier cell. Re-read the rule, e.g. dp[i] = 1 + min(dp[i − coin]).',
  },
  memoization: {
    what: 'Top-down dynamic programming: write the normal recursion, but save each answer in a cache. If you are asked again, return the saved answer.',
    why: 'It turns exponential time into linear time (O(2ⁿ) → O(n)) with almost no change to the code.',
    example: 'Writing answers on a sticky note next to the question, so you never calculate the same thing twice.',
    mistake: 'Forgetting to check the cache BEFORE computing, or to store the result AFTER.',
  },
  tabulation: {
    what: 'Bottom-up dynamic programming: start from the base cases and fill a table in order, each cell using cells already filled. No recursion.',
    why: 'It is fast, avoids deep recursion limits, and makes it easy to see (and save) memory. Often the version used in interviews.',
    example: 'Building a staircase from the ground: every step rests on the ones you already built.',
    mistake: 'Filling a cell before the cells it depends on. Always go in an order where the inputs are ready.',
  },
}

const ALIASES: Record<string, string> = {
  'dfs traversal': 'dfs traversals',
  'bfs': 'bfs',
  'level order': 'bfs / level order',
  'binary search tree': 'bst',
  'two pointer': 'two pointers',
}

export function noteFor(name: string | undefined | null): ConceptNote | null {
  if (!name) return null
  const k = name.trim().toLowerCase()
  return N[k] ?? N[ALIASES[k] ?? ''] ?? null
}

export const conceptNoteNames = Object.keys(N)
