type Difficulty = "Easy" | "Medium";
type Question = {
  difficulty: Difficulty;
  topic: string;
  prompt: string;
  emphasis: [keyword: string, detail: string];
  choices: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
};

// The presenter’s answer key follows this order. Keep the choices fixed too.
const questions: Question[] = [
  {
    difficulty: "Easy", answerIndex: 1,
    topic: "Graph basics", prompt: "What is a vertex in a graph?",
    emphasis: ["vertex", "in a graph"],
    choices: ["A connection between two nodes", "A point or node", "The cost of a connection", "A path through several nodes"],
    explanation: "A vertex is a node. An edge is a connection between vertices.",
  },
  {
    difficulty: "Easy", answerIndex: 3,
    topic: "Graph basics", prompt: "How can you traverse an edge in an undirected graph?",
    emphasis: ["undirected graph", "traverse an edge"],
    choices: ["Only from the first vertex to the second", "Only toward the vertex with the larger degree", "Only if its weight is positive", "In either direction"],
    explanation: "An undirected edge has no assigned direction. You can traverse it from either endpoint.",
  },
  {
    difficulty: "Easy", answerIndex: 0,
    topic: "Weighted graphs", prompt: "What does an edge weight usually represent in a weighted graph?",
    emphasis: ["edge weight", "weighted graph"],
    choices: ["A value such as distance or cost", "The number of vertices in the graph", "The order in which the edge was added", "The direction of the edge"],
    explanation: "An edge weight is a number attached to an edge. Its meaning depends on the problem being modeled.",
  },
  {
    difficulty: "Easy", answerIndex: 2,
    topic: "Graph storage", prompt: "What does an adjacency list store for each vertex?",
    emphasis: ["adjacency list", "each vertex"],
    choices: ["Every vertex in the graph", "All possible paths from that vertex", "Its directly connected neighbors", "The order in which a search visits the graph"],
    explanation: "The list contains the neighbors that share an edge with that vertex.",
  },
  {
    difficulty: "Medium", answerIndex: 1,
    topic: "Graph storage", prompt: "An edge between X and Y is removed from an undirected graph. Which entries change in its adjacency matrix?",
    emphasis: ["adjacency matrix", "edge between X and Y"],
    choices: ["Only row X, column Y", "Row X, column Y and row Y, column X", "Only row Y, column X", "Row X, column X and row Y, column Y"],
    explanation: "An undirected edge is represented in both directions, so both entries must show that there is no edge.",
  },
  {
    difficulty: "Medium", answerIndex: 3,
    topic: "Graph basics", prompt: "Vertex X is connected to three neighbors. One edge is removed and two new edges to different vertices are added. What is the new degree of X?",
    emphasis: ["degree of X", "two new edges"],
    choices: ["2", "3", "5", "4"],
    explanation: "Degree counts the edges touching a vertex. The new degree of X is 3 − 1 + 2 = 4.",
  },
  {
    difficulty: "Easy", answerIndex: 2,
    topic: "Breadth-first search", prompt: "Which data structure does BFS use to explore a graph level by level?",
    emphasis: ["BFS", "level by level"],
    choices: ["A stack", "A set of edge weights", "A queue", "A spanning tree"],
    explanation: "A queue processes vertices in the order they were discovered. This lets BFS explore one level before moving to the next.",
  },
  {
    difficulty: "Easy", answerIndex: 0,
    topic: "Depth-first search", prompt: "What does DFS do when the current vertex has no unvisited neighbors?",
    emphasis: ["DFS", "no unvisited neighbors"],
    choices: ["Backtracks along the current branch", "Starts the entire search over", "Chooses the neighbor with the smallest edge weight", "Visits all remaining vertices at once"],
    explanation: "DFS backtracks until it finds a vertex with another unvisited neighbor or finishes the search.",
  },
  {
    difficulty: "Medium", answerIndex: 1,
    topic: "Connectivity", prompt: "An undirected graph has two connected components. What happens if you add one edge between a vertex in each component?",
    emphasis: ["connected components", "add one edge"],
    choices: ["The graph keeps two components", "The two components merge into one", "Each component splits into two", "Every vertex becomes isolated"],
    explanation: "The new edge gives vertices in one component a path to vertices in the other component.",
  },
  {
    difficulty: "Easy", answerIndex: 3,
    topic: "Shortest paths", prompt: "Which algorithm finds shortest paths in a weighted graph with nonnegative edge weights?",
    emphasis: ["shortest paths", "nonnegative edge weights"],
    choices: ["Breadth-first search", "Depth-first search", "Kruskal’s algorithm", "Dijkstra’s algorithm"],
    explanation: "Dijkstra compares the total weights of paths from a starting vertex. It works when the edge weights are nonnegative.",
  },
  {
    difficulty: "Medium", answerIndex: 0,
    topic: "Shortest paths", prompt: "The direct edge from X to Z costs 9. The path X → Y → Z costs 2 + 4. Which distance does Dijkstra keep for Z after checking Y?",
    emphasis: ["Dijkstra", "after checking Y"],
    choices: ["6", "9", "11", "13"],
    explanation: "The path through Y costs 6, so it replaces the previous estimate of 9.",
  },
  {
    difficulty: "Easy", answerIndex: 2,
    topic: "Spanning trees", prompt: "What must a spanning tree do in a connected graph?",
    emphasis: ["spanning tree", "connected graph"],
    choices: ["Include every edge in the graph", "Connect only two selected vertices", "Connect every vertex without forming a cycle", "Give every vertex the same degree"],
    explanation: "A spanning tree includes all the graph’s vertices and connects them with no cycles.",
  },
  {
    difficulty: "Medium", answerIndex: 1,
    topic: "Spanning trees", prompt: "How many edges does a spanning tree of a connected graph with eight vertices have?",
    emphasis: ["spanning tree", "eight vertices"],
    choices: ["6", "7", "8", "9"],
    explanation: "A tree with n vertices has n − 1 edges. With eight vertices, that gives seven edges.",
  },
  {
    difficulty: "Medium", answerIndex: 3,
    topic: "Union-Find", prompt: "Union-Find gives X and Y different representatives. What does that tell Kruskal about adding X–Y?",
    emphasis: ["Union-Find", "different representatives"],
    choices: ["The edge would create a cycle", "The edge has the largest weight", "X and Y already have a path between them", "The edge joins two separate components"],
    explanation: "Different representatives mean the vertices are in separate components. Kruskal can connect them without forming a cycle.",
  },
  {
    difficulty: "Medium", answerIndex: 2,
    topic: "Kruskal’s algorithm", prompt: "Kruskal has already added X–Y and Y–Z. Why should it skip X–Z when that edge comes up?",
    emphasis: ["Kruskal", "skip X–Z"],
    choices: ["Every vertex must have the same degree", "X–Z must have a negative weight", "X and Z are already connected through Y", "Adding X–Z would disconnect Y"],
    explanation: "There is already a path from X to Z through Y. Adding X–Z would create the cycle X–Y–Z–X.",
  },
];

export type QuizQuestion = Omit<Question, "answerIndex"> & { answer: string };

export const quizQuestions: QuizQuestion[] = questions.map(({ answerIndex, ...question }) => ({
  ...question,
  answer: question.choices[answerIndex],
}));
