import { questionSets } from "./questions";

export const presenters = [
  { name: "Kzyube Napoles", role: "CEO / Main Presenter", section: "The product", initials: "KN", question: "How can one map help a whole campus?" },
  { name: "Hance Subaldo", role: "Product Manager", section: "Graph models", initials: "HS", question: "How does a campus map become a graph?" },
  { name: "Lowell Ronamo", role: "Algorithm Engineer", section: "Breadth-first search", initials: "LR", question: "Which buildings are one walkway away?" },
  { name: "Hilary Cañas", role: "Systems Engineer", section: "Depth-first search", initials: "HC", question: "What happens when we follow one branch?" },
  { name: "Princess Man Oyao", role: "Network Analyst", section: "Connectivity", initials: "PO", question: "Can we still reach every building?" },
  { name: "Gary Dapilaga", role: "Demo Specialist", section: "Shortest paths", initials: "GD", question: "Which route has the lowest total distance?" },
  { name: "Ram Alferez", role: "Data Analyst", section: "Spanning trees", initials: "RA", question: "How can we connect every building for less?" },
  { name: "Jinson Oplimo", role: "Technical Director", section: "Kruskal & closing", initials: "JO", question: "Which links should we add first?" },
] as const;

export type Layout = "cover" | "problem" | "solution" | "terms" | "storage" | "breadth" | "bfs" | "dfs" | "question" |
  "compare" | "connection" | "components" | "challenge" | "relax" | "dijkstra" | "tree" | "mst" | "union" | "kruskal" | "tech" | "close";
type Notes = [opening: string, explanation: string, technical: string, example: string, transition: string];
type Slide = {
  title: string;
  headline?: string;
  presenter: number;
  seconds: number;
  layout: Layout;
  lead: string;
  takeaway?: string;
  guide: string;
  cue: string;
  notes: Notes;
  sourceIndex?: number;
};

export const originalSlides: Slide[] = [
  {
    title: "Introducing CampusNav", headline: "CampusNav", presenter: 0, seconds: 60, layout: "cover",
    lead: "One campus map for finding walking routes and planning connections between buildings.",
    guide: "Introduce CampusNav as both a campus navigation tool and an infrastructure planning concept.",
    cue: "Point out buildings A and F on the model. Ask for a show of hands from anyone who has taken a wrong turn on campus.",
    notes: [
      "Think about the first time you had to find a room on campus. A map told you where it was. How did you decide which way to walk?",
      "CampusNav is our proposal for answering that question and a second one that facilities teams face. We’ll use this model to work through both.",
      "The map has six buildings and ten bidirectional walkways. The weights we use today are illustrative units.",
      "Select Administration on the model. It’s building A, and it will be our starting point in several demonstrations.",
      "Let’s start with the two decisions a campus needs to make.",
    ],
  },
  {
    title: "The Campus Connectivity Problem", headline: "Two decisions. One campus.", presenter: 0, seconds: 60, layout: "problem",
    lead: "A student needs a route between two buildings. A facilities team needs a network that reaches every building.",
    takeaway: "Walking distance and total installation cost measure different things.",
    guide: "Separate the shortest walking route from the cheapest network that reaches every building.",
    cue: "Point left for the student’s A-to-F trip and right for the facilities team’s six-building network. Ask what each team adds up.",
    notes: [
      "Suppose I’m at Administration and need to get to the Student Center. What would make one route better than another?",
      "Now switch jobs. You’re laying conduit between buildings. Your objective is to reach every building while keeping the full installation cost low.",
      "Routing minimizes the sum on one path. Infrastructure planning minimizes the sum of all selected links.",
      "The direct connections available to both people are the same ten links on our campus. Their goals determine which algorithm we use.",
      "CampusNav gives us one model for both decisions.",
    ],
  },
  {
    title: "Meet CampusNav", presenter: 0, seconds: 60, layout: "solution",
    lead: "Each building gets a dot. Each walkway gets a line and a number.",
    takeaway: "The same graph supports routing, reachability, and infrastructure planning.",
    guide: "Show how a physical campus becomes a graph that algorithms can work with.",
    cue: "Turn on Graph overlay. Let the camera tilt and the walkways draw in, then select Library and count its four connections.",
    notes: [
      "Here’s how CampusNav turns a campus map into something a computer can work with.",
      "Switch on the graph overlay. The buildings and paths are still there, and now you can see the data the algorithms read.",
      "Every edge links two vertices. For walking, a weight is a distance. In the infrastructure exercise we interpret those same numbers as costs.",
      "Select Library. Four adjacent connections link it to Administration, Science, Engineering, and Student Center.",
      "Hance will give those parts their proper names and show how we store them.",
    ],
  },
  {
    title: "Understanding Graph Terminology", headline: "The parts of a graph", presenter: 1, seconds: 120, layout: "terms",
    lead: "A graph describes which objects are directly connected.",
    takeaway: "The campus graph is undirected, weighted, and connected.",
    guide: "Name the parts of a weighted, undirected graph and recognize paths and cycles.",
    cue: "Scroll the lesson panel through Vertex, Edge and Weight. Choose step 6 for Cycle and trace A → B → C → A.",
    notes: [
      "Let’s read the campus map as a graph and name the pieces as we go.",
      "A building is a vertex. A walkway is an edge. A weight is the number on an edge. An unweighted model treats each edge as one step. Our walkways work in either direction, so the edges are undirected.",
      "Degree counts incident edges. A simple path has no repeated vertices. A cycle returns to its start with no other repeats. A directed graph would let us model a one-way walkway.",
      "Choose Degree to count B’s four incident edges. Then select Cycle and follow A–B–C–A around the triangle.",
      "Now we can look at two ways to put these same relationships into memory.",
    ],
  },
  {
    title: "How Computers Represent Graphs", headline: "Matrix or adjacency list?", presenter: 1, seconds: 120, layout: "storage",
    lead: "Here are two ways to store the same ten two-way walkways.",
    takeaway: "A matrix gives direct lookup. A list stores only existing neighbors.",
    guide: "Compare the memory and lookup trade-offs of adjacency matrices and lists.",
    cue: "Highlight row B in both views. Read the weight to C aloud, then point to a dash to show an absent edge.",
    notes: [
      "How would the computer answer whether the Library and Science Building share a walkway?",
      "In the matrix, find row B and column C. In the list, look through B’s neighbors. The weight is 1 in either representation.",
      "The matrix takes O(V²) space and has O(1) cell lookup. The list takes O(V + E) space and stores an entry at both endpoints of each undirected edge. Dashes in the matrix represent absent edges.",
      "This campus uses 36 matrix cells or 20 neighbor entries plus six list headers. CampusNav traverses the adjacency list.",
      "Lowell will use those neighbor lists to show breadth-first search.",
    ],
  },
  {
    title: "Breadth-First Search (BFS)", presenter: 2, seconds: 60, layout: "breadth",
    lead: "Start at one building. Visit the buildings one walkway away, then two, and so on.",
    takeaway: "BFS minimizes edge count when every edge counts as one step.",
    guide: "Explain why a FIFO queue visits buildings in layers by number of walkways.",
    cue: "Scroll from Start at A to One walkway away. Ask which layer F belongs to, then reveal Two walkways away.",
    notes: [
      "Imagine checking which buildings you can reach in one walkway, then in two, then in three.",
      "Put A in a queue. Take the front item, mark and enqueue each undiscovered neighbor, and repeat.",
      "A queue is first in, first out, or FIFO. Mark each vertex when it enters the queue to keep it from being added twice.",
      "B and C are one edge from A. D, E, and F are two edges away. The numbers written on the walkways play no part in BFS.",
      "Now let’s see the order within each layer.",
    ],
  },
  {
    title: "BFS in Action", presenter: 2, seconds: 120, layout: "bfs",
    lead: "Start at A. Read each neighbor list in alphabetical order.",
    takeaway: "Queue order fixes the order within each layer.",
    guide: "Trace how the BFS queue and alphabetical neighbor order produce the visit order.",
    cue: "Step through processing B. Pause with C still at the front and ask why F enters the queue before E.",
    notes: [
      "Watch the front of the queue as we run BFS from A.",
      "Step until B and C are both queued. Process B first. It discovers D and F, which join the queue behind C. Then C discovers E.",
      "The discovery tree stores a minimum-edge route from A to every reachable vertex. The order can vary within a level when the neighbor order changes.",
      "The visit order is A, B, C, D, F, E. Ask the class why F comes before E even though E comes first alphabetically.",
      "Hilary will swap the queue for a stack and show where the order changes.",
    ],
  },
  {
    title: "Depth-First Search (DFS)", presenter: 3, seconds: 120, layout: "dfs",
    lead: "Follow one branch until you run out of new buildings. Then go back and try another.",
    takeaway: "The stack keeps track of where to go back.",
    guide: "Show how DFS uses a stack to explore a branch and then return.",
    cue: "Step to F, then advance once. Point out that F stays visited when its call leaves the stack.",
    notes: [
      "BFS spreads out. This time, let’s follow one branch until we run out of new buildings.",
      "Each visit pushes a call onto the stack. When the current building has no unvisited neighbors, return to the previous call.",
      "A stack is last in, first out, or LIFO. Recursion uses the call stack. An explicit stack can implement the same search.",
      "Step from A through B, C, D, E, and F. At F, show the return to E. The visited set stays marked even when calls come off the stack.",
      "Let’s compare what these two traversals give us and what they cost.",
    ],
  },
  {
    title: "BFS versus DFS and Traversal Complexity", headline: "BFS vs. DFS", presenter: 3, seconds: 60, layout: "compare",
    lead: "BFS uses a queue. DFS uses a stack. How you store the graph affects how much each search checks.",
    takeaway: "Use BFS for fewest hops. Use either traversal to test reachability.",
    guide: "Compare BFS and DFS and explain how graph storage affects their running time.",
    cue: "Read the two visit orders first. Then trace across the matrix row and explain why both algorithms inspect V cells per vertex.",
    notes: [
      "How much work does each traversal do when we start at A?",
      "Both process each reachable vertex and inspect its neighbors. Their worklists give them different exploration orders.",
      "Over the whole graph, adjacency lists take O(V + E) because each vertex and incident edge is processed a constant number of times. A matrix scans V columns per vertex, for O(V²).",
      "Both traversals reach all six buildings. BFS finds A → B → F in two hops for 16 distance units. Later, Dijkstra will show a five-hop route to F that costs 13 units.",
      "Princess will use reachability to study the whole campus network.",
    ],
  },
  {
    title: "Graph Connectivity", presenter: 4, seconds: 90, layout: "connection",
    lead: "The campus is connected if you can walk from any building to any other.",
    takeaway: "A walkway closure disconnects the campus only if no alternate path remains.",
    guide: "Show that closing a walkway disconnects the campus only when alternate routes run out.",
    cue: "Close B–F, then D–F, then E–F. Follow each mint detour to F. On the final closure, point to the Isolated label.",
    notes: [
      "If we close the direct Library-to-Student-Center walkway, does the Student Center become unreachable?",
      "Try the closure toggles. The graph is still connected after B–F closes. F can also be reached through D or E.",
      "One edge can disconnect a graph if it is a bridge. On our campus, isolating F requires removing all three of its incident edges.",
      "Close B–F, D–F, and E–F in turn. The main campus stays connected, and F becomes a component by itself.",
      "Now let’s see how a computer can find those groups after a closure.",
    ],
  },
  {
    title: "Understanding Connected Components", headline: "Connected components", presenter: 4, seconds: 90, layout: "components",
    lead: "Buildings in the same group can reach one another. There’s no route between separate groups.",
    takeaway: "Start a fresh BFS or DFS wherever a building remains unvisited.",
    guide: "Use repeated searches to identify connected components after closures.",
    cue: "Step through the search from A and pause before F starts its own component. Ask which building remains unvisited.",
    notes: [
      "After those three closures, can you name both connected components?",
      "Start BFS at A and mark everything it reaches. Scan the vertex list again. Every unvisited vertex starts another search.",
      "Keep one visited set for the entire process. This assigns each vertex to exactly one component and takes O(V + E) with an adjacency list.",
      "A reaches A, B, C, D, and E. The next unvisited vertex is F, so BFS from F identifies the one-building component. Facilities can use this to flag access or utility outages.",
      "Gary is going to hand the campus map over to everyone’s phones.",
    ],
  },
  {
    title: "The CampusNav Challenge", presenter: 5, seconds: 120, layout: "challenge",
    lead: "Find the shortest route from Administration (A) to Student Center (F).",
    takeaway: "Add the walkway weights along your route before submitting.",
    guide: "Get classmates onto the hotspot and start the first competitive shortest-route game.",
    cue: "Let the phone walkthrough loop while students scan the QR code. Open Presenter Controls and confirm Game 1 is loaded. Wait for the online count to rise, then start the round.",
    notes: [
      "Connect to our classroom hotspot, scan the code or type the address, and enter a nickname.",
      "In Presenter Controls, start the two-minute round once people are connected. Game 1 sets A and F for everyone.",
      "A submission must follow real walkways. The server checks each connection and compares the sum with the shortest distance for the current game’s endpoints.",
      "Point to the numbers along the edges. Students can try different paths on their phones before sending one.",
      "Keep the answer hidden while we introduce the method for finding it.",
    ],
  },
  {
    title: "Dijkstra’s Shortest-Path Algorithm", headline: "Dijkstra’s algorithm", presenter: 5, seconds: 90, layout: "relax",
    lead: "Pick the building with the smallest distance so far. Check whether going through it shortens another route.",
    takeaway: "Dijkstra needs non-negative edge weights.",
    guide: "Teach relaxation by replacing a tentative distance with a better one.",
    cue: "Show the direct A–B estimate of 4, then press Relax C–B. Follow the two highlighted walkways and read 2 plus 1 equals 3. Point to “via C.”",
    notes: [
      "Which route is shorter if the direct walkway is longer than a two-edge detour?",
      "Start at zero for A and infinity everywhere else. Select the unsettled vertex with the smallest tentative distance and make it final. Then try to improve its neighbors.",
      "Relaxing u–v means checking whether dist[u] plus the edge weight is less than dist[v]. If it is, replace the distance and remember u as the predecessor.",
      "A gives B a first estimate of 4 and C an estimate of 2. Settling C next improves B to 2 + 1 = 3.",
      "Watch how that first update changes the route to Student Center.",
    ],
  },
  {
    title: "Dijkstra’s Algorithm in Action", headline: "The shortest route to F", presenter: 5, seconds: 150, layout: "dijkstra",
    lead: "Watch the distances change. To find the route, start at F and follow each “via” entry backward.",
    takeaway: "Each “via” entry points to the previous building on the route.",
    guide: "Trace Dijkstra’s distance updates and reveal the Game 1 result.",
    cue: "Pause when B improves to 3. Jump to the final step, then reveal in Presenter Controls and read the winner from Game 1.",
    notes: [
      "Before we reveal the answer, let’s follow a few updates in the trace.",
      "Advance through the improvement of B via C. Later, D offers F a distance of 14, then E improves it to 13. Use the final-step control to display the whole route.",
      "Distances from A are A 0, B 3, C 2, D 8, E 10, F 13. Selecting the next vertex by scanning costs O(V²). A binary-heap priority queue commonly gives O((V + E) log V).",
      "The route is A → C → B → D → E → F. Reveal in Presenter Controls so phones receive their results. Class submissions on A–F appear in the ranked table.",
      "Ram will show how the objective changes when we need to link every building.",
    ],
  },
  {
    title: "Minimum Spanning Tree (MST)", headline: "Minimum spanning tree", presenter: 6, seconds: 90, layout: "tree",
    lead: "Connect every building for the lowest total cost, without creating a loop.",
    takeaway: "A spanning tree reaches every building. The cheapest one is the minimum spanning tree.",
    guide: "Define a minimum spanning tree and connect it to the conduit planning problem.",
    cue: "Show the ten possible links, then scroll to Reach all six buildings. Count the five highlighted links. Scroll again to show the total cost.",
    notes: [
      "Suppose we’re installing conduit. The finished network has to reach all six buildings.",
      "A spanning tree uses enough links to keep every building connected. An MST is the spanning tree with the smallest total weight.",
      "A tree is connected and acyclic. Any extra edge closes a cycle. Removing any tree edge disconnects the tree. A disconnected graph has no spanning tree over all vertices.",
      "Use the diagram to compare the ten candidate walkways with the five selected conduit links.",
      "Let’s count the links and total their cost.",
    ],
  },
  {
    title: "Understanding the Minimum Spanning Tree", headline: "Six buildings. Five links.", presenter: 6, seconds: 90, layout: "mst",
    lead: "A tree on V vertices has V − 1 edges.",
    takeaway: "An MST minimizes the cost of the network. Dijkstra minimizes distance from a source.",
    guide: "Explain why a six-building spanning tree uses five links and what the total cost measures.",
    cue: "Add the selected weights aloud. Point to B–D and ask which groups would separate if that link were removed.",
    notes: [
      "Here is the proposed conduit network. See if you can spot any loop.",
      "There’s exactly one simple path between any two buildings in this tree. Count five links for six buildings.",
      "B–C, A–C, D–E, E–F, and B–D cost 1 + 2 + 2 + 3 + 5 = 13. On this dataset the A-to-F shortest path happens to use the same edges. That equality is a feature of these weights.",
      "Point to B–D. Cutting it splits the selected network into two groups. A real plan might pay more for redundancy.",
      "Jinson will show how Kruskal chooses those five links.",
    ],
  },
  {
    title: "Kruskal’s Algorithm", presenter: 7, seconds: 75, layout: "union",
    lead: "Start with the cheapest link. Add it only if it joins two separate groups.",
    takeaway: "Union-Find answers whether a link would close a cycle.",
    guide: "Show how Union-Find helps Kruskal accept links and reject cycles.",
    cue: "Use Merge with A–C and ask if A and B now share a representative. Connect their answer to the cycle check.",
    notes: [
      "Kruskal starts with one component for each building and considers the cheapest links first.",
      "Disjoint Set Union, or Union-Find, gives each group a representative. Find tells us which group a building is in. Union merges two groups.",
      "Equal representatives mean an existing path already joins the endpoints. Adding that edge would create a cycle. Path compression and union by rank make repeated checks efficient.",
      "After B–C and A–C are accepted, A and B already share a component. Even at cost 4, A–B has to wait for the cycle check.",
      "Let’s run the sorted list and watch the rejection happen.",
    ],
  },
  {
    title: "Kruskal’s Algorithm in Action", headline: "Building the spanning tree", presenter: 7, seconds: 105, layout: "kruskal",
    lead: "Watch which links get picked and why A–B gets skipped.",
    takeaway: "Stop after V − 1 accepted edges in a connected graph.",
    guide: "Run Kruskal through sorted edges, a cycle rejection, and the final tree.",
    cue: "Advance to Reject A–B and trace the highlighted loop. Then advance to Accept B–D and watch the total change to 13.",
    notes: [
      "Start with the sorted list on the right. Which link gets considered first?",
      "Accept B–C, A–C, D–E, and E–F. Pause on A–B. Both endpoints are already in the A–B–C component, so mark it rejected.",
      "B–D is the next edge considered. It joins the two remaining components. That is the fifth accepted link. Sorting dominates this implementation’s running time at O(E log E).",
      "Add the weights aloud. One plus two plus two plus three plus five gives 13 cost units.",
      "We’ve used the campus graph to answer several questions. Here’s how those pieces fit into the product.",
    ],
  },
  {
    title: "CampusNav Value Proposition and Technology", headline: "What CampusNav makes possible", presenter: 7, seconds: 60, layout: "tech",
    lead: "One map helps us find a route, check what’s still reachable, and plan new connections.",
    takeaway: "One map. A different question for each algorithm.",
    guide: "Tie the algorithms back to three practical CampusNav features.",
    cue: "Point to the one graph on the left. Read each output on the right with a question a student or facilities team might ask.",
    notes: [
      "The algorithms we just used correspond to distinct features a campus can use.",
      "Students can compare routes. Campus teams can model reachability after closures and estimate the minimum cost of connecting buildings.",
      "The deck, 3D map, and live route validator read the same graph data. The laptop serves the interface and syncs the classroom activity over the local network.",
      "If a link is closed, connectivity tells us who loses access. If a walkway weight changes, Dijkstra can compute a new best route.",
      "Let’s close with the practical reason we built this.",
    ],
  },
  {
    title: "Final Pitch", headline: "Connecting Places. Finding Better Paths.", presenter: 7, seconds: 60, layout: "close",
    lead: "CampusNav helps people find their way and campus teams plan the connections everyone depends on.",
    guide: "Recap what the graph made possible and open the floor for questions.",
    cue: "Let the student reach the Student Center, then point to the names below the eight portraits. Ask the audience what real campus detail they would add to the map.",
    notes: [
      "We began with a student trying to get across campus and a team trying to connect it.",
      "BFS and DFS showed how to explore. Connectivity showed what closures can isolate. Dijkstra found a route. Kruskal chose a network.",
      "Each answer came from the same six vertices and ten edges. We changed the question and selected an algorithm suited to it.",
      "For a real campus pilot, we would start by mapping walkways and checking their distance, accessibility, and closure data with the campus team.",
      "Thank you for taking part. What would you add to the map before using it on a real campus? We’d love to hear your questions.",
    ],
  },
];

// Insert one discussion slide at the end of each presenter's section.
export const slides: Slide[] = originalSlides.flatMap((slide, index) => {
  const original = { ...slide, sourceIndex: index };
  if (originalSlides[index + 1]?.presenter === slide.presenter) return [original];
  const { questions, answers } = questionSets[slide.presenter];
  const person = presenters[slide.presenter];
  return [original, {
    title: `${person.section}: class questions`, headline: "Let’s check in", presenter: slide.presenter,
    seconds: 60, layout: "question" as const,
    lead: `Two questions about ${person.section.toLowerCase()}.`,
    takeaway: "Select a group, then select a student. Give them a moment to think.",
    guide: `Check the class’s understanding of ${person.section.toLowerCase()} with two questions.`,
    cue: "Select Group, then Select Student. Read question 1 aloud. Repeat the draw for question 2 if you want another respondent.",
    notes: [
      `“Let’s check what we learned about ${person.section.toLowerCase()}. I’ll choose a group first, then a student.”`,
      `Ask question 1: “${questions[0]}” Allow time to answer. Expected answer: ${answers[0]}`,
      `Ask question 2: “${questions[1]}” You may select another group and student. Expected answer: ${answers[1]}`,
      "Thank the student for answering. If needed, use the expected answer to clarify the point in simple terms.",
      slide.presenter < presenters.length - 1 ? `“Thank you. Let’s continue with ${presenters[slide.presenter + 1].name}.”` : "“Thank you for joining our discussion.”",
    ],
  }];
});

export const slideNumber = (index: number) => String(index + 1).padStart(2, "0");
export function duration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
