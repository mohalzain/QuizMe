const USE_MOCK = true;                    
const API_URL = "http://localhost:8000/api";  


const screens = {
  topic: document.getElementById("topic-screen"),
  loading: document.getElementById("loading-screen"),
  question: document.getElementById("question-screen"),
};

const topicForm = document.getElementById("topic-form");
const topicInput = document.getElementById("topic-input");
const topicError = document.getElementById("topic-error");

const topicLabel = document.getElementById("topic-label");
const questionCount = document.getElementById("question-count");
const questionText = document.getElementById("question-text");
const optionsBox = document.getElementById("options");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");
const newTopicBtn = document.getElementById("new-topic-btn");


let topic = "";
let questionNumber = 0;
let currentQuestionId = null;
let tries = 0;




async function getQuestion(topic) {


  const res = await fetch(API_URL ,{
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: topic }),
  });
  if (!res.ok) throw new Error("getQuestion failed: " + res.status);
  return res.json();
}


async function checkAnswer(questionId, answerIndex) {
  if (USE_MOCK) return mockCheckAnswer(questionId, answerIndex);

  const res = await fetch(API_URL + "/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_id: questionId, answer: answerIndex }),
  });
  if (!res.ok) throw new Error("checkAnswer failed: " + res.status);
  return res.json();
}


function showScreen(name) {
  for (const key in screens) {
    screens[key].classList.remove("active");
  }
  screens[name].classList.add("active");
}



topicForm.addEventListener("submit", function (e) {
  e.preventDefault();
  topic = topicInput.value.trim();
  if (!topic) {topicInput.value = ''; return;}

  topicError.textContent = "";
  questionNumber = 0;
  loadQuestion();
});

async function loadQuestion() {
  showScreen("loading");

  try {
    const data = await getQuestion(topic);
    questionNumber++;
    renderQuestion(data);
    showScreen("question");
  } catch (err) {
    console.error(err);
    topicError.textContent = "Couldn't load a question. Check the backend and try again.";
    showScreen("topic");
  }
}

function renderQuestion(data) {
  currentQuestionId = data.id;
  tries = 0;

  topicLabel.textContent = topic;
  questionCount.textContent = "Question " + questionNumber;
  questionText.textContent = data.question;

  feedback.textContent = "";
  feedback.className = "feedback";
  nextBtn.classList.add("hidden");

  optionsBox.innerHTML = "";
  optionsBox.classList.remove("done");

  const letters = ["A", "B", "C", "D"];

  data.options.forEach(function (optionText, index) {
    const btn = document.createElement("button");
    btn.className = "option";

    const letter = document.createElement("span");
    letter.className = "letter";
    letter.textContent = letters[index];

    const text = document.createElement("span");
    text.textContent = optionText;

    btn.appendChild(letter);
    btn.appendChild(text);

    btn.addEventListener("click", function () {
      handleAnswer(btn, index);
    });

    optionsBox.appendChild(btn);
  });
}

async function handleAnswer(btn, index) {
  tries++;
  setOptionsDisabled(true);       
  btn.classList.add("checking");

  try {
    const result = await checkAnswer(currentQuestionId, index);
    btn.classList.remove("checking");

    if (result.correct) {
      btn.classList.add("correct");
      optionsBox.classList.add("done");
      feedback.textContent = tries === 1 ? "Correct! First try." : "Correct! Got it in " + tries + " tries.";
      feedback.className = "feedback good";
      nextBtn.classList.remove("hidden");
    } else {
      btn.classList.add("wrong");
      feedback.textContent = "Not quite. Try again.";
      feedback.className = "feedback bad";
      setOptionsDisabled(false);  
    }
  } catch (err) {
    console.error(err);
    btn.classList.remove("checking");
    feedback.textContent = "Something went wrong. Click again.";
    feedback.className = "feedback bad";
    tries--;
    setOptionsDisabled(false);
  }
}

function setOptionsDisabled(state) {
  const buttons = optionsBox.querySelectorAll(".option");
  buttons.forEach(function (b) {
    b.disabled = state || b.classList.contains("wrong");
  });
}

nextBtn.addEventListener("click", loadQuestion);

newTopicBtn.addEventListener("click", function () {
  topicInput.value = "";
  showScreen("topic");
  topicInput.focus();
});




const MOCK_QUESTIONS = [
  {
    id: 1,
    question: "What is the time complexity of binary search on a sorted array?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    answer: 1,
  },
  {
    id: 2,
    question: "Which HTTP method is usually used to create a new resource?",
    options: ["GET", "DELETE", "POST", "HEAD"],
    answer: 2,
  },
  {
    id: 3,
    question: "In Python, which of these is immutable?",
    options: ["list", "dict", "set", "tuple"],
    answer: 3,
  },
];

function mockGetQuestion(topic) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      const q = MOCK_QUESTIONS[questionNumber % MOCK_QUESTIONS.length];
      resolve({ id: q.id, question: q.question, options: q.options });
    }, 1200);
  });
}

function mockCheckAnswer(questionId, answerIndex) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      const q = MOCK_QUESTIONS.find(function (item) { return item.id === questionId; });
      resolve({ correct: q.answer === answerIndex });
    }, 300);
  });
}
