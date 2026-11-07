// Classroom roster supplied by the presenters. Group 2 is the presenting team.
export const questionGroups = [
  { number: 1, students: ["TORRES, Russell Karl, Yap", "LASONA, Steven Joseph, Della", "SUCOL, Omair Ahmed, Isla", "TONGCUA, KATE XYLENE, Amante", "CACCAM, CRAESARIANNE LAIGNE, Orcullo", "STA. ROMANA, Mark Andrey, Lebaquin", "GOMEZ, Catherine, Esmalde", "PACULIO, Jezeny, Sasi", "UMBAY, Josef Adrian"] },
  { number: 3, students: ["AYAG, Carl James, Magbanua", "SASI, Lenard, Condino", "EVASCO, Shella Mae, Enonog", "ALIPIS, Irish James, Fernandez", "VILLAR, John Paul, Largo", "TIGLAO, Edgardo Yusop, Iii. Mantawil", "FERNANDO, Rhomer Kyr, Sudario", "MARTINEZ, Jireh"] },
  { number: 4, students: ["BANAAG, Ahmad, Namion", "ABANG, Faith Justmine, Castro", "PAMA, Charles Julian", "DAGADAS, Mazin, Sampulna", "CORNELIO, Kobe Julius", "DURON, Vivien Pearl, Delos Santos", "LARA, Renz Angelo, Tillan", "PROVIDA, James Andrie, Campos"] },
  { number: 5, students: ["SUMANGUE, Shera Jane, Perales", "VILORIA, Erl Emard, Ejanel", "KALUGAY, John Mark, Ramos", "ABSIN, Fay Andrea Jane, Celestial", "LAROTIN, Jerry, Jr. Cuerpo", "GEBERO, Precious Hannah, Gajopo", "MAÑARA, Princess Regine", "BENANING, Josh Reedjie, Rico"] },
] as const;

type QuestionSet = { questions: [string, string]; tagalogQuestions: [string, string]; answers: [string, string]; tagalogAnswers: [string, string] };
export const questionSets: QuestionSet[] = [
  {
    questions: ["How is finding one walking route different from connecting every building?", "In the CampusNav graph, what do the buildings, walkways, and numbers represent?"],
    tagalogQuestions: ["Paano naiiba ang paghahanap ng isang ruta sa pagkonekta sa lahat ng gusali?", "Sa CampusNav graph, ano ang kinakatawan ng mga gusali, daanan, at numero?"],
    answers: ["A walking route minimizes distance along one path; a network connects all buildings while minimizing the total cost of its chosen links.", "Buildings are vertices, walkways are edges, and numbers are weights: distance for walking or cost for infrastructure."],
    tagalogAnswers: ["Sa ruta, distansya ng isang daan ang pinapaliit. Sa network, kailangang konektado ang lahat ng gusali at mababa ang kabuuang gastos ng mga napiling koneksyon.", "Ang mga gusali ay vertices, ang mga daanan ay edges, at ang mga numero ay weights: distansya sa paglalakad o gastos sa paglalagay ng koneksyon."],
  },
  {
    questions: ["Building B has four walkways. What is its degree, and why?", "How would you find the B–C connection in a matrix and in an adjacency list?"],
    tagalogQuestions: ["May apat na daanan ang building B. Ano ang degree nito at bakit?", "Paano mo hahanapin ang koneksyon ng B at C sa matrix at sa adjacency list?"],
    answers: ["Its degree is 4 because four edges meet at B.", "In the matrix, check row B and column C; in the list, find C among B’s neighbors. Both show weight 1."],
    tagalogAnswers: ["Apat ang degree ng B dahil apat na edge ang nakakabit dito.", "Sa matrix, tingnan ang row B at column C. Sa list, hanapin ang C sa mga kapitbahay ng B. Parehong may weight na 1."],
  },
  {
    questions: ["Why does BFS visit nearby buildings in layers?", "Starting at A, why is F visited before E in our BFS example?"],
    tagalogQuestions: ["Bakit binibisita ng BFS ang mga kalapit na gusali nang patong-patong o by layer?", "Simula sa A, bakit nauunang bisitahin ang F bago ang E sa ating BFS example?"],
    answers: ["BFS uses a first-in, first-out queue, so buildings discovered earlier are processed before buildings in the next layer.", "B is processed before C and discovers F. C discovers E later, so F is already ahead of E in the queue."],
    tagalogAnswers: ["Gumagamit ang BFS ng first-in, first-out na queue, kaya nauuna ang mga gusaling mas naunang natuklasan bago ang susunod na layer.", "Nauna ang B sa C at natuklasan nito ang F. Pagkatapos ay natuklasan ng C ang E, kaya mas nauuna ang F sa queue."],
  },
  {
    questions: ["What does DFS do when it reaches a building with no unvisited neighbors?", "Which search finds a route with the fewest walkways, and what does it use to keep its order?"],
    tagalogQuestions: ["Ano ang ginagawa ng DFS kapag wala nang hindi pa nabisitang kapitbahay ang isang gusali?", "Aling search ang nakakahanap ng rutang may pinakamakaunting daanan, at ano ang ginagamit nito para mapanatili ang pagkakasunod-sunod?"],
    answers: ["It backtracks to the previous building and looks for another unvisited neighbor; the stack records where to return.", "BFS finds a route with the fewest edges and uses a first-in, first-out queue."],
    tagalogAnswers: ["Bumabalik ito sa naunang gusali at naghahanap ng ibang hindi pa napuntahang kapitbahay. Ang stack ang nagtatala kung saan babalik.", "BFS ang nakakahanap ng rutang may pinakamakaunting edge at gumagamit ito ng first-in, first-out na queue."],
  },
  {
    questions: ["If B–F closes, is F automatically unreachable? Why?", "After B–F, D–F, and E–F close, what are the two connected components?"],
    tagalogQuestions: ["Kapag isinara ang B–F, agad bang hindi maaabot ang F? Bakit?", "Kapag isinara ang B–F, D–F, at E–F, ano ang dalawang connected component?"],
    answers: ["No. F can still be reached through D or E as long as those connections remain open.", "One component contains A, B, C, D, and E; the other contains only F."],
    tagalogAnswers: ["Hindi. Maaabot pa rin ang F sa pamamagitan ng D o E habang bukas ang mga koneksyong iyon.", "Ang isang component ay A, B, C, D, at E; ang isa naman ay F lamang."],
  },
  {
    questions: ["Why does Dijkstra change B’s estimated distance from 4 to 3?", "What is the shortest A-to-F route in our example, and what is its total weight?"],
    tagalogQuestions: ["Bakit binabago ng Dijkstra ang tinatayang distansya ng B mula 4 tungong 3?", "Ano ang pinakamaikling ruta mula A hanggang F sa ating halimbawa, at magkano ang kabuuang weight nito?"],
    answers: ["The route through C costs 2 + 1 = 3, which is less than the direct A–B cost of 4.", "A → C → B → D → E → F, with a total weight of 13."],
    tagalogAnswers: ["Ang ruta sa C ay may halagang 2 + 1 = 3, na mas mababa kaysa direktang A–B na 4.", "A → C → B → D → E → F, na may kabuuang weight na 13."],
  },
  {
    questions: ["How many links does a spanning tree need for six buildings? Why?", "How is the goal of an MST different from finding the shortest A-to-F route?"],
    tagalogQuestions: ["Ilang koneksyon ang kailangan ng spanning tree para sa anim na gusali? Bakit?", "Paano naiiba ang layunin ng MST sa paghahanap ng pinakamaikling ruta mula A hanggang F?"],
    answers: ["Five links. A tree with V vertices has V − 1 edges, connects every vertex, and has no cycle.", "An MST minimizes the total cost of connecting all buildings; a shortest path minimizes the distance between chosen endpoints."],
    tagalogAnswers: ["Limang koneksyon. Ang tree na may V vertices ay may V − 1 edges, konektado ang lahat, at walang cycle.", "Pinapaliit ng MST ang kabuuang gastos ng network para sa lahat ng gusali; ang shortest path ay distansya sa pagitan ng napiling simula at destinasyon."],
  },
  {
    questions: ["Why does Kruskal skip A–B after accepting B–C and A–C?", "What does B–D do in the final tree, and what is the total cost?"],
    tagalogQuestions: ["Bakit nilalaktawan ng Kruskal ang A–B matapos piliin ang B–C at A–C?", "Ano ang ginagawa ng B–D sa huling tree, at magkano ang kabuuang gastos?"],
    answers: ["A and B are already connected through C, so adding A–B would create a cycle.", "B–D joins the two remaining components; the five selected links cost 13 units in total."],
    tagalogAnswers: ["Konektado na ang A at B sa pamamagitan ng C, kaya magkakaroon ng cycle kapag idinagdag ang A–B.", "Pinagdurugtong ng B–D ang dalawang natitirang component; 13 units ang kabuuang gastos ng limang napiling koneksyon."],
  },
];
