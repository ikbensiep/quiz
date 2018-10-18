const quizData = './data/questions.json';
// TODO:
// read quiz questions from localStorage. 
// if not, fetch and store to localStorage

let quizEl = document.querySelector('main');
const modules = [];

const modulesEl = document.querySelector('#modules-overview');

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
    quizEl.className="modules-overview";

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
    
    quizEl.className="module-intro";
    
    
    
    const moduleButtons = document.querySelectorAll('#modules-overview button');
    
    moduleButtons.forEach(function(moduleButton){
      moduleButton.classList.remove('active');
    })

    e.target.classList.add('active');

    currentModuleTitle = e.target.dataset.module;
    document.querySelector('.module-title').textContent = currentModuleTitle;
    
    currentModule = modules.find(module => {
        return module.title === currentModuleTitle;
    });


    // display module intro

    let title = document.querySelector('#module-intro h1')
    title.textContent = currentModule.scenario ? currentModule.scenario : '';
    let button = document.querySelector('#module-intro button')
    button.textContent = 'Start';
    button.addEventListener('click', startQuizModule); // hard-code to Question 1 ?
    
}

function startQuizModule () {
    quizEl.className="module-questions";
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

function displayModuleScore() {
    quizEl.className = 'module-score';

    document.querySelector('#module-score .points').textContent = userScore;
    document.querySelector('#module-score h2').textContent = 'Well done!'
    document.querySelector('#module-score pre').textContent = currentModule.learn_more;
}

function drawQuestion () {

    let question = currentModule.questions[currentQuestion];

    let questionEl = document.querySelector('#templates .module-questions .question').cloneNode(true);

    questionHints = [];
    
    console.info('drawQuestion(current), set timer');
    questionTimer = setInterval(nextHint, 5000);

    let questionEls = document.querySelectorAll('.question');
    questionEls.forEach(el => delete el.dataset.currentQuestion);
    questionEl.dataset.currentQuestion = 'true';
    

    userScore = questionPoints.reduce((a,b) => a+b, 0);
    (document.querySelector('.score')).textContent = userScore;

    questionEl.querySelector('.prompt').innerHTML = `<span class="avatar">🤷</span> <blockquote>${question.prompt}</blockquote>`;
    
    document.querySelector('#module-questions').appendChild(questionEl);    

    
    let responseForm = questionEl.querySelector('form');
    let responseFieldSet = responseForm.querySelector('fieldset.responses');
    
    for(response of question.responses) {
        responseFieldSet.appendChild(drawResponse(response, currentQuestion));
    }

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
    console.log(currentQuestion, currentModule.questions.length);
    
    if(currentQuestion == currentModule.questions.length -1) {
        quizEl.className="module-intro";
        displayModuleScore();
    } else {
        currentQuestion++
        drawQuestion();
    }
    console.log('next question, reset timer');
    clearInterval(questionTimer);
}

function prevQuestion() {
    if(currentQuestion > 0) {
        currentQuestion--
    } else {
        currentQuestion = 0;
    }
    drawQuestion();
    console.log('prev question, reset timer');
    clearInterval(questionTimer);
}
