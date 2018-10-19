const quizData = './data/questions.json';
// TODO:
// read quiz questions from localStorage. 
// if not, fetch and store to localStorage


const modules = [];
const modulesEl = document.querySelector('#modules-overview');
const moduleEl = document.querySelector('#module-intro'); 
let quizEl = document.querySelector('main'); //FIXME
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
        (document.querySelector('.quiz-title')).textContent = quizTitle;
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
    moduleEl.querySelector('h1').textContent = currentModule.scenario ? currentModule.scenario : '';
    moduleEl.querySelector('figure').innerHTML = currentModule.media;
    
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

    let availablePoints = [];
    currentModule.questions.forEach(q => availablePoints.push(q.points));
    availablePoints = availablePoints.reduce((a,b) => a+b, 0);

    

    let scoreBoard = document.querySelector('#module-score');
    scoreBoard.querySelector('.points').textContent = userScore;
    scoreBoard.querySelector('h2').textContent = `That's ${(userScore / availablePoints) * 100}% 
     ${((userScore / availablePoints) * 100) > 75 ? '🤩 Well done!' : '🤨 Could do better..'}`;
    scoreBoard.querySelector('pre').textContent = currentModule.learn_more;
    var backbutton = scoreBoard.querySelector('button');
    backbutton.addEventListener('click', function(){quizEl.className = 'modules-overview'});
}

function drawQuestion () {

    let question = currentModule.questions[currentQuestion];
    let questionEl = document.querySelector('#templates .module-questions .question').cloneNode(true);
    let questionEls = document.querySelectorAll('.question');
    questionEls.forEach(el => delete el.dataset.currentQuestion);
    questionEl.dataset.currentQuestion = 'true';

    questionHints = [];
    questionTimer = setInterval(function(){ nextHint()}, 5000);
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

    points = currentModule.questions[currentQuestion].points - (currentModule.questions[currentQuestion].hint_value * questionHints.length);
    awardRemainingPoints(points);

    if (!answer) {
        
    } else {
        // TODO: save actual response and calculate score every time
        let correctAnswer = currentModule.questions[currentQuestion].responses.find( item => item.correct)
        if (correctAnswer.text === answer.value) {
            nextQuestion();
        } else {   
            answer.parentNode.classList.add('error');
            answer.disabled = 'disabled';
        }
    }
}

function awardRemainingPoints(points) {
    questionPoints[currentQuestion] = points;
    userScore = questionPoints.reduce((a,b) => a+b, 0);
    (document.querySelector('.score')).textContent = userScore;
}

function nextHint() {
    if (currentModule.questions[currentQuestion] && questionHints.length < currentModule.questions[currentQuestion].hints.length) {
        questionHints.push(currentModule.questions[currentQuestion].hints[questionHints.length]);
    } else {
        clearInterval(questionTimer);
    }
    
    // brrr
    var hints = ''; 
    questionHints.forEach(item => { hints += `<li>${item}</li>` });

    (document.querySelector('[data-current-question=true] ul'))
        .innerHTML = `${hints}`;
}

function nextQuestion () {
    
    clearInterval(questionTimer);
    if(currentQuestion == currentModule.questions.length -1) {
        quizEl.className="module-intro";
        displayModuleScore();
    } else {
        currentQuestion++
        drawQuestion();
    }
    
}

function prevQuestion() {
    if(currentQuestion > 0) {
        currentQuestion--
    } else {
        currentQuestion = 0;
    }
    clearInterval(questionTimer);
    drawQuestion();
    
}
