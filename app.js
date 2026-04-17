// ISC2 Exam Prep App - Main Logic

const DEFAULT_CANDIDATE_NAME = 'Candidate';
const CANDIDATE_NAME_STORAGE_KEY = 'isc2CandidateName';
const EXAM_SIZE = 100;

const EXAMS = {
  exam1: {
    key: 'exam1',
    shortTitle: 'Exam 1',
    label: 'Security Principles & Operations',
    blurb: 'Security principles, incident response, BC/DR, access controls, network security, security operations.',
    pool: () => (typeof QUESTIONS_EXAM_1 !== 'undefined' ? QUESTIONS_EXAM_1 : []),
  },
  exam2: {
    key: 'exam2',
    shortTitle: 'Exam 2',
    label: 'Network Security Fundamentals',
    blurb: 'TCP/UDP ports, network protocols, OSI model, security scenarios.',
    pool: () => (typeof QUESTIONS_EXAM_2 !== 'undefined' ? QUESTIONS_EXAM_2 : []),
  },
};

let candidateName = (() => {
  try {
    return localStorage.getItem(CANDIDATE_NAME_STORAGE_KEY) || DEFAULT_CANDIDATE_NAME;
  } catch {
    return DEFAULT_CANDIDATE_NAME;
  }
})();

const startScreen = document.getElementById('start-screen');
const quizContainer = document.getElementById('quiz-container');
const resultsScreen = document.getElementById('results-screen');
const flashcardContainer = document.getElementById('flashcard-container');

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackEl = document.getElementById('feedback');
const currentQEl = document.getElementById('current-q');
const progressBar = document.getElementById('progress-bar');
const scoreDisplay = document.getElementById('score-display');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const examYearBadge = document.getElementById('exam-year-badge');
const timerValueEl = document.getElementById('timer-value');
const exitExamBtn = document.getElementById('exit-exam-btn');
const candidateNameHeaderEl = document.getElementById('candidate-name-display');
const candidateNameInlineEl = document.getElementById('candidate-name-inline');
const candidateNameResultsEl = document.getElementById('candidate-name-results');
const candidateNameFlashcardsEl = document.getElementById('candidate-name-flashcards');
const candidateNameInput = document.getElementById('candidate-name-input');
const candidateNameSaveBtn = document.getElementById('candidate-name-save');

const startFlashcardsBtnExam1 = document.getElementById('start-flashcards-exam1-btn');
const startFlashcardsBtnExam2 = document.getElementById('start-flashcards-exam2-btn');

const flashcardCounterEl = document.getElementById('flashcard-counter');
const flashcardQuestionEl = document.getElementById('flashcard-question');
const flashcardOptionsEl = document.getElementById('flashcard-options');
const flashcardExplanationEl = document.getElementById('flashcard-explanation');
const flashcardAnswerEl = document.getElementById('flashcard-answer');
const flashcardPrevBtn = document.getElementById('flashcard-prev-btn');
const flashcardNextBtn = document.getElementById('flashcard-next-btn');
const flashcardToggleAnswerBtn = document.getElementById('flashcard-toggle-answer-btn');
const exitFlashcardsBtn = document.getElementById('exit-flashcards-btn');
const shuffleFlashcardsBtn = document.getElementById('shuffle-flashcards-btn');
const quizTotalEl = document.getElementById('quiz-total');
const flashcardTopicLabelEl = document.getElementById('flashcard-topic-label');

let currentIndex = 0;
let userAnswers = [];
let answered = new Set();
let selectedExamKey = 'exam1';
let timerInterval = null;
let elapsedSeconds = 0;
let flashcardOrder = [];
let flashcardIndex = 0;
let flashcardExamKey = 'exam1';

let questions = [];

function getExamLabel() {
  return EXAMS[selectedExamKey]?.label || 'ISC2 Practice Exam';
}

function updateCandidateNameDisplays() {
  if (candidateNameHeaderEl) candidateNameHeaderEl.textContent = candidateName;
  if (candidateNameInlineEl) candidateNameInlineEl.textContent = candidateName;
  if (candidateNameResultsEl) candidateNameResultsEl.textContent = candidateName;
  if (candidateNameFlashcardsEl) candidateNameFlashcardsEl.textContent = candidateName;
  if (candidateNameInput && !candidateNameInput.value) {
    candidateNameInput.value = candidateName;
  }
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function shuffleArray(arr, seed) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function startTimer() {
  elapsedSeconds = 0;
  timerValueEl.textContent = formatTime(0);
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    timerValueEl.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function init(examKey) {
  selectedExamKey = examKey && EXAMS[examKey] ? examKey : 'exam1';
  const meta = EXAMS[selectedExamKey];
  const pool = meta.pool();
  const cap = Math.min(EXAM_SIZE, pool.length);
  questions = pool.slice(0, cap);
  userAnswers = [];
  answered = new Set();
  currentIndex = 0;
  examYearBadge.textContent = `${meta.shortTitle}: ${meta.label}`;
  if (quizTotalEl) quizTotalEl.textContent = String(questions.length || cap);
}

function showScreen(screen) {
  startScreen.classList.add('hidden');
  quizContainer.classList.add('hidden');
  resultsScreen.classList.add('hidden');
  if (flashcardContainer) flashcardContainer.classList.add('hidden');
  screen.classList.remove('hidden');
}

function ensureCandidateNameFromInput() {
  if (!candidateNameInput) return true;
  const value = candidateNameInput.value.trim();
  if (!value) {
    alert('Please enter your name to continue.');
    candidateNameInput.focus();
    return false;
  }
  candidateName = value;
  try {
    localStorage.setItem(CANDIDATE_NAME_STORAGE_KEY, candidateName);
  } catch {
    // ignore storage errors
  }
  updateCandidateNameDisplays();
  return true;
}

function renderQuestion() {
  const q = questions[currentIndex];
  questionText.textContent = q.question;

  optionsContainer.innerHTML = '';
  const userAnswer = userAnswers.find(a => a.questionId === q.id);

  q.options.forEach((opt, i) => {
    const div = document.createElement('button');
    div.type = 'button';
    div.className = 'option-card w-full text-left p-3 sm:p-4 rounded-xl border-2 border-notary-200 transition-all duration-200 flex items-start gap-2 sm:gap-3';
    div.dataset.index = i;

    const letter = String.fromCharCode(65 + i);
    div.innerHTML = `
      <span class="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-notary-100 text-notary-700 font-bold flex items-center justify-center text-xs sm:text-sm">${letter}</span>
      <span class="text-notary-800 text-sm sm:text-base">${opt}</span>
    `;

    if (userAnswer !== undefined) {
      div.disabled = true;
      if (i === userAnswer.selectedIndex) {
        div.classList.add(userAnswer.isCorrect ? 'correct' : 'incorrect');
      }
      if (i === q.correct && !userAnswer.isCorrect) {
        div.classList.add('correct');
      }
    } else {
      div.addEventListener('click', () => selectOption(q, i));
    }

    optionsContainer.appendChild(div);
  });

  feedbackEl.classList.add('hidden');
  if (userAnswer !== undefined) {
    feedbackEl.classList.remove('hidden');
    feedbackEl.className = 'mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl text-sm sm:text-base ' + (userAnswer.isCorrect ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200');
    feedbackEl.innerHTML = `
      <p class="font-semibold mb-1">${userAnswer.isCorrect ? `✓ Correct, ${candidateName}!` : `✗ Incorrect, ${candidateName}`}</p>
      <p class="text-sm opacity-90">${q.explanation}</p>
    `;
  }

  currentQEl.textContent = currentIndex + 1;
  const totalQuestions = questions.length || EXAM_SIZE;
  if (quizTotalEl) quizTotalEl.textContent = String(totalQuestions);
  progressBar.style.width = `${((currentIndex + 1) / totalQuestions) * 100}%`;

  const correctCount = userAnswers.filter(a => a.isCorrect).length;
  scoreDisplay.textContent = userAnswers.length > 0 ? `${correctCount} / ${userAnswers.length} correct` : '—';

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = !answered.has(q.id);
  const lastIndex = (questions.length || EXAM_SIZE) - 1;
  nextBtn.textContent = currentIndex === lastIndex ? 'See Results' : 'Next →';
}

function selectOption(q, index) {
  if (answered.has(q.id)) return;

  const isCorrect = index === q.correct;
  userAnswers.push({ questionId: q.id, selectedIndex: index, isCorrect });
  answered.add(q.id);

  renderQuestion();
}

function goNext() {
  const q = questions[currentIndex];
  if (!answered.has(q.id)) return;

  const lastIndex = (questions.length || EXAM_SIZE) - 1;
  if (currentIndex < lastIndex) {
    currentIndex++;
    renderQuestion();
  } else {
    showResults();
  }
}

function goPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
}

function resultsMessageForScore(pct) {
  if (selectedExamKey === 'exam2') {
    if (pct >= 80) {
      return `Excellent work, ${candidateName}! You demonstrate strong ISC2 network security fundamentals knowledge.`;
    }
    if (pct >= 70) {
      return `Good effort, ${candidateName}! Review the explanations and try again to strengthen your ISC2 exam readiness.`;
    }
    return `Keep studying, ${candidateName}! Review TCP/UDP ports, protocols, OSI layers, and security scenarios, then retake the exam.`;
  }
  if (pct >= 80) {
    return `Excellent work, ${candidateName}! You demonstrate strong ISC2 security principles and operations knowledge.`;
  }
  if (pct >= 70) {
    return `Good effort, ${candidateName}! Review the explanations and try again to strengthen your ISC2 exam readiness.`;
  }
  return `Keep studying, ${candidateName}! Review security principles, incident response, BC/DR, access controls, network security, and security operations, then retake the exam.`;
}

function showResults(isEarlyExit = false) {
  stopTimer();
  const correct = userAnswers.filter(a => a.isCorrect).length;
  const totalPool = questions.length || EXAM_SIZE;
  const total = isEarlyExit ? userAnswers.length : totalPool;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const iconEl = document.getElementById('results-icon');
  const scoreEl = document.getElementById('results-score');
  const msgEl = document.getElementById('results-message');
  const examYearEl = document.getElementById('results-exam-year');
  const meta = EXAMS[selectedExamKey];
  examYearEl.textContent = `${candidateName} — ${meta.shortTitle}: ${meta.label}${isEarlyExit ? ' (Exited early)' : ''}`;

  if (total === 0) {
    iconEl.className = 'w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-notary-100 text-notary-600';
    iconEl.innerHTML = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    msgEl.textContent = `${candidateName}, you exited without answering any questions.`;
  } else if (pct >= 80) {
    iconEl.className = 'w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600';
    iconEl.innerHTML = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
    msgEl.textContent = resultsMessageForScore(pct);
  } else if (pct >= 70) {
    iconEl.className = 'w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-amber-100 text-amber-600';
    iconEl.innerHTML = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    msgEl.textContent = resultsMessageForScore(pct);
  } else {
    iconEl.className = 'w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-red-100 text-red-600';
    iconEl.innerHTML = '<svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
    msgEl.textContent = resultsMessageForScore(pct);
  }

  let scoreText = `${correct} / ${total} (${pct}%)`;
  if (total > 0) scoreText += ` • Time: ${formatTime(elapsedSeconds)}`;
  scoreEl.textContent = scoreText;
  showScreen(resultsScreen);
}

document.querySelectorAll('.exam-start-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!ensureCandidateNameFromInput()) return;
    const key = btn.dataset.exam;
    if (!key || !EXAMS[key]) return;
    init(key);
    startTimer();
    showScreen(quizContainer);
    renderQuestion();
  });
});

exitExamBtn.addEventListener('click', () => {
  if (userAnswers.length === 0) {
    if (confirm(`${candidateName}, exit without answering any questions? You will see no results.`)) {
      showResults(true);
    }
  } else {
    if (confirm(`${candidateName}, exit now? You've answered ${userAnswers.length} questions. Your results will be shown.`)) {
      showResults(true);
    }
  }
});

prevBtn.addEventListener('click', goPrev);
nextBtn.addEventListener('click', goNext);

document.getElementById('retry-btn').addEventListener('click', () => {
  init(selectedExamKey);
  startTimer();
  showScreen(quizContainer);
  renderQuestion();
});

document.getElementById('back-to-exams-btn').addEventListener('click', () => {
  showScreen(startScreen);
});

if (candidateNameSaveBtn && candidateNameInput) {
  candidateNameSaveBtn.addEventListener('click', () => {
    ensureCandidateNameFromInput();
  });

  candidateNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      candidateNameSaveBtn.click();
    }
  });
}

updateCandidateNameDisplays();

function buildFlashcardOrder() {
  const meta = EXAMS[flashcardExamKey];
  const pool = meta.pool();
  flashcardOrder = shuffleArray(pool, Date.now() % 1000000);
  flashcardIndex = 0;
  if (flashcardTopicLabelEl) {
    flashcardTopicLabelEl.textContent = `${meta.shortTitle}: ${meta.label}`;
  }
}

function renderFlashcard(hideAnswer = true) {
  if (!flashcardOrder || flashcardOrder.length === 0) return;
  const total = flashcardOrder.length;
  if (flashcardIndex < 0) flashcardIndex = 0;
  if (flashcardIndex > total - 1) flashcardIndex = total - 1;

  const q = flashcardOrder[flashcardIndex];
  flashcardQuestionEl.textContent = q.question;
  flashcardCounterEl.textContent = `Card ${flashcardIndex + 1} of ${total}`;

  const letters = ['A', 'B', 'C', 'D'];
  const optionsHtml = q.options
    .map((opt, idx) => {
      const isCorrect = idx === q.correct;
      return `
        <div class="flex items-start gap-2">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-semibold ${
            isCorrect ? 'bg-emerald-600 text-white' : 'bg-notary-100 text-notary-700'
          }">
            ${letters[idx] || String.fromCharCode(65 + idx)}
          </span>
          <span class="text-notary-800 text-sm sm:text-base">${opt}</span>
        </div>
      `;
    })
    .join('');

  flashcardOptionsEl.innerHTML = optionsHtml;
  flashcardExplanationEl.textContent = q.explanation || '';

  if (hideAnswer) {
    flashcardAnswerEl.classList.add('hidden');
    flashcardToggleAnswerBtn.textContent = 'Show Answer';
  } else {
    flashcardAnswerEl.classList.remove('hidden');
    flashcardToggleAnswerBtn.textContent = 'Hide Answer';
  }

  flashcardPrevBtn.disabled = flashcardIndex === 0;
  flashcardNextBtn.disabled = flashcardIndex === total - 1;
}

function startFlashcardsForExam(key) {
  if (!EXAMS[key]) return;
  flashcardExamKey = key;
  stopTimer();
  buildFlashcardOrder();
  showScreen(flashcardContainer);
  renderFlashcard(true);
}

if (startFlashcardsBtnExam1) {
  startFlashcardsBtnExam1.addEventListener('click', () => {
    if (!ensureCandidateNameFromInput()) return;
    startFlashcardsForExam('exam1');
  });
}

if (startFlashcardsBtnExam2) {
  startFlashcardsBtnExam2.addEventListener('click', () => {
    if (!ensureCandidateNameFromInput()) return;
    startFlashcardsForExam('exam2');
  });
}

if (flashcardPrevBtn) {
  flashcardPrevBtn.addEventListener('click', () => {
    flashcardIndex -= 1;
    renderFlashcard(true);
  });
}

if (flashcardNextBtn) {
  flashcardNextBtn.addEventListener('click', () => {
    flashcardIndex += 1;
    renderFlashcard(true);
  });
}

if (flashcardToggleAnswerBtn) {
  flashcardToggleAnswerBtn.addEventListener('click', () => {
    const isHidden = flashcardAnswerEl.classList.contains('hidden');
    renderFlashcard(!isHidden);
  });
}

if (exitFlashcardsBtn) {
  exitFlashcardsBtn.addEventListener('click', () => {
    showScreen(startScreen);
  });
}

if (shuffleFlashcardsBtn) {
  shuffleFlashcardsBtn.addEventListener('click', () => {
    buildFlashcardOrder();
    renderFlashcard(true);
  });
}
