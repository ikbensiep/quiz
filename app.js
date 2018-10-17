const quizData = './data/questions.json';

// TODO:
// read quiz questions from localStorage. 
// if not, fetch and store to localStorage
const modules = [];

const modulesEl = document.querySelector('#modules-overview');
const moduleEl = document.querySelector('#module-content');

let currentModule = undefined;
let currentQuestion = 0;

fetch(quizData)
    .then(blob => blob.json())
    .then(data => {
        modules.push(...data.modules)
        quizTitle = data.title;
        drawModuleOverview();
    });


function drawModuleOverview() {
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
        btn.addEventListener('click', drawModule);
        modulesEl.appendChild(btn);
    }
}

function drawModule(e) {
    if(e.target.classList.contains('disabled')) return false;
    
    currentModule = e.target.dataset.module;
    document.querySelector('.module-title').textContent = currentModule;

    let module = modules.find(module => {
        return module.title === currentModule;
    });

    // display module intro
    moduleEl.querySelector('#module-intro').textContent = module.scenario ? module.scenario : '';

    // display module questions one by one
    for(let i=0; i<module.questions.length; i++) {
        drawQuestion(i, module)
    }

}

function drawQuestion (questionIndex, module) {
    
    let question = module.questions[questionIndex];

    let questionEl = document.querySelector('#templates .module-questions .question').cloneNode(true);
    let responseFieldSet = questionEl.querySelector('fieldset.responses');

    questionEl.querySelector('.prompt').innerHTML = `<span class="avatar">🤷</span> <blockquote>${question.prompt}</blockquote>`;

    for(response of question.responses) {
        responseFieldSet.appendChild(drawResponse(response, questionIndex));
    }

    // questionEl.appendChild(responseForm);
    document.querySelector('#module-questions').appendChild(questionEl);

}

function drawResponse(response, index) {
    
    let responseLabel = document.createElement('label');
    responseLabel.innerHTML = `<input type="radio" name="question-${index}" value="${response.text}"> ${response.text}`
    return responseLabel;
}

function nextQuestion() {
    currentQuestion++;
}

function prevQuestion() {
    currentQuestion--;
}
