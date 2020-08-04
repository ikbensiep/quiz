const quizData = './data/questions.json';
// TODO:
// read quiz questions from localStorage. 
// if not, fetch and store to localStorage

const modules = [];
const modulesEl = document.querySelector('#modules-overview');
const moduleEl = document.querySelector('#module-intro'); 
const quizEl = document.querySelector('main'); 

let currentModuleTitle = undefined;
let currentModule = [];
let currentQuestion = undefined;
let questionTimer = undefined;
let modulePoints = [];
let questionPoints = 0;
let questionHints = [];
let userScore = 0;
let scoreBoard = {};
let soundFXEnabled = (document.querySelector('#toggle-sound-fx')).checked;

// PHASE 1:
// fetch quiz data,
// add to modules[]
// draw module overview to kick things off

function httpGet(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        // console.log(xhr.readyState, xhr.status);
        if(xhr.readyState === 4 && xhr.status === 200) {
            callback(xhr.responseText);
        }
    }
    xhr.open("GET", url, true)
    xhr.send(null);
}

httpGet(quizData, function(data){
    data = JSON.parse(data);
    modules.push(...data.modules);
    
    //TODO: shuffle questions order in drawModuleQuestions or right
    
    // dit kan chiquer..
    quizTitle = data.title;
    (document.querySelector('.quiz-title')).textContent = quizTitle;
    drawModuleOverview();
    document.body.removeAttribute('unresolved');
});

function drawModuleOverview () {
    quizEl.className="modules-overview";
    modulesEl.innerHTML = '';
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

        
        let maxscore = 0;
        module.questions && module.questions.forEach(question => {maxscore += question.points});
        btn.dataset.score = scoreBoard[module.title] && scoreBoard[module.title].score.reduce((a,b) => a+b, 0) || 0;
        btn.dataset.maxscore = maxscore;
        btn.style.backgroundPosition = '0px '+ (Math.floor((btn.dataset.score / maxscore) * 100) ) + '%';
        if(module.title === currentModuleTitle) {
            btn.classList.add('scorebubble')
        }
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
    modulePoints = [];
    questionHints = [];
    displayQuestions();
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
    let questionEls = document.querySelectorAll('.question');
    questionEls.forEach(el => delete el.dataset.currentQuestion);
    questionEl.dataset.currentQuestion = 'true';

    questionHints = [];
    questionTimer = setInterval( function(){ 
        nextHint();
        document.querySelectorAll('output')[currentQuestion].textContent = questionPoints;
        
    }, 5000);

    questionEl.querySelector('.prompt').innerHTML = `<span class="avatar">🤷</span> <blockquote>${question.prompt}</blockquote>`;
    document.querySelector('#module-questions').appendChild(questionEl);

    let responseForm = questionEl.querySelector('form');
    let responseFieldSet = responseForm.querySelector('fieldset.responses');

    responseFieldSet.appendChild(drawResponse(question));
    
    responseForm.addEventListener('submit', handleResponseSubmit);
    responseForm.querySelector('button[type=button]').addEventListener('click', prevQuestion);

    let firstInput = responseForm.querySelector('label input');
    firstInput.focus();

}

function drawResponse (question) {
    
    var output = document.createElement('div');
    var corrects = question.responses.filter(response =>  {
        return response.correct == true;
    });

    // console.log("options: ", question.responses.length)
    // console.log("correct: ", corrects);

    // if only one valid response, draw text input
    if(question.responses.length === 1) {
        let responseLabel = document.createElement('label');
        responseLabel.setAttribute('for', `question-${currentQuestion}-0`)
        
        responseLabel.innerHTML = `<input type="text" name="question-${currentQuestion}-0" value="${question.responses[0].text}"/> <span class="feedback"></span>`;
        
        output.appendChild(responseLabel);
    } else {
        let inputtype = corrects.length > 1 ?  'checkbox' : 'radio';
        let index = 0;
        for(response of question.responses) {
            index++;
            let responseLabel = document.createElement('label');
            responseLabel.setAttribute('for', `question-${currentQuestion}-${index}`);
            responseLabel.innerHTML = `
                <input type="${inputtype}" value="${response.text}" id="question-${currentQuestion}-${index}" name="question-${currentQuestion}"> 
                    <span class="text-label">${response.text}</span> <span class="feedback">
                </span>`;
            output.appendChild(responseLabel);
        }
    }
    return output;
}

function handleResponseSubmit(e) {
    if(!e.isTrusted) return false;
    e.preventDefault();
    
    //always storing the response(s) in an array
    let answers = [];
    let answerInputs = e.target.querySelectorAll('input');
    
    let correctAnswers = currentModule.questions[currentQuestion].responses.filter( item => item.correct == true)
    
    answerInputs.forEach( function(input) {
        if (input.type == 'text'){
            answers.push(input.value)
        } else { 
            if(input.checked) {
                answers.push(input.value)
            }
        }
    });

    let corrects = correctAnswers.map(correct => correct.text );
    let correctAnswer = answers.length === corrects.length && answers.every(function(value, index) { return value === corrects[index]});
    
    if (!correctAnswer) {

        playSound('error');

        answerInputs.forEach(function(input, index){ 
            if(!corrects.includes(input.value)){ 
                
                // only grab user-checked items; we don want to give away the answer
                if(input.checked) {
                    input.parentNode.className = 'error';   
                    input.checked = false;
                    input.disabled = "disabled";
                }
                if(input.type == 'text') {
                    input.parentNode.className = 'error';
                }
                
                let feedback = currentModule.questions[currentQuestion].responses[index].feedback;
                    input.parentNode.querySelector('.feedback').textContent = feedback;
            }
        });
        
    } else {
        playSound('score');
        awardRemainingPoints();
        nextQuestion();
    }
}

function awardRemainingPoints() {

    let points;
    points = currentModule.questions[currentQuestion].points - (currentModule.questions[currentQuestion].hint_value * questionHints.length);
    questionPoints = points;
    
    modulePoints[currentQuestion] = points;

    scoreBoard[currentModuleTitle] = {
       'score' : modulePoints
    };
    
    var score = 0;
    for(module in scoreBoard){
        score += scoreBoard[module].score.reduce((a,b) => a+b, 0);
    }
    userScore = score;

}

function displayModuleScore() {
    quizEl.className = 'module-score';

    let availableModulePoints = [];
    currentModule.questions.forEach(q => availableModulePoints.push(q.points));
    availableModulePoints = availableModulePoints.reduce((a,b) => a+b, 0);
    let modulePoints = scoreBoard[currentModuleTitle].score.reduce((a,b) => a+b, 0);
    
    let scoreBoardEl = document.querySelector('#module-score');
    scoreBoardEl.querySelector('.points').textContent = modulePoints;
    
    
    scoreBoardEl.querySelector('h2').textContent = `That's ${Math.ceil((modulePoints / availableModulePoints) * 100)}% 
     ${((modulePoints / availableModulePoints) * 100) > 75 ? '🤩 Well done!' : '🤨 Could do better..'}`;

    scoreBoardEl.querySelector('pre').textContent = currentModule.learn_more;
    
    var backbutton = scoreBoardEl.querySelector('button');
    backbutton.addEventListener('click', function(){
        // maybe transition this nicely, like 'ca-ching!' before 
        // transitioning back to module overview
        playSound('click');
        (document.querySelector('.score')).textContent = userScore;
        drawModuleOverview();
        quizEl.className = 'modules-overview';
    });
}

function nextHint() {
    if (currentModule.questions[currentQuestion] && questionHints.length < currentModule.questions[currentQuestion].hints.length) {
        // reduce points for showing hint
        questionHints.push(currentModule.questions[currentQuestion].hints[questionHints.length]);
        awardRemainingPoints();
    } else {
        clearInterval(questionTimer);
        playSound('error');
        questionHints.push('⏱ Time up.');
        awardRemainingPoints();
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

function toggleSoundFX() {
    soundFXEnabled = !soundFXEnabled;
}

function updateVolume(e) {
    const volume = e.target.value;
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => audio.volume = volume/100);

}

function playSound(sound) {
    if(soundFXEnabled) {
        document.querySelector(`audio.${sound}`).play();
    }
}

document.querySelector('#toggle-sound-fx').addEventListener('change', toggleSoundFX);
document.querySelector('.sound-fx-volume').addEventListener('mousemove', updateVolume);