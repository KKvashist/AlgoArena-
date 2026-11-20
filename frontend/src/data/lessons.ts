// Structured lessons for the four live topics.
// Lesson ids MUST match `lessons` in server/journey-data.js (the server only stores ids and progress).
//
// Teaching order inside every topic: explanation -> diagram -> worked example (dry run) -> code ->
// complexity -> common mistakes -> interview notes -> a short knowledge checkpoint.

export type Mark = 'hl' | 'good' | 'bad' | 'dim'

export type ArrayFrame = {
  kind: 'array'
  cells: (string | number)[]
  marks?: Record<number, Mark>
  pointers?: Record<number, string>
  label?: string
}
export type TreeFrame = {
  kind: 'tree'
  /** level order, null = no node. Children of index i are 2i+1 and 2i+2. */
  nodes: (string | number | null)[]
  marks?: Record<number, Mark>
  /** index -> visit number shown on the node */
  order?: Record<number, number>
  label?: string
}
export type GraphFrame = {
  kind: 'graph'
  nodes: { id: string; x: number; y: number }[]
  edges: [string, string][]
  directed?: boolean
  visited?: string[]
  current?: string
  /** a labelled helper structure such as the BFS queue */
  helper?: { name: string; items: string[] }
  label?: string
}
export type Frame = ArrayFrame | TreeFrame | GraphFrame

export type Block =
  | { t: 'text'; title?: string; body: string }
  | { t: 'points'; title?: string; items: string[] }
  | { t: 'diagram'; title?: string; frame: Frame; caption?: string }
  | { t: 'explore'; title?: string; frame: ArrayFrame; caption?: string }
  | { t: 'dryrun'; title: string; code?: string; steps: { frame: Frame; note: string }[] }
  | { t: 'code'; title?: string; code: string }
  | { t: 'complexity'; rows: [string, string, string][] }
  | { t: 'mistakes'; items: string[] }
  | { t: 'interview'; items: string[] }

export type Check = { q: string; options: string[]; answer: number; why: string }

export type Lesson = {
  id: string
  title: string
  minutes: number
  summary: string
  blocks: Block[]
  checkpoint: Check[]
}

const arr = (cells: (string | number)[], o: Partial<Omit<ArrayFrame, 'kind' | 'cells'>> = {}): ArrayFrame => ({ kind: 'array', cells, ...o })
const tree = (nodes: (string | number | null)[], o: Partial<Omit<TreeFrame, 'kind' | 'nodes'>> = {}): TreeFrame => ({ kind: 'tree', nodes, ...o })

const G_NODES = [
  { id: 'A', x: 50, y: 10 },
  { id: 'B', x: 20, y: 45 },
  { id: 'C', x: 80, y: 45 },
  { id: 'D', x: 8, y: 85 },
  { id: 'E', x: 45, y: 85 },
  { id: 'F', x: 88, y: 85 },
]
const G_EDGES: [string, string][] = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'F'], ['E', 'F']]
const graph = (o: Partial<Omit<GraphFrame, 'kind' | 'nodes' | 'edges'>> = {}): GraphFrame => ({ kind: 'graph', nodes: G_NODES, edges: G_EDGES, ...o })

/* ------------------------------------------------------------------ */
/* ARRAYS                                                              */
/* ------------------------------------------------------------------ */

const arrayLessons: Lesson[] = [
  {
    id: 'array-basics',
    title: 'What is an array?',
    minutes: 6,
    summary: 'Storing many values in one row, and reaching any of them by its index.',
    blocks: [
      { t: 'text', title: 'Start with a picture', body: 'Imagine a row of lockers. Every locker has a **number on the door** and holds one item. To find something you do not search every locker: you walk straight to the number you need. An **array** works exactly like that row of lockers.' },
      { t: 'explore', title: 'Try it: tap any box', frame: arr([10, 20, 30, 40, 50], { label: 'arr' }), caption: 'The number under a box is its index. The value inside is what is stored there.' },
      { t: 'points', title: 'The key facts', items: ['An array stores values of the same kind **next to each other** in memory.', 'Every position has an **index**. Counting starts at **0**, not 1.', 'An array of length n has valid indexes 0 to n - 1.', 'Reading or writing `arr[i]` takes the same tiny amount of time wherever i is. That is called **O(1)**, or constant time.'] },
      { t: 'code', title: 'Reading and updating (Python)', code: 'arr = [10, 20, 30, 40, 50]\n\nprint(arr[0])    # 10  -> the first element\nprint(arr[4])    # 50  -> the last element (length - 1)\n\narr[2] = 99      # update the element at index 2\nprint(arr)       # [10, 20, 99, 40, 50]\nprint(len(arr))  # 5' },
      { t: 'mistakes', items: ['**Off-by-one:** an array of length 5 has no `arr[5]`. The last index is 4.', 'Thinking the first element is `arr[1]`. It is `arr[0]`.', 'In Java and C++ the size is fixed once created. Python lists and JavaScript arrays can grow, but the index idea is identical.'] },
      { t: 'interview', items: ['Almost every DSA topic is built on arrays, so index arithmetic must feel automatic.', 'Interviewers often ask: what is the time to access an element by index? (O(1))'] },
    ],
    checkpoint: [
      { q: 'An array has 5 elements. What is the index of the LAST element?', options: ['5', '4', '6', '0'], answer: 1, why: 'Indexes start at 0, so the five elements use indexes 0, 1, 2, 3 and 4.' },
      { q: 'How long does reading arr[3] take, as the array gets very large?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], answer: 2, why: 'The computer jumps straight to the position using the index, so the time does not grow with the array size.' },
    ],
  },
  {
    id: 'array-operations',
    title: 'Traversal, insertion and deletion',
    minutes: 8,
    summary: 'Visiting every element, and what it costs to insert or delete in the middle.',
    blocks: [
      { t: 'text', title: 'Traversal: visit every element', body: 'To **traverse** an array you move from index 0 to the last index and look at each element once. If the array has n elements, that takes n steps, so it is **O(n)**.' },
      { t: 'code', title: 'Traversal and linear search', code: 'arr = [4, 8, 15, 16, 23]\n\n# traversal: print everything\nfor i in range(len(arr)):\n    print(i, arr[i])\n\n# linear search: where is 15?\nfor i in range(len(arr)):\n    if arr[i] == 15:\n        print("found at", i)\n        break' },
      { t: 'text', title: 'Insertion needs shifting', body: 'Array cells sit side by side, so there is no empty gap to drop a new value into. To insert in the middle you must **shift the elements to the right**, starting from the END so nothing is overwritten.' },
      {
        t: 'dryrun',
        title: 'Dry run: insert 25 at index 2',
        code: '# arr = [10, 20, 30, 40, _]   (length 4, capacity 5)\nfor i in range(3, 1, -1):   # i = 3, then 2\n    arr[i + 1] = arr[i]     # shift right\narr[2] = 25                 # write the new value',
        steps: [
          { frame: arr([10, 20, 30, 40, '·'], { label: 'arr', pointers: { 2: 'insert here' } }), note: 'We have [10, 20, 30, 40] with one free slot at the end. We want 25 at index 2.' },
          { frame: arr([10, 20, 30, 40, 40], { marks: { 3: 'hl', 4: 'good' } }), note: 'Shift from the right: copy 40 (index 3) into index 4.' },
          { frame: arr([10, 20, 30, 30, 40], { marks: { 2: 'hl', 3: 'good' } }), note: 'Copy 30 (index 2) into index 3. Index 2 is now free to overwrite.' },
          { frame: arr([10, 20, 25, 30, 40], { marks: { 2: 'good' } }), note: 'Write 25 at index 2. Done: [10, 20, 25, 30, 40].' },
        ],
      },
      {
        t: 'dryrun',
        title: 'Dry run: delete the element at index 1',
        steps: [
          { frame: arr([10, 20, 30, 40], { marks: { 1: 'bad' } }), note: 'We want to remove 20 (index 1).' },
          { frame: arr([10, 30, 30, 40], { marks: { 1: 'good', 2: 'hl' } }), note: 'Shift LEFT, starting from the front: copy 30 (index 2) into index 1.' },
          { frame: arr([10, 30, 40, 40], { marks: { 2: 'good', 3: 'hl' } }), note: 'Copy 40 (index 3) into index 2.' },
          { frame: arr([10, 30, 40, '·'], { marks: { 3: 'dim' } }), note: 'The last slot is no longer part of the array: shrink the length to 3. Result: [10, 30, 40].' },
        ],
      },
      { t: 'complexity', rows: [['Access arr[i]', 'O(1)', 'Jump straight to the index.'], ['Search (unsorted)', 'O(n)', 'May have to check every element.'], ['Insert / delete at the END', 'O(1)', 'Nothing has to move.'], ['Insert / delete at the START or MIDDLE', 'O(n)', 'Elements must shift.']] },
      { t: 'mistakes', items: ['Shifting in the wrong direction when inserting. Going left to right overwrites values you still need.', 'Forgetting to update the length after a delete.', 'Using a loop that runs to `len(arr)` and then reading `arr[i + 1]`, which is out of range on the last turn.'] },
      { t: 'interview', items: ['"Remove duplicates in place" and "move zeroes" are classic problems about shifting without extra space.', 'Say the cost out loud: inserting at the front is O(n) because everything moves.'] },
    ],
    checkpoint: [
      { q: 'What is the time cost of inserting a value at the START of an array of n elements?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(1) on average, always'], answer: 1, why: 'Every existing element has to shift one place to the right to make room.' },
      { q: 'When inserting in the middle, which way do you shift the elements, and where do you start?', options: ['Left, from the front', 'Right, from the front', 'Right, from the end', 'No shifting is needed'], answer: 2, why: 'Starting from the end means every value is copied before the slot it came from is overwritten.' },
    ],
  },
  {
    id: 'two-pointers-window',
    title: 'Two pointers and sliding window',
    minutes: 10,
    summary: 'Two smart patterns that turn slow double loops into a single pass.',
    blocks: [
      { t: 'text', title: 'The problem with brute force', body: 'Suppose you must find two numbers in a **sorted** array that add up to a target. Checking every pair uses two loops: about n × n steps, **O(n²)**. The **two pointers** pattern does it in one pass, **O(n)**, by using the fact that the array is sorted.' },
      { t: 'points', title: 'Two pointers: the idea', items: ['Put one pointer **L** at the start and one pointer **R** at the end.', 'If the sum is **too big**, move R left (a smaller number).', 'If the sum is **too small**, move L right (a bigger number).', 'Stop when the sum matches or the pointers meet.'] },
      {
        t: 'dryrun',
        title: 'Dry run: sorted [1, 3, 4, 6, 8, 11], target 10',
        code: 'L, R = 0, len(arr) - 1\nwhile L < R:\n    s = arr[L] + arr[R]\n    if s == target: return (L, R)\n    if s < target:  L += 1\n    else:           R -= 1',
        steps: [
          { frame: arr([1, 3, 4, 6, 8, 11], { pointers: { 0: 'L', 5: 'R' }, marks: { 0: 'hl', 5: 'hl' } }), note: '1 + 11 = 12. That is bigger than 10, so move R left.' },
          { frame: arr([1, 3, 4, 6, 8, 11], { pointers: { 0: 'L', 4: 'R' }, marks: { 0: 'hl', 4: 'hl', 5: 'dim' } }), note: '1 + 8 = 9. Smaller than 10, so move L right.' },
          { frame: arr([1, 3, 4, 6, 8, 11], { pointers: { 1: 'L', 4: 'R' }, marks: { 1: 'hl', 4: 'hl', 0: 'dim', 5: 'dim' } }), note: '3 + 8 = 11. Bigger, so move R left.' },
          { frame: arr([1, 3, 4, 6, 8, 11], { pointers: { 1: 'L', 3: 'R' }, marks: { 1: 'hl', 3: 'hl', 0: 'dim', 4: 'dim', 5: 'dim' } }), note: '3 + 6 = 9. Smaller, so move L right.' },
          { frame: arr([1, 3, 4, 6, 8, 11], { pointers: { 2: 'L', 3: 'R' }, marks: { 2: 'good', 3: 'good', 0: 'dim', 1: 'dim', 4: 'dim', 5: 'dim' } }), note: '4 + 6 = 10. Found it! We only looked at a few pairs instead of all of them.' },
        ],
      },
      { t: 'text', title: 'Sliding window: the second pattern', body: 'Now find the **largest sum of any 3 neighbouring elements**. Recomputing every window from scratch repeats work. Instead keep the current sum and **slide**: add the element that enters the window and subtract the one that leaves. Each step costs O(1), so the whole scan is **O(n)**.' },
      {
        t: 'dryrun',
        title: 'Dry run: [2, 1, 5, 1, 3, 2], window size k = 3',
        code: 'window = sum(arr[:k])\nbest = window\nfor i in range(k, len(arr)):\n    window += arr[i] - arr[i - k]   # add new, drop old\n    best = max(best, window)',
        steps: [
          { frame: arr([2, 1, 5, 1, 3, 2], { marks: { 0: 'hl', 1: 'hl', 2: 'hl' } }), note: 'First window: 2 + 1 + 5 = 8. best = 8.' },
          { frame: arr([2, 1, 5, 1, 3, 2], { marks: { 1: 'hl', 2: 'hl', 3: 'hl', 0: 'dim' } }), note: 'Slide: add 1, drop 2. Sum = 8 + 1 - 2 = 7. best stays 8.' },
          { frame: arr([2, 1, 5, 1, 3, 2], { marks: { 2: 'good', 3: 'good', 4: 'good', 0: 'dim', 1: 'dim' } }), note: 'Slide: add 3, drop 1. Sum = 7 + 3 - 1 = 9. New best = 9.' },
          { frame: arr([2, 1, 5, 1, 3, 2], { marks: { 3: 'hl', 4: 'hl', 5: 'hl', 2: 'good', 0: 'dim', 1: 'dim' } }), note: 'Slide: add 2, drop 5. Sum = 9 + 2 - 5 = 6. The answer is 9 (the window 5, 1, 3).' },
        ],
      },
      { t: 'complexity', rows: [['Brute force (all pairs / all windows)', 'O(n²) or O(n·k)', 'Repeats a lot of work.'], ['Two pointers', 'O(n)', 'Each pointer only moves one way.'], ['Sliding window', 'O(n)', 'Each element enters and leaves once.'], ['Extra space', 'O(1)', 'Just a few variables.']] },
      { t: 'mistakes', items: ['Using two pointers on an **unsorted** array: moving L or R then proves nothing.', 'Moving both pointers at once, which can skip the answer.', 'Forgetting to subtract the element that left the window.'] },
      { t: 'interview', items: ['Two Sum II, Container With Most Water and Valid Palindrome are two-pointer classics.', 'Maximum Average Subarray and Longest Substring Without Repeating Characters use a sliding window.', 'Always state why the pattern works: "the array is sorted, so moving R left can only make the sum smaller".'] },
    ],
    checkpoint: [
      { q: 'For the pair-sum two-pointer method to work on [1, 3, 4, 6, 8, 11], what must be true about the array?', options: ['It has an even length', 'It is sorted', 'It has no negative numbers', 'It has no duplicates'], answer: 1, why: 'Sorted order is what tells us that moving R left makes the sum smaller and moving L right makes it larger.' },
      { q: 'When the window slides one place, how do you update the sum?', options: ['Recompute all k elements', 'Add the new element, subtract the one that left', 'Subtract the new element, add the one that left', 'Multiply by k'], answer: 1, why: 'Only one element enters and one leaves, so a single add and a single subtract is enough.' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* TREES                                                               */
/* ------------------------------------------------------------------ */

const treeLessons: Lesson[] = [
  {
    id: 'tree-basics',
    title: 'Nodes, root and children',
    minutes: 7,
    summary: 'The vocabulary of trees, and what makes a tree binary.',
    blocks: [
      { t: 'text', title: 'A tree is a family tree', body: 'Arrays and lists are lines. A **tree** branches. Think of a family tree or the folders on your computer: one folder at the top, folders inside folders. It is built from **nodes** joined by **edges**.' },
      { t: 'diagram', title: 'Read the picture', frame: tree([8, 3, 10, 1, 6, null, 14], { marks: { 0: 'hl', 3: 'good', 4: 'good', 6: 'good' }, label: 'binary tree' }), caption: 'Amber = root (8). Green = leaves (1, 6, 14), the nodes with no children.' },
      { t: 'points', title: 'The vocabulary', items: ['**Root:** the top node (8). Every tree has exactly one.', '**Parent / child:** 3 is the parent of 1 and 6. 1 and 6 are its children.', '**Leaf:** a node with no children (1, 6 and 14).', '**Depth of a node:** how many edges from the root down to it. Node 6 has depth 2.', '**Height of the tree:** the longest path from the root down to a leaf. Here it is 2.', '**Subtree:** any node together with everything below it.', '**Binary tree:** every node has **at most 2 children**, called left and right.'] },
      { t: 'code', title: 'A node in code (Python)', code: 'class Node:\n    def __init__(self, value):\n        self.value = value\n        self.left = None    # left child (or None)\n        self.right = None   # right child (or None)\n\nroot = Node(8)\nroot.left = Node(3)\nroot.right = Node(10)\nroot.left.left = Node(1)' },
      { t: 'mistakes', items: ['Mixing up **depth** (counted from the root down) and **height** (counted from a node down to its deepest leaf).', 'Forgetting that a child can be `None`. Code that reads `node.left.value` without checking crashes on a leaf.', 'Thinking a tree can contain a cycle. If it does, it is a graph, not a tree.'] },
      { t: 'interview', items: ['Most tree questions are solved with recursion: solve the left subtree, solve the right subtree, combine.', 'Be ready to define root, leaf, height and depth precisely.'] },
    ],
    checkpoint: [
      { q: 'How many children can a node of a BINARY tree have at most?', options: ['1', '2', '3', 'Any number'], answer: 1, why: 'Binary means two: a left child and a right child.' },
      { q: 'What do we call a node that has no children?', options: ['Root', 'Parent', 'Leaf', 'Edge'], answer: 2, why: 'Leaves sit at the bottom of the tree.' },
    ],
  },
  {
    id: 'tree-traversals',
    title: 'Traversals: DFS and BFS',
    minutes: 10,
    summary: 'The four standard ways to visit every node, with a full dry run.',
    blocks: [
      { t: 'text', title: 'Visiting every node', body: 'A **traversal** visits every node exactly once. The order depends on the rule you follow. **Depth-first (DFS)** goes as deep as it can before coming back. **Breadth-first (BFS)** visits the tree level by level.' },
      { t: 'points', title: 'The three DFS orders', items: ['**Preorder:** node, then left, then right.', '**Inorder:** left, then node, then right.', '**Postorder:** left, then right, then node.', 'The only difference is **when you visit the node** compared with its two subtrees.'] },
      {
        t: 'dryrun',
        title: 'Dry run: inorder on a small tree',
        code: 'def inorder(node):\n    if node is None:        # base case\n        return\n    inorder(node.left)      # 1. left\n    visit(node)             # 2. the node itself\n    inorder(node.right)     # 3. right',
        steps: [
          { frame: tree([4, 2, 6, 1, 3, 5, 7]), note: 'Start at the root, 4. Inorder says: finish the whole LEFT subtree first.' },
          { frame: tree([4, 2, 6, 1, 3, 5, 7], { marks: { 3: 'good' }, order: { 3: 1 } }), note: 'Go left twice: 4, then 2, then 1. Node 1 has no left child, so visit 1. Visited: 1.' },
          { frame: tree([4, 2, 6, 1, 3, 5, 7], { marks: { 1: 'good', 3: 'dim' }, order: { 3: 1, 1: 2 } }), note: 'Back up to 2. Its left side is done, so visit 2. Visited: 1, 2.' },
          { frame: tree([4, 2, 6, 1, 3, 5, 7], { marks: { 4: 'good', 3: 'dim', 1: 'dim' }, order: { 3: 1, 1: 2, 4: 3 } }), note: 'Now 2\'s right child, 3. It has no children, so visit 3. Visited: 1, 2, 3.' },
          { frame: tree([4, 2, 6, 1, 3, 5, 7], { marks: { 0: 'good', 3: 'dim', 1: 'dim', 4: 'dim' }, order: { 3: 1, 1: 2, 4: 3, 0: 4 } }), note: 'The whole left subtree of 4 is finished. Visit 4. Visited: 1, 2, 3, 4.' },
          { frame: tree([4, 2, 6, 1, 3, 5, 7], { marks: { 5: 'good', 3: 'dim', 1: 'dim', 4: 'dim', 0: 'dim' }, order: { 3: 1, 1: 2, 4: 3, 0: 4, 5: 5 } }), note: 'Go right to 6, then left to 5. Visit 5. Visited: 1, 2, 3, 4, 5.' },
          { frame: tree([4, 2, 6, 1, 3, 5, 7], { marks: { 2: 'good', 3: 'dim', 1: 'dim', 4: 'dim', 0: 'dim', 5: 'dim' }, order: { 3: 1, 1: 2, 4: 3, 0: 4, 5: 5, 2: 6 } }), note: 'Visit 6. Visited: 1, 2, 3, 4, 5, 6.' },
          { frame: tree([4, 2, 6, 1, 3, 5, 7], { marks: { 6: 'good', 3: 'dim', 1: 'dim', 4: 'dim', 0: 'dim', 5: 'dim', 2: 'dim' }, order: { 3: 1, 1: 2, 4: 3, 0: 4, 5: 5, 2: 6, 6: 7 } }), note: 'Finally visit 7. Inorder result: 1, 2, 3, 4, 5, 6, 7. It came out SORTED, and that is no accident (see the next lesson).' },
        ],
      },
      { t: 'text', title: 'The same tree, every order', body: 'For this tree: **Preorder** = 4, 2, 1, 3, 6, 5, 7. **Inorder** = 1, 2, 3, 4, 5, 6, 7. **Postorder** = 1, 3, 2, 5, 7, 6, 4. **Level order (BFS)** = 4, 2, 6, 1, 3, 5, 7.' },
      { t: 'code', title: 'Level order with a queue', code: 'from collections import deque\n\ndef level_order(root):\n    if root is None:\n        return []\n    out, queue = [], deque([root])\n    while queue:\n        node = queue.popleft()      # take from the front\n        out.append(node.value)\n        if node.left:  queue.append(node.left)\n        if node.right: queue.append(node.right)\n    return out' },
      { t: 'complexity', rows: [['Time (any traversal)', 'O(n)', 'Every node is visited once.'], ['Space for DFS', 'O(h)', 'The recursion goes as deep as the tree height h.'], ['Space for BFS', 'O(w)', 'The queue holds a whole level, w = widest level.']] },
      { t: 'mistakes', items: ['Forgetting the base case `if node is None: return`, which causes infinite recursion or a crash.', 'Putting the visit line in the wrong place and getting preorder when you wanted inorder.', 'Using a stack instead of a queue for level order.'] },
      { t: 'interview', items: ['"Inorder of a BST is sorted" is asked constantly.', 'Level Order Traversal, Maximum Depth and Invert Binary Tree are the standard warm-ups.', 'BFS uses a **queue**. Recursive DFS uses the **call stack**.'] },
    ],
    checkpoint: [
      { q: 'Which data structure does BFS (level order) use?', options: ['Stack', 'Queue', 'Heap', 'Array of arrays'], answer: 1, why: 'A queue serves nodes first-in, first-out, which gives you the tree one level after another.' },
      { q: 'In which order does INORDER visit a node?', options: ['Node, left, right', 'Left, node, right', 'Left, right, node', 'Level by level'], answer: 1, why: 'Inorder finishes the left subtree, visits the node, then does the right subtree.' },
    ],
  },
  {
    id: 'binary-search-tree',
    title: 'Binary Search Trees',
    minutes: 8,
    summary: 'A tree kept in order so that searching is fast.',
    blocks: [
      { t: 'text', title: 'A tree with a rule', body: 'A **Binary Search Tree (BST)** is a binary tree with one rule at every node: everything in the **left subtree is smaller** and everything in the **right subtree is larger**. That rule lets you throw away half the tree at each step, just like binary search on a sorted array.' },
      { t: 'diagram', title: 'Check the rule', frame: tree([8, 3, 10, 1, 6, null, 14], { marks: { 0: 'hl' }, label: 'BST' }), caption: 'Left of 8 are 3, 1 and 6 (all smaller). Right of 8 are 10 and 14 (all larger). The same holds at every node.' },
      {
        t: 'dryrun',
        title: 'Dry run: search for 6',
        code: 'def search(node, target):\n    if node is None: return False\n    if target == node.value: return True\n    if target < node.value:\n        return search(node.left, target)\n    return search(node.right, target)',
        steps: [
          { frame: tree([8, 3, 10, 1, 6, null, 14], { marks: { 0: 'hl' } }), note: 'At 8. We want 6. 6 < 8, so the answer can only be in the left subtree. The right side is ignored.' },
          { frame: tree([8, 3, 10, 1, 6, null, 14], { marks: { 1: 'hl', 0: 'dim', 2: 'dim', 6: 'dim' } }), note: 'At 3. 6 > 3, so go right.' },
          { frame: tree([8, 3, 10, 1, 6, null, 14], { marks: { 4: 'good', 0: 'dim', 1: 'dim', 2: 'dim', 3: 'dim', 6: 'dim' } }), note: 'At 6. Found! Only 3 nodes visited out of 6.' },
        ],
      },
      {
        t: 'dryrun',
        title: 'Dry run: insert 7',
        steps: [
          { frame: tree([8, 3, 10, 1, 6, null, 14], { marks: { 0: 'hl' } }), note: 'Inserting follows the same path as searching. 7 < 8, go left.' },
          { frame: tree([8, 3, 10, 1, 6, null, 14], { marks: { 1: 'hl' } }), note: '7 > 3, go right.' },
          { frame: tree([8, 3, 10, 1, 6, null, 14], { marks: { 4: 'hl' } }), note: '7 > 6, so go right. 6 has no right child.' },
          { frame: tree([8, 3, 10, 1, 6, null, 14, null, null, null, 7], { marks: { 10: 'good' } }), note: 'That empty spot is where 7 belongs. The new node is always attached as a leaf.' },
        ],
      },
      { t: 'complexity', rows: [['Search / insert (balanced tree)', 'O(log n)', 'Each step halves the nodes left to check.'], ['Search / insert (skewed tree)', 'O(n)', 'Inserting 1, 2, 3, 4, ... makes a straight line like a linked list.'], ['Inorder traversal', 'O(n)', 'Visits every node, and the output is sorted.']] },
      { t: 'mistakes', items: ['Checking only a node\'s direct children. The rule applies to the **whole subtree**: a 9 hiding in the left subtree of 8 breaks the BST even if its parent looks fine.', 'Assuming a BST is always fast. A skewed BST degrades to O(n).', 'Not deciding how to treat duplicates (usually they are not allowed, or always go to one side).'] },
      { t: 'interview', items: ['**Validate Binary Search Tree** is a top question. The trick: pass down a (min, max) range for each node.', 'Inorder traversal of a valid BST must be strictly increasing.', 'Mention balanced variants (AVL, Red-Black) when asked how to avoid the O(n) worst case.'] },
    ],
    checkpoint: [
      { q: 'You are searching for 14 and you are at node 8 of the BST above. Which way do you go?', options: ['Left', 'Right', 'Both', 'Stop: it is not there'], answer: 1, why: '14 is greater than 8, and larger values live in the right subtree.' },
      { q: 'What is the worst-case search time of a BST with n nodes?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 2, why: 'If the nodes were inserted in sorted order the tree becomes one long chain, and you may have to walk all n nodes.' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* GRAPHS                                                              */
/* ------------------------------------------------------------------ */

const graphLessons: Lesson[] = [
  {
    id: 'graph-basics',
    title: 'Vertices, edges and adjacency lists',
    minutes: 7,
    summary: 'What a graph is and how to store one in code.',
    blocks: [
      { t: 'text', title: 'Things and the links between them', body: 'A **graph** is a set of things (**vertices**, also called nodes) and the links between them (**edges**). Cities and roads, people and friendships, web pages and hyperlinks are all graphs. A tree is just a graph with no cycles.' },
      { t: 'diagram', title: 'A small graph', frame: graph({ label: 'undirected graph' }), caption: '6 vertices (A to F) and 6 edges. Because the edges have no arrows, A-B means B-A too.' },
      { t: 'points', title: 'Vocabulary', items: ['**Undirected edge:** works both ways (a friendship). **Directed edge:** one way (a follow).', '**Neighbours:** vertices joined to a vertex by an edge. A has neighbours B and C.', '**Degree:** the number of neighbours. A has degree 2, B has degree 3.', '**Path:** a sequence of vertices connected by edges, like A, B, E, F.', '**Cycle:** a path that returns to where it started, like A, B, E, F, C, A.', '**Weighted graph:** each edge has a cost, such as a distance.'] },
      { t: 'text', title: 'Storing a graph', body: 'The most common way is an **adjacency list**: for every vertex, a list of its neighbours. It uses space only for edges that exist, **O(V + E)**. The alternative, an adjacency matrix, uses a V × V table, which costs O(V²) space even for a sparse graph.' },
      { t: 'code', title: 'Adjacency list (Python)', code: 'graph = {\n    "A": ["B", "C"],\n    "B": ["A", "D", "E"],\n    "C": ["A", "F"],\n    "D": ["B"],\n    "E": ["B", "F"],\n    "F": ["C", "E"],\n}\n\nprint(graph["B"])   # neighbours of B -> ["A", "D", "E"]' },
      { t: 'mistakes', items: ['In an **undirected** graph, adding the edge only in one list. It must be stored in both: A in B\'s list and B in A\'s list.', 'Walking a graph without remembering visited vertices. A cycle then makes you loop forever.', 'Using a matrix for a huge sparse graph and running out of memory.'] },
      { t: 'interview', items: ['Many problems are graphs in disguise: islands in a grid, course prerequisites, word ladders.', 'Say "I will build an adjacency list" first. It shows you know how to model the problem.'] },
    ],
    checkpoint: [
      { q: 'In an UNDIRECTED graph, how do you store the edge A-B in an adjacency list?', options: ['Only in A\'s list', 'Only in B\'s list', 'In both A\'s and B\'s lists', 'You do not store it'], answer: 2, why: 'An undirected edge works in both directions, so each endpoint lists the other as a neighbour.' },
      { q: 'What is the space used by an adjacency list for V vertices and E edges?', options: ['O(V²)', 'O(V + E)', 'O(E²)', 'O(1)'], answer: 1, why: 'There is one entry per vertex plus one entry per edge direction.' },
    ],
  },
  {
    id: 'graph-bfs',
    title: 'Breadth-First Search (BFS)',
    minutes: 9,
    summary: 'Explore a graph level by level using a queue.',
    blocks: [
      { t: 'text', title: 'Like ripples in a pond', body: '**BFS** starts at one vertex and explores everything **one step away**, then everything **two steps away**, and so on, like ripples spreading out. It uses a **queue** (first in, first out) to remember what to visit next, and a **visited** set so no vertex is queued twice.' },
      { t: 'points', title: 'The recipe', items: ['Put the start vertex in the queue and mark it visited.', 'Take the vertex at the FRONT of the queue.', 'For each unvisited neighbour: mark it visited and add it to the BACK of the queue.', 'Repeat until the queue is empty.'] },
      {
        t: 'dryrun',
        title: 'Dry run: BFS from A',
        code: 'from collections import deque\n\ndef bfs(graph, start):\n    visited = {start}\n    queue = deque([start])\n    order = []\n    while queue:\n        v = queue.popleft()\n        order.append(v)\n        for nb in graph[v]:\n            if nb not in visited:\n                visited.add(nb)\n                queue.append(nb)\n    return order',
        steps: [
          { frame: graph({ visited: ['A'], current: 'A', helper: { name: 'queue', items: ['A'] } }), note: 'Start: put A in the queue and mark it visited.' },
          { frame: graph({ visited: ['A', 'B', 'C'], current: 'A', helper: { name: 'queue', items: ['B', 'C'] } }), note: 'Take A. Its unvisited neighbours are B and C: queue them. Order so far: A.' },
          { frame: graph({ visited: ['A', 'B', 'C', 'D', 'E'], current: 'B', helper: { name: 'queue', items: ['C', 'D', 'E'] } }), note: 'Take B. A is already visited. Queue D and E. Order: A, B.' },
          { frame: graph({ visited: ['A', 'B', 'C', 'D', 'E', 'F'], current: 'C', helper: { name: 'queue', items: ['D', 'E', 'F'] } }), note: 'Take C. Queue F. Order: A, B, C.' },
          { frame: graph({ visited: ['A', 'B', 'C', 'D', 'E', 'F'], current: 'D', helper: { name: 'queue', items: ['E', 'F'] } }), note: 'Take D. Its only neighbour B is visited. Order: A, B, C, D.' },
          { frame: graph({ visited: ['A', 'B', 'C', 'D', 'E', 'F'], current: 'E', helper: { name: 'queue', items: ['F'] } }), note: 'Take E. Neighbours B and F are already visited. Order: A, B, C, D, E.' },
          { frame: graph({ visited: ['A', 'B', 'C', 'D', 'E', 'F'], current: 'F', helper: { name: 'queue', items: [] } }), note: 'Take F. The queue is empty, so we stop. BFS order: A, B, C, D, E, F. Notice it covered A, then everything 1 step away (B, C), then everything 2 steps away (D, E, F).' },
        ],
      },
      { t: 'complexity', rows: [['Time', 'O(V + E)', 'Each vertex is queued once and each edge is looked at a constant number of times.'], ['Space', 'O(V)', 'The visited set and the queue.']] },
      { t: 'mistakes', items: ['Marking a vertex visited only when you take it OUT of the queue. Mark it when you put it IN, or it can be queued many times.', 'Using a stack instead of a queue (that becomes DFS).', 'Forgetting a visited set on a graph with cycles.'] },
      { t: 'interview', items: ['BFS finds the **shortest path in an unweighted graph** (fewest edges). That is its superpower.', 'Number of Islands, Word Ladder and Rotting Oranges all use BFS.', 'Know BFS by heart: it is the basis of many other algorithms.'] },
    ],
    checkpoint: [
      { q: 'Which structure does BFS use to decide the next vertex to visit?', options: ['Stack', 'Queue', 'Priority heap', 'Hash map only'], answer: 1, why: 'The queue serves the oldest discovered vertex first, which keeps the search level by level.' },
      { q: 'BFS is the right tool for finding the shortest path (fewest edges) in which kind of graph?', options: ['Weighted graphs only', 'Unweighted graphs', 'Graphs with cycles only', 'Directed graphs only'], answer: 1, why: 'When every edge counts the same, the first time BFS reaches a vertex is along a fewest-edges path.' },
    ],
  },
  {
    id: 'graph-dfs',
    title: 'Depth-First Search (DFS)',
    minutes: 9,
    summary: 'Go as deep as possible, then back up, using recursion or a stack.',
    blocks: [
      { t: 'text', title: 'Like exploring a maze', body: '**DFS** picks one path and follows it **as far as it goes**. At a dead end it backs up to the last junction and tries the next path. The pending junctions are remembered by the **call stack** (recursion) or an explicit **stack**.' },
      { t: 'points', title: 'The recipe', items: ['Visit a vertex and mark it visited.', 'For each neighbour that is not visited, run DFS on it.', 'When a vertex has nothing new left, return (back up).'] },
      {
        t: 'dryrun',
        title: 'Dry run: DFS from A (neighbours in alphabetical order)',
        code: 'def dfs(graph, v, visited, order):\n    visited.add(v)\n    order.append(v)\n    for nb in graph[v]:\n        if nb not in visited:\n            dfs(graph, nb, visited, order)',
        steps: [
          { frame: graph({ visited: ['A'], current: 'A', helper: { name: 'path', items: ['A'] } }), note: 'Visit A. Its first unvisited neighbour is B, so go deeper to B.' },
          { frame: graph({ visited: ['A', 'B'], current: 'B', helper: { name: 'path', items: ['A', 'B'] } }), note: 'Visit B. Its first unvisited neighbour is D.' },
          { frame: graph({ visited: ['A', 'B', 'D'], current: 'D', helper: { name: 'path', items: ['A', 'B', 'D'] } }), note: 'Visit D. D has no unvisited neighbours: a dead end. Back up to B.' },
          { frame: graph({ visited: ['A', 'B', 'D', 'E'], current: 'E', helper: { name: 'path', items: ['A', 'B', 'E'] } }), note: 'Back at B, the next unvisited neighbour is E. Visit E.' },
          { frame: graph({ visited: ['A', 'B', 'D', 'E', 'F'], current: 'F', helper: { name: 'path', items: ['A', 'B', 'E', 'F'] } }), note: 'From E go to F.' },
          { frame: graph({ visited: ['A', 'B', 'D', 'E', 'F', 'C'], current: 'C', helper: { name: 'path', items: ['A', 'B', 'E', 'F', 'C'] } }), note: 'From F go to C. C\'s neighbours A and F are visited, so every call now returns. DFS order: A, B, D, E, F, C.' },
        ],
      },
      { t: 'text', title: 'BFS vs DFS on the same graph', body: 'BFS gave **A, B, C, D, E, F** (level by level). DFS gave **A, B, D, E, F, C** (deep first). Both visit every vertex and both cost **O(V + E)**. They differ in the **order**, which decides what each is good at.' },
      { t: 'complexity', rows: [['Time', 'O(V + E)', 'Every vertex and edge is processed once.'], ['Space', 'O(V)', 'Visited set plus the recursion depth.']] },
      { t: 'mistakes', items: ['Forgetting the visited set: on a graph with a cycle the recursion never ends.', 'Very deep graphs can overflow the recursion limit. Use an explicit stack instead.', 'Expecting DFS to find the shortest path. It finds **a** path, not necessarily the shortest.'] },
      { t: 'interview', items: ['DFS is used for cycle detection, connected components, topological sort and "does a path exist" questions.', 'Clone Graph and Course Schedule are common DFS problems.', 'Be ready to explain when you would pick BFS (shortest path) versus DFS (explore everything, backtracking).'] },
    ],
    checkpoint: [
      { q: 'What does DFS use to remember where to go back to?', options: ['A queue', 'A stack or the recursion call stack', 'A sorted array', 'Nothing'], answer: 1, why: 'Backing up to the last junction is last-in, first-out, which is exactly a stack.' },
      { q: 'You need the path with the FEWEST edges between two vertices in an unweighted graph. Which should you use?', options: ['DFS', 'BFS', 'Either, the result is identical', 'Neither'], answer: 1, why: 'BFS reaches vertices in order of distance, so its first path is a fewest-edges path. DFS can wander down a long route first.' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* DYNAMIC PROGRAMMING                                                 */
/* ------------------------------------------------------------------ */

const FIB_TREE = [4, 3, 2, 2, 1, 1, 0, 1, 0] // fib(4) call tree, level order

const dpLessons: Lesson[] = [
  {
    id: 'dp-idea',
    title: 'The big idea of DP',
    minutes: 8,
    summary: 'Why plain recursion repeats work, and how remembering answers fixes it.',
    blocks: [
      { t: 'text', title: 'Do not solve the same thing twice', body: '**Dynamic Programming (DP)** is a simple habit: if you have already worked out the answer to a smaller problem, **write it down and reuse it** instead of working it out again. It turns some very slow recursive solutions into fast ones.' },
      { t: 'text', title: 'A slow example: Fibonacci', body: 'Each Fibonacci number is the sum of the two before it: `fib(n) = fib(n-1) + fib(n-2)`, with `fib(0) = 0` and `fib(1) = 1`. The plain recursive code is short, but look at how many calls it makes.' },
      { t: 'diagram', title: 'The calls made by fib(4)', frame: tree(FIB_TREE, { marks: { 2: 'bad', 3: 'bad', 4: 'bad', 5: 'bad', 7: 'bad' }, label: 'recursion tree' }), caption: 'fib(2) is computed TWICE and fib(1) is computed THREE times (red). For fib(40) the same small values are recomputed millions of times.' },
      { t: 'points', title: 'Two properties tell you DP will work', items: ['**Overlapping subproblems:** the same smaller problem comes up again and again (fib(2) above).', '**Optimal substructure:** the best answer to the big problem can be built from the best answers to its smaller problems.', 'If a problem has **both**, DP is usually the right tool. If subproblems never repeat (like merge sort), plain divide-and-conquer is enough.'] },
      { t: 'code', title: 'Plain recursion (slow)', code: 'def fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\n# fib(5) makes 15 calls, fib(30) makes about 2.7 million.' },
      { t: 'complexity', rows: [['Plain recursive fib(n)', 'O(2ⁿ)', 'The number of calls roughly doubles every time n grows by 1.'], ['With DP (next lessons)', 'O(n)', 'Each value from 0 to n is computed exactly once.']] },
      { t: 'mistakes', items: ['Using DP when subproblems do not overlap. It adds memory and gains nothing.', 'Jumping to code before writing down what the **state** is (what a subproblem looks like).'] },
      { t: 'interview', items: ['Interviewers want you to **spot** that a recursion has repeated work, then say "I can memoize this".', 'Classic first DP problems: Climbing Stairs, House Robber, Coin Change.'] },
    ],
    checkpoint: [
      { q: 'In the fib(4) recursion tree, fib(2) is calculated more than once. What is this property called?', options: ['Optimal substructure', 'Overlapping subproblems', 'Greedy choice', 'Tail recursion'], answer: 1, why: 'The same subproblem is needed again and again by different branches of the recursion.' },
      { q: 'What is the whole point of DP?', options: ['Use less code', 'Store results of subproblems so each is solved only once', 'Avoid using recursion at all', 'Sort the input first'], answer: 1, why: 'Reusing stored answers removes the repeated work that makes plain recursion exponential.' },
    ],
  },
  {
    id: 'dp-memoization',
    title: 'Memoization (top-down)',
    minutes: 8,
    summary: 'Keep your recursion, but remember every answer you compute.',
    blocks: [
      { t: 'text', title: 'Recursion with a notebook', body: '**Memoization** means: keep the recursive solution, but add a **memo** (a dictionary or array). Before computing `fib(n)`, look in the memo. If the answer is there, return it at once (a **cache hit**). If not, compute it, **store** it, then return it. It is called **top-down** because you start from the big problem and work down to the small ones.' },
      { t: 'code', title: 'Memoized Fibonacci (Python)', code: 'def fib(n, memo={}):\n    if n <= 1:\n        return n                 # base cases\n    if n in memo:\n        return memo[n]           # cache hit: reuse the answer\n    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)\n    return memo[n]               # store, then return' },
      {
        t: 'dryrun',
        title: 'Dry run: fib(5) with a memo',
        steps: [
          { frame: arr(['·', '·', '·', '·', '·', '·'], { label: 'memo[0..5]', pointers: { 5: 'want' } }), note: 'The memo is empty (· = unknown). We want fib(5), the last cell.' },
          { frame: arr([0, 1, '·', '·', '·', '·'], { marks: { 0: 'good', 1: 'good' } }), note: 'The recursion dives to the base cases: fib(0) = 0 and fib(1) = 1.' },
          { frame: arr([0, 1, 1, '·', '·', '·'], { marks: { 2: 'good' } }), note: 'fib(2) = fib(1) + fib(0) = 1. Store it.' },
          { frame: arr([0, 1, 1, 2, '·', '·'], { marks: { 2: 'hl', 3: 'good' } }), note: 'fib(3) = fib(2) + fib(1). fib(2) is a CACHE HIT (amber), no recomputing. Result 2.' },
          { frame: arr([0, 1, 1, 2, 3, '·'], { marks: { 3: 'hl', 2: 'hl', 4: 'good' } }), note: 'fib(4) = fib(3) + fib(2). Both are cache hits. Result 3.' },
          { frame: arr([0, 1, 1, 2, 3, 5], { marks: { 4: 'hl', 3: 'hl', 5: 'good' } }), note: 'fib(5) = fib(4) + fib(3) = 5. Each value was computed once. The expensive tree of repeated calls is gone.' },
        ],
      },
      { t: 'complexity', rows: [['Time', 'O(n)', 'There are n different subproblems and each is computed once, with O(1) work.'], ['Space', 'O(n)', 'The memo plus the recursion stack.']] },
      { t: 'mistakes', items: ['Forgetting to **store** the result in the memo, so nothing is ever reused.', 'A memo key that does not capture the whole state (for example forgetting a second changing parameter).', 'Using a mutable default argument like `memo={}` in real code. Create the memo inside a wrapper or pass it in.'] },
      { t: 'interview', items: ['Start with the brute-force recursion, then say "this repeats work, so I will memoize it". That is exactly what interviewers hope to hear.', 'In Python you can also use `@functools.lru_cache`.'] },
    ],
    checkpoint: [
      { q: 'What does a memo (cache) store in memoization?', options: ['The input array', 'The answers to subproblems already solved', 'The recursion depth', 'Only the final answer'], answer: 1, why: 'Storing each subproblem answer is what lets later calls reuse it.' },
      { q: 'With memoization, what is the time complexity of fib(n)?', options: ['O(2ⁿ)', 'O(n²)', 'O(n)', 'O(log n)'], answer: 2, why: 'Only n distinct values exist and each is computed a single time.' },
    ],
  },
  {
    id: 'dp-tabulation',
    title: 'Tabulation (bottom-up)',
    minutes: 9,
    summary: 'Fill a table from the smallest subproblem upward, with no recursion.',
    blocks: [
      { t: 'text', title: 'Build the answer from the ground up', body: '**Tabulation** solves the same problems **bottom-up**. You make a table, fill in the smallest cases first, then fill each next cell from cells you already have. There is no recursion, so no stack overflow and no function-call overhead.' },
      { t: 'points', title: 'Four questions to design any DP', items: ['**State:** what does `dp[i]` mean? (For stairs: the number of ways to reach step i.)', '**Base case:** which cells do you know without any work?', '**Transition:** how is `dp[i]` built from earlier cells?', '**Order:** fill the table so every cell you need already exists (smallest to largest).'] },
      { t: 'text', title: 'Example: Climbing Stairs', body: 'You climb n stairs taking 1 or 2 steps at a time. How many different ways reach the top? To stand on step i you came from step i-1 or step i-2, so **dp[i] = dp[i-1] + dp[i-2]**. Base: `dp[0] = 1` (one way to stay on the ground) and `dp[1] = 1`.' },
      {
        t: 'dryrun',
        title: 'Dry run: n = 5',
        code: 'def climb(n):\n    dp = [0] * (n + 1)\n    dp[0] = dp[1] = 1\n    for i in range(2, n + 1):\n        dp[i] = dp[i - 1] + dp[i - 2]\n    return dp[n]',
        steps: [
          { frame: arr([1, 1, '·', '·', '·', '·'], { label: 'dp[0..5]', marks: { 0: 'good', 1: 'good' } }), note: 'Base cases: dp[0] = 1 and dp[1] = 1.' },
          { frame: arr([1, 1, 2, '·', '·', '·'], { marks: { 0: 'hl', 1: 'hl', 2: 'good' } }), note: 'dp[2] = dp[1] + dp[0] = 1 + 1 = 2 (steps 1+1, or 2).' },
          { frame: arr([1, 1, 2, 3, '·', '·'], { marks: { 1: 'hl', 2: 'hl', 3: 'good' } }), note: 'dp[3] = dp[2] + dp[1] = 2 + 1 = 3.' },
          { frame: arr([1, 1, 2, 3, 5, '·'], { marks: { 2: 'hl', 3: 'hl', 4: 'good' } }), note: 'dp[4] = dp[3] + dp[2] = 3 + 2 = 5.' },
          { frame: arr([1, 1, 2, 3, 5, 8], { marks: { 3: 'hl', 4: 'hl', 5: 'good' } }), note: 'dp[5] = dp[4] + dp[3] = 5 + 3 = 8. There are 8 ways to climb 5 stairs.' },
        ],
      },
      { t: 'complexity', rows: [['Time', 'O(n)', 'One pass over the table, O(1) per cell.'], ['Space', 'O(n)', 'The table. Because each cell only needs the previous two, it can be cut to O(1) with two variables.']] },
      { t: 'text', title: 'Memoization or tabulation?', body: '**Memoization** is usually quicker to write because you keep the natural recursion, and it only computes states you actually need. **Tabulation** is usually faster in practice, avoids deep recursion, and makes space optimisation easy. Both give the same answers.' },
      { t: 'mistakes', items: ['Filling the table in the wrong order, so a cell uses one that is not ready yet.', 'Wrong base cases. They are the foundation of every other cell.', 'Off-by-one: the table needs n + 1 cells to hold indexes 0 to n.'] },
      { t: 'interview', items: ['Climbing Stairs, House Robber, Coin Change and Longest Increasing Subsequence are the standard DP set. They all follow the state, base, transition, order recipe.', 'Always state the recurrence out loud before coding.'] },
    ],
    checkpoint: [
      { q: 'In tabulation, in which order do you fill the table?', options: ['Largest subproblem first', 'Smallest subproblem first, building upward', 'Random order', 'From the middle outwards'], answer: 1, why: 'Each cell depends on smaller cells, so those must be filled first.' },
      { q: 'Using dp[i] = dp[i-1] + dp[i-2] with dp[0] = dp[1] = 1, how many ways are there to climb 4 stairs?', options: ['3', '4', '5', '8'], answer: 2, why: 'dp[2] = 2, dp[3] = 3 and dp[4] = 3 + 2 = 5.' },
    ],
  },
]

export const lessons: Record<string, Lesson[]> = {
  arrays: arrayLessons,
  trees: treeLessons,
  graphs: graphLessons,
  'dynamic-programming': dpLessons,
}
