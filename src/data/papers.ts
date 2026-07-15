import type { Paper } from '../types';
import { localDiagramImage } from './assets';

/**
 * Mock papers — this is the structured-JSON format the extraction
 * pipeline will produce. The PaperReader renders straight from this,
 * so swapping in real papers is just replacing this array (or the
 * fetch that supplies it).
 *
 * Question `text` is markdown + inline LaTeX ($...$), rendered by
 * <MathRichText/>. Diagrams are cropped images served by URL.
 */
export const papers: Paper[] = [
  {
    id: 'cec420-2023',
    courseCode: 'CEC420',
    title: 'Data Mining',
    year: 2023,
    session: 'First Semester Examination',
    semester: 'Semester 1',
    faculty: 'Engineering',
    department: 'Computer Engineering',
    level: 'L400',
    duration: '3 hours',
    totalMarks: 70,
    instructions:
      'Answer **ALL** multiple-choice questions in Section A and any **TWO** long questions from Section B. All symbols have their usual meanings. A non-programmable calculator is allowed.',
    questions: [
      {
        id: 'mcq1',
        number: 'A1',
        text: 'Which quantity does the **ID3** decision-tree algorithm maximise when it chooses an attribute to split on?',
        marks: 2,
        topics: ['information-gain', 'decision-trees'],
        difficulty: 'easy',
        diagrams: [],
        subQuestions: [],
        options: [
          { label: 'Information gain', correct: true },
          { label: 'Gini impurity', correct: false },
          { label: 'Euclidean distance', correct: false },
          { label: 'Support count', correct: false },
        ],
        answers: {
          verified:
            'ID3 picks the attribute with the **highest information gain** — the largest expected reduction in entropy. (Gini impurity is what CART uses; the others are unrelated.)',
        },
      },
      {
        id: 'mcq2',
        number: 'A2',
        text: 'In the **Apriori** algorithm, the rule that *every subset of a frequent itemset must itself be frequent* is known as the:',
        marks: 2,
        topics: ['apriori', 'association-rules'],
        difficulty: 'medium',
        diagrams: [],
        subQuestions: [],
        options: [
          { label: 'Apriori (anti-monotone) property', correct: true },
          { label: 'Confidence threshold', correct: false },
          { label: 'Lift ratio', correct: false },
          { label: 'Bayes rule', correct: false },
        ],
        answers: {
          verified:
            'This is the **Apriori property** (downward closure / anti-monotonicity): if an itemset is frequent, all its subsets are too — so if any subset is infrequent, the itemset can be pruned without counting it.',
        },
      },
      {
        id: 'mcq3',
        number: 'A3',
        text: 'The standard **k-means** clustering algorithm iteratively minimises which objective?',
        marks: 2,
        topics: ['clustering', 'k-means'],
        difficulty: 'medium',
        diagrams: [],
        subQuestions: [],
        options: [
          { label: 'Within-cluster sum of squared distances', correct: true },
          { label: 'Total information gain', correct: false },
          { label: 'Between-class entropy', correct: false },
          { label: 'Overall support count', correct: false },
        ],
        answers: {
          verified:
            'k-means minimises the **within-cluster sum of squares (WCSS)** — the total squared distance of points to their assigned centroid — alternating the assignment and centroid-update steps until it converges.',
        },
      },
      {
        id: 'q1',
        number: '1',
        text: 'Define **entropy** as used in decision-tree learning, and state the formula $H(S) = -\\sum_{i} p_i \\log_2 p_i$. Explain what a value of $H(S) = 0$ tells you about the training set $S$.',
        marks: 6,
        topics: ['entropy', 'decision-trees'],
        difficulty: 'easy',
        diagrams: [],
        subQuestions: [],
        answers: {
          verified:
            'Entropy measures the **impurity** (uncertainty) of a set of labelled examples. For a set $S$ with classes appearing in proportions $p_i$: $H(S) = -\\sum_i p_i \\log_2 p_i$. If $H(S) = 0$, one $p_i = 1$ and the rest are 0 — the set is **pure**: every example in $S$ belongs to the same class, so no further splitting is needed at that node.',
          aiGeneral:
            'Entropy quantifies how mixed the class labels in $S$ are. It is maximal when classes are evenly split and zero when the set is pure (all one class), meaning a leaf can be created.',
          references: [{ source: 'notes', label: 'Your notes, p.12 — "Entropy & impurity"', location: 'notes://cec420/p12' }],
        },
      },
      {
        id: 'q2',
        number: '2',
        text: 'A weather dataset has 14 training examples: 9 labelled *Play* and 5 labelled *NoPlay*.',
        marks: 14,
        topics: ['information-gain', 'entropy', 'decision-trees'],
        difficulty: 'medium',
        diagrams: [],
        subQuestions: [
          {
            id: 'q2a',
            number: '2a',
            text: 'Compute the entropy of the full dataset, $H(S)$. Show your working to 3 decimal places.',
            marks: 4,
            topics: ['entropy'],
            difficulty: 'easy',
            diagrams: [],
            subQuestions: [],
            answers: {
              verified:
                '$H(S) = -\\frac{9}{14}\\log_2\\frac{9}{14} - \\frac{5}{14}\\log_2\\frac{5}{14}$\n\n$= -(0.643)(-0.637) - (0.357)(-1.485)$\n\n$= 0.410 + 0.530 = 0.940$ bits.',
              references: [{ source: 'notes', label: 'Your notes, p.14 — worked entropy example', location: 'notes://cec420/p14' }],
            },
          },
          {
            id: 'q2b',
            number: '2b',
            text: 'The attribute *Wind* splits $S$ into *Weak* (8 examples: 6 Play, 2 NoPlay) and *Strong* (6 examples: 3 Play, 3 NoPlay).',
            marks: 10,
            topics: ['information-gain'],
            difficulty: 'medium',
            diagrams: [],
            subQuestions: [
              {
                id: 'q2bi',
                number: '2(b)(i)',
                text: 'Compute the **information gain** $IG(S, Wind) = H(S) - \\sum_v \\frac{|S_v|}{|S|} H(S_v)$.',
                marks: 6,
                topics: ['information-gain'],
                difficulty: 'medium',
                diagrams: [],
                subQuestions: [],
                answers: {
                  aiGeneral:
                    '$H(Weak) = -\\frac{6}{8}\\log_2\\frac{6}{8} - \\frac{2}{8}\\log_2\\frac{2}{8} = 0.811$. $H(Strong) = 1.0$ (even split). Weighted: $\\frac{8}{14}(0.811) + \\frac{6}{14}(1.0) = 0.892$. So $IG = 0.940 - 0.892 = 0.048$ bits.',
                },
              },
              {
                id: 'q2bii',
                number: '2(b)(ii)',
                text: 'Given $IG(S, Humidity) = 0.151$, which attribute should the ID3 algorithm split on first? Justify in one sentence.',
                marks: 4,
                topics: ['information-gain', 'decision-trees'],
                difficulty: 'easy',
                diagrams: [],
                subQuestions: [],
                answers: {
                  verified:
                    '*Humidity* — ID3 greedily chooses the attribute with the **highest information gain**, and $0.151 > 0.048$.',
                },
              },
            ],
            answers: {},
          },
        ],
        answers: {},
      },
      {
        id: 'q3',
        number: '3',
        text: 'The figure below shows a dendrogram produced by **agglomerative hierarchical clustering** on six data points using single linkage.',
        marks: 12,
        topics: ['clustering', 'hierarchical-clustering'],
        difficulty: 'medium',
        diagrams: [
          {
            id: 'd1',
            imageUrl: localDiagramImage,
            caption: 'Fig. 1 — Dendrogram for points A–F (single linkage).',
            bbox: [42, 118, 560, 402],
          },
        ],
        subQuestions: [
          {
            id: 'q3a',
            number: '3a',
            text: 'If the dendrogram is cut at height $h = 2.5$, how many clusters result? List the members of each cluster.',
            marks: 6,
            topics: ['clustering', 'hierarchical-clustering'],
            difficulty: 'medium',
            diagrams: [],
            subQuestions: [],
            answers: {
              aiGeneral:
                'Cutting at $h = 2.5$ intersects three vertical branches → **3 clusters**: $\\{A, B\\}$, $\\{C, D, E\\}$ and $\\{F\\}$ (reading merge heights from Fig. 1).',
            },
          },
          {
            id: 'q3b',
            number: '3b',
            text: 'State **two** differences between single linkage and complete linkage, and one weakness of single linkage.',
            marks: 6,
            topics: ['clustering'],
            difficulty: 'medium',
            diagrams: [],
            subQuestions: [],
            answers: {
              verified:
                '**Single linkage** merges on the *minimum* pairwise distance between clusters; **complete linkage** on the *maximum*. Single linkage can produce long "chained" clusters; complete linkage favours compact ones. Weakness of single linkage: **chaining** — outliers can bridge otherwise distant clusters.',
            },
          },
        ],
        answers: {},
      },
      {
        id: 'q4',
        number: '4',
        text: 'Consider the transaction database below with minimum support 40% and minimum confidence 70%.\n\n- T1: {bread, milk}\n- T2: {bread, diapers, beer, eggs}\n- T3: {milk, diapers, beer, cola}\n- T4: {bread, milk, diapers, beer}\n- T5: {bread, milk, diapers, cola}\n\nUsing the **Apriori** algorithm, find all frequent 2-itemsets and compute the confidence of the rule $\\{diapers\\} \\Rightarrow \\{beer\\}$.',
        marks: 12,
        topics: ['association-rules', 'apriori'],
        difficulty: 'hard',
        diagrams: [],
        subQuestions: [],
        answers: {
          aiGeneral:
            'Min support 40% = 2 of 5 transactions. Frequent 2-itemsets: {bread, milk} (3), {bread, diapers} (3), {milk, diapers} (3), {diapers, beer} (3), {milk, beer} (2), {bread, beer} (2), {milk, cola} (2), {diapers, cola} (2). Confidence of $\\{diapers\\} \\Rightarrow \\{beer\\}$: $\\frac{supp(diapers \\cup beer)}{supp(diapers)} = \\frac{3}{4} = 75\\%$ — above the 70% threshold, so the rule is accepted.',
        },
      },
      {
        id: 'q5',
        number: '5',
        text: 'With the aid of the confusion matrix shown, define **precision** and **recall**, then compute both and the $F_1$ score. $F_1 = 2 \\cdot \\frac{P \\cdot R}{P + R}$.',
        marks: 10,
        topics: ['evaluation-metrics', 'classification'],
        difficulty: 'medium',
        diagrams: [
          {
            id: 'd2',
            imageUrl: localDiagramImage,
            caption: 'Fig. 2 — Confusion matrix: TP=40, FP=10, FN=20, TN=30.',
          },
        ],
        subQuestions: [],
        answers: {
          verified:
            'Precision $P = \\frac{TP}{TP+FP} = \\frac{40}{50} = 0.80$. Recall $R = \\frac{TP}{TP+FN} = \\frac{40}{60} = 0.667$. $F_1 = 2 \\cdot \\frac{0.80 \\times 0.667}{0.80 + 0.667} = 0.727$.',
          aiGeneral:
            'Precision is the fraction of predicted positives that are truly positive; recall is the fraction of actual positives the model finds. Here $P = 0.80$, $R = 0.667$, $F_1 \\approx 0.727$.',
          references: [{ source: 'textbook', label: 'Tan et al., Ch. 4.5', location: 'textbook://tan/ch4-5' }],
        },
      },
    ],
  },

  /* Shallower papers — enough for lists, locking, downloads. */
  {
    id: 'cec420-2022',
    courseCode: 'CEC420',
    title: 'Data Mining',
    year: 2022,
    session: 'First Semester Examination',
    semester: 'Semester 1',
    faculty: 'Engineering',
    department: 'Computer Engineering',
    level: 'L400',
    duration: '3 hours',
    totalMarks: 70,
    instructions: 'Answer ALL questions. All symbols have their usual meanings.',
    questions: [
      {
        id: '22q1',
        number: '1',
        text: 'Explain the difference between **classification** and **clustering**, giving one algorithm for each.',
        marks: 8,
        topics: ['classification', 'clustering'],
        difficulty: 'easy',
        diagrams: [],
        subQuestions: [],
        answers: {
          aiGeneral:
            'Classification is *supervised* — it learns from labelled examples (e.g. decision trees). Clustering is *unsupervised* — it groups unlabelled data by similarity (e.g. k-means).',
        },
      },
      {
        id: '22q2',
        number: '2',
        text: 'Describe the **k-means** algorithm and state two of its limitations. Why is the choice of $k$ critical?',
        marks: 10,
        topics: ['clustering', 'k-means'],
        difficulty: 'medium',
        diagrams: [],
        subQuestions: [],
        answers: {},
      },
    ],
  },
  {
    id: 'cec420-2021',
    courseCode: 'CEC420',
    title: 'Data Mining',
    year: 2021,
    session: 'First Semester Examination',
    semester: 'Semester 1',
    faculty: 'Engineering',
    department: 'Computer Engineering',
    level: 'L400',
    duration: '3 hours',
    totalMarks: 70,
    instructions: 'Answer ALL questions.',
    questions: [],
  },
  {
    id: 'cec412-2023',
    courseCode: 'CEC412',
    title: 'Machine Learning',
    year: 2023,
    session: 'First Semester Examination',
    semester: 'Semester 1',
    faculty: 'Engineering',
    department: 'Computer Engineering',
    level: 'L400',
    duration: '3 hours',
    totalMarks: 70,
    instructions: 'Answer ALL questions in Section A and any THREE from Section B.',
    questions: [
      {
        id: 'mlq1',
        number: '1',
        text: 'Derive the gradient-descent update rule for linear regression with loss $J(\\theta) = \\frac{1}{2m}\\sum_{i}(h_\\theta(x^i) - y^i)^2$.',
        marks: 10,
        topics: ['gradient-descent', 'linear-regression'],
        difficulty: 'hard',
        diagrams: [],
        subQuestions: [],
        answers: {},
      },
    ],
  },
  {
    id: 'cec412-2022',
    courseCode: 'CEC412',
    title: 'Machine Learning',
    year: 2022,
    session: 'First Semester Examination',
    semester: 'Semester 1',
    faculty: 'Engineering',
    department: 'Computer Engineering',
    level: 'L400',
    duration: '3 hours',
    totalMarks: 70,
    instructions: 'Answer ALL questions.',
    questions: [],
  },
  {
    id: 'cec406-2023',
    courseCode: 'CEC406',
    title: 'Computer Networks',
    year: 2023,
    session: 'First Semester Examination',
    semester: 'Semester 1',
    faculty: 'Engineering',
    department: 'Computer Engineering',
    level: 'L400',
    duration: '2.5 hours',
    totalMarks: 60,
    instructions: 'Answer ALL questions.',
    questions: [],
  },
  {
    id: 'cec404-2023',
    courseCode: 'CEC404',
    title: 'Embedded Systems',
    year: 2023,
    session: 'First Semester Examination',
    semester: 'Semester 1',
    faculty: 'Engineering',
    department: 'Computer Engineering',
    level: 'L400',
    duration: '3 hours',
    totalMarks: 70,
    instructions: 'Answer ALL questions.',
    questions: [],
  },
  {
    id: 'med310-2023',
    courseCode: 'MED310',
    title: 'Pathophysiology',
    year: 2023,
    session: 'End of Semester Examination',
    semester: 'Semester 2',
    faculty: 'Medicine',
    department: 'Biomedical Sciences',
    level: 'L300',
    duration: '3 hours',
    totalMarks: 100,
    instructions: 'Answer ALL questions.',
    questions: [],
  },
  {
    id: 'law205-2023',
    courseCode: 'LAW205',
    title: 'Constitutional Law',
    year: 2023,
    session: 'End of Semester Examination',
    semester: 'Semester 2',
    faculty: 'Law',
    department: 'Public Law',
    level: 'L200',
    duration: '3 hours',
    totalMarks: 100,
    instructions: 'Answer ANY FOUR questions.',
    questions: [],
  },
];

export function getPaper(id: string): Paper | undefined {
  return papers.find((p) => p.id === id);
}

/** Papers the mock user has already unlocked (rest show the paywall). */
export const unlockedPaperIds = new Set(['cec420-2023', 'cec420-2022', 'cec412-2023']);

/** Papers downloaded for offline revision (mock initial state). */
export const initiallyDownloadedPaperIds = new Set(['cec420-2023']);
