const API_URL = "/api";


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
let questions = [];  // all questions from the backend
let current = 0;     // index of the question on screen
let tries = 0;



async function getQuestions(topic) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: topic }),
  });
  if (!res.ok) throw new Error("getQuestions failed: " + res.status);
  return res.json();
}


async function checkAnswer(questionIndex, answer) {
  const res = await fetch("/check-answer-api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_index: questionIndex, answer: answer }),
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



topicForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  topic = topicInput.value.trim();
  if (!topic) {
    topicInput.value = "";
    return;
  }

  topicError.textContent = "";
  showScreen("loading");

  try {
    const data = await getQuestions(topic);
    questions = data['data']; 
    console.log(questions[0])
    current = 0;
    showQuestion();
    showScreen("question");
  } catch (err) {
    console.error(err);
    topicError.textContent = "Couldn't load questions. Check the backend and try again.";
    showScreen("topic");
  }
});

function showQuestion() {
  const q = questions[current];
  console.log('data: ', q)
  console.log(q['question'])
  console.log(q.answers)
  tries = 0;

  topicLabel.textContent = topic;
  questionCount.textContent = "Question " + (current + 1) + " of " + questions.length;
  questionText.textContent = q.question;

  feedback.textContent = "";
  feedback.className = "feedback";
  nextBtn.classList.add("hidden");

  if (current === questions.length - 1) {
    nextBtn.textContent = "Finish";
  } else {
    nextBtn.textContent = "Next question →";
  }

  optionsBox.innerHTML = "";
  optionsBox.classList.remove("done");

  const letters = ["A", "B", "C", "D"];

  q.answers.forEach(function (optionText, index) {
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
      handleAnswer(btn, optionText);
    });

    optionsBox.appendChild(btn);
  });
}

async function handleAnswer(btn, answer) {
  tries++;
  setOptionsDisabled(true); 
  btn.classList.add("checking");

  try {
    const result = await checkAnswer(current, answer);
    console.log(result)
    btn.classList.remove("checking");
    if (result.data == 1) {
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

nextBtn.addEventListener("click", function () {
  current++;
  if (current < questions.length) {
    showQuestion();
  } else {
    topicInput.value = "";
    showScreen("topic");
  }
});

newTopicBtn.addEventListener("click", function () {
  topicInput.value = "";
  showScreen("topic");
  topicInput.focus();
});