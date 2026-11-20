// Static content for the personalised DSA journey:
// realms (roadmap catalog), onboarding questions and the assessment question bank.
//
// To light up a new realm (e.g. Stack Tower): give it a `topicSlug` that exists in
// the frontend's data/topics.ts. Its missions then appear in every user's roadmap.
// `lessons` are the lesson ids of the frontend's data/lessons.ts, in teaching order.

export const MISSION_MINUTES = { learn: 20, game: 15, quiz: 5, practice: 20 };
// XP for finishing a mission for the first time, plus a bonus when a whole realm is cleared.
export const XP_REWARD = { learn: 15, game: 20, practice: 20, quiz: 25, realm: 40 };
export const QUIZ_PASS_RATIO = 0.6;
export const PRACTICE_TARGET = 2;

// difficulty: 1 (easy) .. 5 (expert). prereqs: realm ids that should come first.
// topicSlug: null = no learning content yet ("coming soon"), never counted as progress.
export const REALMS = [
  { id: "foundations", title: "Programming Foundations", icon: "⚙️", topicSlug: null, difficulty: 1, prereqs: [], blurb: "Variables, loops, functions and thinking like a machine." },
  { id: "arrays", title: "Array Kingdom", icon: "🔢", topicSlug: "arrays", game: "Array Breach", lessons: ["array-basics", "array-operations", "two-pointers-window"], difficulty: 1, prereqs: ["foundations"], blurb: "Indexing, two pointers, sliding windows and prefix sums." },
  { id: "strings", title: "String Forest", icon: "🌲", topicSlug: null, difficulty: 2, prereqs: ["arrays"], blurb: "Text processing, palindromes, anagrams and pattern tricks." },
  { id: "searching", title: "Searching Desert", icon: "🏜️", topicSlug: null, difficulty: 2, prereqs: ["arrays"], blurb: "Linear search, binary search and thinking in halves." },
  { id: "sorting", title: "Sorting Speedway", icon: "🏁", topicSlug: null, difficulty: 3, prereqs: ["searching"], blurb: "Bubble, merge and quick sort: speed, stability, trade-offs." },
  { id: "linkedlist", title: "Linked List Labyrinth", icon: "🔗", topicSlug: null, difficulty: 3, prereqs: ["arrays"], blurb: "Nodes, pointers, reversing and cycle detection." },
  { id: "stack", title: "Stack Tower", icon: "🗼", topicSlug: null, difficulty: 3, prereqs: ["linkedlist"], blurb: "LIFO thinking: parentheses, undo, monotonic stacks." },
  { id: "queue", title: "Queue Station", icon: "🚉", topicSlug: null, difficulty: 3, prereqs: ["stack"], blurb: "FIFO thinking: scheduling, buffers and BFS foundations." },
  { id: "recursion", title: "Recursion Dungeon", icon: "🌀", topicSlug: null, difficulty: 4, prereqs: ["stack"], blurb: "Base cases, call stacks and breaking problems into smaller ones." },
  { id: "trees", title: "Binary Tree Kingdom", icon: "🌳", topicSlug: "trees", game: "Trees Breach", lessons: ["tree-basics", "tree-traversals", "binary-search-tree"], difficulty: 4, prereqs: ["recursion", "linkedlist"], blurb: "Binary trees, BSTs and DFS / BFS traversals." },
  { id: "graphs", title: "Graph Galaxy", icon: "🕸️", topicSlug: "graphs", game: "Graphs Breach", lessons: ["graph-basics", "graph-bfs", "graph-dfs"], difficulty: 5, prereqs: ["trees", "queue"], blurb: "Nodes and edges: BFS, DFS and shortest paths." },
  { id: "dp", title: "Dynamic Programming Dimension", icon: "🧩", topicSlug: "dynamic-programming", game: "Dynamic Programming Breach", lessons: ["dp-idea", "dp-memoization", "dp-tabulation"], difficulty: 5, prereqs: ["recursion", "arrays"], blurb: "Overlapping subproblems, memoization and tabulation." },
];

export const DIFFICULTY_LABELS = ["", "Easy", "Easy+", "Medium", "Hard", "Expert"];

export const LEVELS = ["beginner", "basic", "intermediate", "advanced"];
export const FAMILIARITY = ["none", "heard", "some", "confident"];

export const ONBOARDING_STEPS = [
  {
    key: "level",
    title: "What is your current programming level?",
    hint: "Be honest. The Arena adapts to you.",
    multi: false,
    options: [
      { value: "beginner", icon: "🌱", label: "Just starting", desc: "I'm new to programming" },
      { value: "basic", icon: "⚡", label: "Know the basics", desc: "Variables, loops and functions" },
      { value: "intermediate", icon: "🛠️", label: "Comfortable coding", desc: "I build small projects on my own" },
      { value: "advanced", icon: "🚀", label: "Experienced", desc: "I code regularly or professionally" },
    ],
  },
  {
    key: "language",
    title: "Which programming language do you use?",
    hint: "Pick your main weapon.",
    multi: false,
    options: [
      { value: "python", icon: "🐍", label: "Python" },
      { value: "javascript", icon: "🟨", label: "JavaScript" },
      { value: "java", icon: "☕", label: "Java" },
      { value: "cpp", icon: "⚙️", label: "C++" },
      { value: "c", icon: "🔧", label: "C" },
      { value: "other", icon: "💬", label: "Other / pseudocode" },
    ],
  },
  {
    key: "dsaFamiliarity",
    title: "How familiar are you with DSA?",
    hint: "Data structures and algorithms.",
    multi: false,
    options: [
      { value: "none", icon: "🌫️", label: "Brand new", desc: "I've never studied it" },
      { value: "heard", icon: "👀", label: "Heard of it", desc: "I know the names, not the details" },
      { value: "some", icon: "📚", label: "Studied the basics", desc: "I know a few structures" },
      { value: "confident", icon: "🎯", label: "Confident", desc: "I solve problems regularly" },
    ],
  },
  {
    key: "goal",
    title: "What is your main goal?",
    hint: "Your roadmap will lean towards it.",
    multi: false,
    options: [
      { value: "basics", icon: "🧱", label: "Learn the fundamentals", desc: "Build a strong base" },
      { value: "college", icon: "🎓", label: "Ace college exams", desc: "Cover the syllabus with confidence" },
      { value: "interview", icon: "💼", label: "Crack coding interviews", desc: "Trees, graphs and DP matter most" },
      { value: "competitive", icon: "🏆", label: "Competitive programming", desc: "Speed and hard problems" },
      { value: "projects", icon: "🏗️", label: "Build better software", desc: "Pick the right structure for the job" },
    ],
  },
  {
    key: "dailyMinutes",
    title: "How much time can you spend learning daily?",
    hint: "We use this to estimate your journey length.",
    multi: false,
    options: [
      { value: 15, icon: "⏱️", label: "15 minutes", desc: "A quick daily burst" },
      { value: 30, icon: "🕐", label: "30 minutes", desc: "Steady progress" },
      { value: 60, icon: "🔥", label: "1 hour", desc: "Serious training" },
      { value: 120, icon: "🚀", label: "2 hours or more", desc: "Full immersion" },
    ],
  },
  {
    key: "studied",
    title: "Which DSA topics have you already studied?",
    hint: "Select all that apply. We will test this, not just trust it.",
    multi: true,
    options: [
      { value: "arrays", icon: "🔢", label: "Arrays" },
      { value: "strings", icon: "🌲", label: "Strings" },
      { value: "searching", icon: "🏜️", label: "Searching" },
      { value: "sorting", icon: "🏁", label: "Sorting" },
      { value: "linkedlist", icon: "🔗", label: "Linked lists" },
      { value: "stack", icon: "🗼", label: "Stacks" },
      { value: "queue", icon: "🚉", label: "Queues" },
      { value: "recursion", icon: "🌀", label: "Recursion" },
      { value: "trees", icon: "🌳", label: "Trees" },
      { value: "graphs", icon: "🕸️", label: "Graphs" },
      { value: "dp", icon: "🧩", label: "Dynamic programming" },
      { value: "none", icon: "🌱", label: "Nothing yet" },
    ],
  },
];

export const CATEGORY_LABELS = {
  logic: "Logical Reasoning",
  programming: "Programming Basics",
  "array-string": "Array & String Challenge",
  dsa: "DSA Check",
  exercise: "Problem-Solving Exercise",
};

// 12 questions, in this order. The difficulty of each pick adapts to previous answers.
export const SLOTS = [
  { cat: "logic" },
  { cat: "programming" },
  { cat: "array-string" },
  { cat: "dsa" },
  { cat: "logic" },
  { cat: "programming" },
  { cat: "array-string" },
  { cat: "dsa" },
  { cat: "dsa" },
  { cat: "exercise", type: "typed" },
  { cat: "dsa" },
  { cat: "exercise", type: "puzzle" },
];

// cat: logic | programming | array-string | dsa | exercise
// topic: a realm id (used for per-topic mastery)
// diff: 1 easy, 2 medium, 3 hard (also the scoring weight)
// type: mcq (answer = option index) | typed (accept = list of accepted answers) | puzzle (array to sort)
export const QUESTIONS = [
  // ---------------- logical reasoning ----------------
  { id: "L1", cat: "logic", topic: "foundations", diff: 1, type: "mcq", q: "What comes next in the sequence?  2, 4, 8, 16, …", options: ["24", "30", "32", "64"], answer: 2, why: "Each term doubles the previous one, so 16 × 2 = 32." },
  { id: "L2", cat: "logic", topic: "foundations", diff: 1, type: "mcq", q: "All bloops are razzies, and all razzies are lazzies. Which statement must be true?", options: ["All lazzies are bloops", "All bloops are lazzies", "Some razzies are not lazzies", "No bloop is a lazzy"], answer: 1, why: "Bloops sit inside razzies, which sit inside lazzies, so every bloop is a lazzy." },
  { id: "L3", cat: "logic", topic: "foundations", diff: 1, type: "mcq", q: "Dev is taller than Ana. Ana is taller than Raj. Maya is taller than Dev. Who is the second tallest?", options: ["Dev", "Ana", "Maya", "Raj"], answer: 0, why: "The order is Maya > Dev > Ana > Raj, so Dev is second." },
  { id: "L4", cat: "logic", topic: "foundations", diff: 2, type: "mcq", q: "What comes next?  3, 6, 11, 18, 27, …", options: ["36", "38", "40", "45"], answer: 1, why: "The gaps grow 3, 5, 7, 9, so the next gap is 11 and 27 + 11 = 38." },
  { id: "L5", cat: "logic", topic: "foundations", diff: 2, type: "mcq", q: "How many times does the digit 1 appear when you write every number from 1 to 20?", options: ["10", "11", "12", "13"], answer: 2, why: "1 and 10 give one each, 11 gives two, and 12 to 19 give one each: 1 + 1 + 2 + 8 = 12." },
  { id: "L6", cat: "logic", topic: "foundations", diff: 3, type: "mcq", q: "Eight coins look identical, but one is slightly heavier. What is the minimum number of weighings on a balance scale that guarantees finding it?", options: ["1", "2", "3", "4"], answer: 1, why: "Weigh 3 against 3. If they balance, the heavy coin is one of the 2 left over (one more weighing). Otherwise it is in the heavier 3, and one weighing of two of them decides. Either way: 2." },
  { id: "L7", cat: "logic", topic: "foundations", diff: 3, type: "mcq", q: "A clock shows 3:15. What is the angle between the hour hand and the minute hand?", options: ["0°", "7.5°", "15°", "22.5°"], answer: 1, why: "The minute hand is at 90°. The hour hand has moved a quarter of the way from 3 (90°) to 4 (120°), so it sits at 97.5°. The difference is 7.5°." },

  // ---------------- programming basics ----------------
  { id: "P1", cat: "programming", topic: "foundations", diff: 1, type: "mcq", q: "What is the value of x at the end?", code: "x = 5\nx = x + 3\nx = x * 2", options: ["10", "13", "16", "11"], answer: 2, why: "x becomes 8, then 8 × 2 = 16." },
  { id: "P2", cat: "programming", topic: "foundations", diff: 1, type: "mcq", q: "Which construct repeats a block of code while a condition stays true?", options: ["A variable", "A loop", "A comment", "An import"], answer: 1, why: "Loops (while / for) repeat code until their condition fails." },
  { id: "P3", cat: "programming", topic: "foundations", diff: 2, type: "mcq", q: "What does this print?", code: "i = 0\nwhile i < 3:\n    print(i)\n    i = i + 1", options: ["1 2 3", "0 1 2", "0 1 2 3", "It never stops"], answer: 1, why: "i starts at 0 and the loop stops once i reaches 3, so it prints 0, 1, 2." },
  { id: "P4", cat: "programming", topic: "foundations", diff: 2, type: "mcq", q: "What does 17 % 5 evaluate to in most languages?", options: ["3", "2", "12", "3.4"], answer: 1, why: "% is the remainder operator: 17 = 3 × 5 + 2." },
  { id: "P5", cat: "programming", topic: "foundations", diff: 2, type: "mcq", q: "What is total at the end? (i takes the values 1, 2, 3, 4)", code: "total = 0\nfor i from 1 to 4:\n    total = total + i", options: ["4", "10", "15", "24"], answer: 1, why: "1 + 2 + 3 + 4 = 10." },
  { id: "P6", cat: "programming", topic: "recursion", diff: 3, type: "mcq", q: "What does this print?", code: "def f(n):\n    if n == 0:\n        return 0\n    return n + f(n - 1)\n\nprint(f(4))", options: ["4", "6", "10", "24"], answer: 2, why: "f(4) = 4 + 3 + 2 + 1 + 0 = 10." },
  { id: "P7", cat: "programming", topic: "foundations", diff: 3, type: "mcq", q: "In Python, what does this print?", code: "a = [1, 2, 3]\nb = a\nb.append(4)\nprint(len(a))", options: ["3", "4", "7", "It raises an error"], answer: 1, why: "b = a copies the reference, not the list, so both names point to the same list, which now has 4 items." },

  // ---------------- array & string challenges ----------------
  { id: "A1", cat: "array-string", topic: "arrays", diff: 1, type: "mcq", q: "Given arr = [10, 20, 30, 40] with 0-based indexing, what is arr[2]?", options: ["20", "30", "40", "10"], answer: 1, why: "Indexes start at 0: arr[0]=10, arr[1]=20, arr[2]=30." },
  { id: "A2", cat: "array-string", topic: "arrays", diff: 1, type: "mcq", q: "In a 0-indexed array of length n, what is the index of the last element?", options: ["n", "n + 1", "n − 1", "n / 2"], answer: 2, why: "Indexes run from 0 to n − 1." },
  { id: "A3", cat: "array-string", topic: "arrays", diff: 2, type: "mcq", q: "arr = [3, 1, 4, 1, 5]. What is the sum of the elements at even indexes (0, 2 and 4)?", options: ["8", "12", "9", "14"], answer: 1, why: "3 + 4 + 5 = 12." },
  { id: "A4", cat: "array-string", topic: "strings", diff: 2, type: "mcq", q: "What is the reverse of the string \"arena\"?", options: ["anera", "aenra", "arena", "enara"], answer: 0, why: "Reading a-r-e-n-a backwards gives a-n-e-r-a." },
  { id: "A5", cat: "array-string", topic: "strings", diff: 2, type: "typed", q: "How many vowels (a, e, i, o, u) are in the word \"algorithm\"? Type the number.", placeholder: "e.g. 4", accept: ["3"], why: "a, o and i: 3 vowels." },
  { id: "A6", cat: "array-string", topic: "arrays", diff: 3, type: "mcq", q: "The array is sorted: [1, 3, 4, 6, 9, 11] and the target sum is 13. Which pair does the two-pointer method find?", options: ["1 and 11", "3 and 11", "4 and 9", "6 and 9"], answer: 2, why: "1+11=12 (too small, move left up), 3+11=14 (too big, move right down), 3+9=12 (too small), 4+9=13 ✓." },
  { id: "A7", cat: "array-string", topic: "strings", diff: 3, type: "mcq", q: "Which approach checks whether a string is a palindrome in O(n) time and O(1) extra space?", options: ["Build a reversed copy and compare", "Sort the characters", "Compare from both ends with two pointers", "Recursion with memoization"], answer: 2, why: "Two pointers walk inward from both ends and need no extra memory." },
  { id: "A8", cat: "array-string", topic: "arrays", diff: 3, type: "typed", q: "What is the maximum sum of any 3 consecutive elements in [2, 1, 5, 1, 3, 2]? Type the number.", placeholder: "e.g. 12", accept: ["9"], why: "Windows: 2+1+5=8, 1+5+1=7, 5+1+3=9, 1+3+2=6, so the best is 9." },

  // ---------------- DSA MCQs ----------------
  { id: "D1", cat: "dsa", topic: "arrays", diff: 1, type: "mcq", q: "What is the time complexity of reading arr[i] from an array?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], answer: 0, why: "The index maps straight to a memory address." },
  { id: "D2", cat: "dsa", topic: "arrays", diff: 2, type: "mcq", q: "Inserting a new element in the middle of an array costs…", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: 2, why: "Every element after the position has to shift one place." },
  { id: "D3", cat: "dsa", topic: "searching", diff: 2, type: "mcq", q: "Binary search can only be used when the data is…", options: ["Unique", "Sorted", "Stored in a tree", "Numeric"], answer: 1, why: "It discards half of the range by comparing with the middle, which needs ordered data." },
  { id: "D4", cat: "dsa", topic: "searching", diff: 3, type: "mcq", q: "Binary search on 1,000,000 sorted items needs roughly how many comparisons in the worst case?", options: ["10", "20", "1,000", "500,000"], answer: 1, why: "log₂(1,000,000) ≈ 20." },
  { id: "D5", cat: "dsa", topic: "sorting", diff: 2, type: "mcq", q: "Which of these sorting algorithms is based on divide and conquer?", options: ["Bubble sort", "Selection sort", "Merge sort", "Insertion sort"], answer: 2, why: "Merge sort splits the array, sorts both halves and merges them." },
  { id: "D6", cat: "dsa", topic: "sorting", diff: 3, type: "mcq", q: "Quicksort's worst-case time complexity is…", options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], answer: 1, why: "If every pivot is the smallest or largest item, the partitions are as unbalanced as possible." },
  { id: "D7", cat: "dsa", topic: "linkedlist", diff: 1, type: "mcq", q: "Each node of a singly linked list stores its data and…", options: ["An index", "A pointer to the next node", "The list length", "A hash"], answer: 1, why: "The next pointer is what links the nodes together." },
  { id: "D8", cat: "dsa", topic: "linkedlist", diff: 2, type: "mcq", q: "Reading the k-th element of a singly linked list takes…", options: ["O(1)", "O(k): walk from the head", "O(log k)", "O(k²)"], answer: 1, why: "There is no random access, so you follow k pointers from the head." },
  { id: "D9", cat: "dsa", topic: "stack", diff: 1, type: "mcq", q: "Which principle does a stack follow?", options: ["FIFO", "LIFO", "Random access", "Priority order"], answer: 1, why: "Last in, first out." },
  { id: "D10", cat: "dsa", topic: "stack", diff: 2, type: "mcq", q: "Which structure is the natural choice for checking balanced parentheses?", options: ["Queue", "Stack", "Heap", "Linked list of counts"], answer: 1, why: "The most recent opening bracket must be closed first: that is LIFO." },
  { id: "D11", cat: "dsa", topic: "queue", diff: 1, type: "mcq", q: "Which principle does a queue follow?", options: ["LIFO", "FIFO", "Random access", "Sorted order"], answer: 1, why: "First in, first out." },
  { id: "D12", cat: "dsa", topic: "queue", diff: 2, type: "mcq", q: "Breadth-first search uses which structure to track the frontier?", options: ["Stack", "Queue", "Heap", "Hash set only"], answer: 1, why: "A queue visits nodes level by level." },
  { id: "D13", cat: "dsa", topic: "recursion", diff: 2, type: "mcq", q: "Every correct recursive function needs a…", options: ["Loop", "Base case", "Global variable", "Return type of void"], answer: 1, why: "Without a base case the recursion never stops." },
  { id: "D14", cat: "dsa", topic: "recursion", diff: 3, type: "mcq", q: "A recursive sum(n) that calls sum(n − 1) uses how much extra stack space?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 2, why: "There are n nested calls on the call stack at the deepest point." },
  { id: "D15", cat: "dsa", topic: "trees", diff: 1, type: "mcq", q: "In a tree, a node with no children is called a…", options: ["Root", "Leaf", "Parent", "Edge"], answer: 1, why: "Leaves sit at the bottom of the tree." },
  { id: "D16", cat: "dsa", topic: "trees", diff: 2, type: "mcq", q: "An inorder traversal of a binary search tree visits the values in…", options: ["Random order", "Ascending order", "Descending order", "Level order"], answer: 1, why: "Left < node < right, so inorder gives sorted output." },
  { id: "D17", cat: "dsa", topic: "trees", diff: 3, type: "mcq", q: "What is the maximum number of nodes in a binary tree of height h? (A single root has height 0.)", options: ["2^h", "2^(h+1) − 1", "2h + 1", "h²"], answer: 1, why: "Level k holds up to 2^k nodes, so the total is 1 + 2 + … + 2^h = 2^(h+1) − 1." },
  { id: "D18", cat: "dsa", topic: "graphs", diff: 1, type: "mcq", q: "In a graph, the connection between two vertices is called an…", options: ["Edge", "Leaf", "Index", "Frame"], answer: 0, why: "Vertices (nodes) are joined by edges." },
  { id: "D19", cat: "dsa", topic: "graphs", diff: 2, type: "mcq", q: "Which algorithm finds the shortest path in an unweighted graph?", options: ["DFS", "BFS", "Binary search", "Merge sort"], answer: 1, why: "BFS reaches every node in order of distance." },
  { id: "D20", cat: "dsa", topic: "graphs", diff: 3, type: "mcq", q: "An adjacency list for a graph with V vertices and E edges uses…", options: ["O(V)", "O(V²)", "O(V + E)", "O(E²)"], answer: 2, why: "One list per vertex plus every edge stored once or twice." },
  { id: "D21", cat: "dsa", topic: "dp", diff: 1, type: "mcq", q: "Memoization means…", options: ["Sorting results", "Storing results of subproblems so they are reused", "Always taking the greedy choice", "Splitting data in halves"], answer: 1, why: "Cache the answer to each subproblem the first time you solve it." },
  { id: "D22", cat: "dsa", topic: "dp", diff: 2, type: "mcq", q: "Dynamic programming helps most when a problem has…", options: ["Sorted input", "Overlapping subproblems", "A tree structure", "Unique elements"], answer: 1, why: "Without overlap, caching gives no benefit." },
  { id: "D23", cat: "dsa", topic: "dp", diff: 3, type: "mcq", q: "Naive recursive Fibonacci runs in…", options: ["O(n)", "O(log n)", "O(2ⁿ)", "O(1)"], answer: 2, why: "Each call branches into two and recomputes the same values again and again." },
  { id: "D24", cat: "dsa", topic: "strings", diff: 2, type: "mcq", q: "Which structure is typically used to count how often each character appears in a string?", options: ["A hash map or counter array", "A linked list", "A binary tree", "A queue"], answer: 0, why: "Map each character to its running count." },

  // ---------------- problem-solving exercises (typed) ----------------
  { id: "X1", cat: "exercise", topic: "arrays", diff: 1, type: "typed", q: "What does this program print? Type the number.", code: "arr = [1, 2, 3, 4]\ntotal = 0\nfor x in arr:\n    total += x * x\nprint(total)", placeholder: "e.g. 10", accept: ["30"], why: "1 + 4 + 9 + 16 = 30." },
  { id: "X2", cat: "exercise", topic: "strings", diff: 2, type: "typed", q: "How many times does the substring \"an\" appear in \"banana\"? Type the number.", placeholder: "e.g. 1", accept: ["2"], why: "b-an-an-a: it appears at positions 1 and 3." },
  { id: "X3", cat: "exercise", topic: "sorting", diff: 2, type: "typed", q: "arr = [5, 3, 8, 1]. After ONE full left-to-right bubble-sort pass (swap neighbours when left > right), what is arr? Type the numbers separated by commas.", placeholder: "e.g. 1,2,3,4", accept: ["3,5,1,8"], why: "5>3 swap → [3,5,8,1]; 5<8 keep; 8>1 swap → [3,5,1,8]." },
  { id: "X4", cat: "exercise", topic: "recursion", diff: 3, type: "typed", q: "f(1) = 1, f(2) = 1 and f(n) = f(n − 1) + f(n − 2). What is f(7)? Type the number.", placeholder: "e.g. 21", accept: ["13"], why: "1, 1, 2, 3, 5, 8, 13: the 7th term is 13." },
  { id: "X5", cat: "exercise", topic: "dp", diff: 3, type: "typed", q: "You climb a staircase of 5 steps, taking 1 or 2 steps at a time. How many different ways can you reach the top? Type the number.", placeholder: "e.g. 5", accept: ["8"], why: "ways(n) = ways(n−1) + ways(n−2): 1, 2, 3, 5, 8." },

  // ---------------- problem-solving exercises (Phaser puzzle) ----------------
  { id: "Z1", cat: "exercise", topic: "sorting", diff: 1, type: "puzzle", q: "Sort the blocks from smallest to largest. Tap a block, then a neighbour, to swap them.", array: [3, 1, 2], slack: 2, why: "Every adjacent swap fixes at most one out-of-order pair." },
  { id: "Z2", cat: "exercise", topic: "sorting", diff: 2, type: "puzzle", q: "Sort the blocks from smallest to largest. Tap a block, then a neighbour, to swap them.", array: [4, 2, 5, 1, 3], slack: 2, why: "Count the out-of-order pairs: each adjacent swap can fix only one of them." },
  { id: "Z3", cat: "exercise", topic: "sorting", diff: 3, type: "puzzle", q: "Sort the blocks from smallest to largest. Tap a block, then a neighbour, to swap them.", array: [5, 2, 6, 1, 4, 3], slack: 1, why: "The minimum number of adjacent swaps equals the number of inversions (out-of-order pairs)." },
];
