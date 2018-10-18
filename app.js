const quizData = './data/questions.json';

// TODO:
// read quiz questions from localStorage. 
// if not, fetch and store to localStorage
const modules = [];

const modulesEl = document.querySelector('#modules-overview');
const moduleEl = document.querySelector('#module-content');

let currentModuleTitle = undefined;
let currentModule = [];
let currentQuestion = undefined;
let questionTimer = undefined;
let questionPoints = [];
let questionHints = [];
let userScore = 0;

fetch(quizData)
    .then(blob => blob.json())
    .then(data => {
        modules.push(...data.modules)
        quizTitle = data.title;
        drawModuleOverview();
    });


function drawModuleOverview () {
    for(module of modules) {
        let btn = document.createElement('button');
        let icon = document.createElement('i');
        let label = document.createElement('span');
        
        btn.className = 'module';
        if (!module.questions) btn.classList.add('disabled');
        btn.dataset['module'] = module.title;
        label.textContent = module.title;
        icon.className = 'material-icons';
        icon.textContent = module.icon;

        btn.appendChild(icon)
        btn.appendChild(label);
        btn.addEventListener('click', selectModule);
        modulesEl.appendChild(btn);
    }
}

function selectModule (e) {
    if(e.target.classList.contains('disabled')) return false;
    
    e.target.classList.add('active');
    
    currentModuleTitle = e.target.dataset.module;
    currentModule = modules.find(module => {
        return module.title === currentModuleTitle;
    });

    // display module intro
    let title = moduleEl.querySelector('#module-intro h1')
    title.textContent = currentModule.scenario ? currentModule.scenario : '';
    let button = moduleEl.querySelector('#module-intro button')
    button.textContent = 'Start';
    button.addEventListener('click', startQuizModule); // hard-code to Question 1 ?
    
}

function startQuizModule () {
    (document.querySelector('#module-content')).classList.add('quiz');
    document.querySelector('.module-title').textContent = currentModuleTitle;
    currentQuestion = 0;
    questionPoints = [];
    displayQuestions();
    
    questionPoints = [];
    questionHints = [];
    
}

function displayQuestions () {
    
    if(currentQuestion === undefined) {
        (document.querySelector('#module-content')).classList.remove('quiz');
    }

    document.querySelector('#module-questions').innerHTML = ''; 
    const questionsContainer = document.querySelector('#module-questions');

    questionsContainer.dataset.currentQuestion = currentQuestion;
    questionsContainer.dataset.totalQuestions = currentModule.questions.length;
    
    
    // display module questions one by one
    
    drawQuestion()
    
}

function drawQuestion () {
    let question = currentModule.questions[currentQuestion];
    let questionEl = document.querySelector('#templates .module-questions .question').cloneNode(true);
    let responseFieldSet = questionEl.querySelector('fieldset.responses');

    userScore = questionPoints.reduce((a,b) => a+b, 0);
    (document.querySelector('.score')).textContent = userScore;

    questionEl.querySelector('.prompt').innerHTML = `<span class="avatar">🤷</span> <blockquote>${question.prompt}</blockquote>`;
    
    if (currentQuestion === currentQuestion) {
        questionHints = [];
        console.info('drawQuestion(current), set timer');
        questionTimer = setInterval(nextHint, 5000);
        questionEl.dataset.currentQuestion = 'true';
    }

    for(response of question.responses) {
        responseFieldSet.appendChild(drawResponse(response, currentQuestion));
    }

    document.querySelector('#module-questions').appendChild(questionEl);
    let responseForm = questionEl.querySelector('form');

    responseForm.addEventListener('submit', handleResponseSubmit);
    responseForm.querySelector('button[type=button]').addEventListener('click', prevQuestion);
}

function drawResponse (response, index) {
    let responseLabel = document.createElement('label');
    responseLabel.innerHTML = `<input type="radio" name="question-${index}" value="${response.text}"> ${response.text}`
    return responseLabel;
}

function handleResponseSubmit(e) {
    if(!e.isTrusted) return false;
    e.preventDefault();

    let answer = e.target.querySelector('input[type=radio]:checked');
    let points;

    if (!answer) {
        
    } else {
        // TODO: save actual response and calculate score every time
        let correctAnswer = currentModule.questions[currentQuestion].responses.find( item => item.correct)
        if (correctAnswer.text === answer.value) {
            points = currentModule.questions[currentQuestion].points - (currentModule.questions[currentQuestion].hint_value * questionHints.length);
            awardRemainingPoints(points);
            nextQuestion();
        } else {   
            answer.parentNode.classList.add('error');
            answer.disabled = 'disabled';
        }
    }
}

function awardRemainingPoints(points) {
    questionPoints[currentQuestion] = points;
}

function nextHint() {
    
    if (currentModule.questions[currentQuestion] && questionHints.length < currentModule.questions[currentQuestion].hints.length) {
        questionHints.push(currentModule.questions[currentQuestion].hints[questionHints.length]);
        console.info('hint');
    } else {
        console.warn('no more hints');
        console.log('reset timer')
        clearInterval(questionTimer);
    }
    
    // brrr
    var hints = ''; 
    questionHints.forEach(item => {
        hints += `<li>${item}</li>`;
    });

    (document.querySelector('[data-current-question=true] ul'))
        .innerHTML = `${hints}`;
}

function nextQuestion () {
    if(currentQuestion == currentModule.questions.length -1) {
        currentQuestion++
        drawQuestion();
        
    } else {
        currentQuestion++
        displayQuestions()
    }
    console.log('next question, reset timer');
    clearInterval(questionTimer);
}

function prevQuestion() {
    if(currentQuestion > 0) {
        currentQuestion--
    } else {
        currentQuestion = undefined;
    }
    displayQuestions()
    console.log('prev question, reset timer');
    clearInterval(questionTimer);
}
