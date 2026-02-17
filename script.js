// ======================================================
// VARIABLES GLOBALES
// ======================================================
const btnHome = document.getElementById("homeBtn");
const btnHistory = document.getElementById("historyBtn");

const menuQuizType = document.getElementById("quizTypeMenu");
const menuMode = document.getElementById("modeMenu");
const menuTheme = document.getElementById("themeMenu");
const divThemeOptions = document.getElementById("themeOptions");

const containerQuiz = document.getElementById("quizContainer");
const containerResult = document.getElementById("resultContainer");

let allQuestions = [];
let currentQuizQuestions = [];
let lifeModeActive = false;
let timerInterval = null;

// ======================================================
// MELANGE TABLEAU
// ======================================================
function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

// ======================================================
// RESET INTERFACE COMPLET
// ======================================================
function resetUI() {
    clearInterval(timerInterval);

    containerQuiz.classList.add("hidden");
    containerResult.classList.add("hidden");
    menuMode.classList.add("hidden");
    menuTheme.classList.add("hidden");
    menuQuizType.classList.remove("hidden");

}

// ======================================================
// CHARGER FICHIER QUESTIONS
// ======================================================
async function loadQuestions(file) {
    return new Promise((resolve, reject) => {

        const script = document.createElement("script");
        script.src = file;

        script.onload = () => {
            if (window.questions) {
                const data = window.questions;
                delete window.questions;
                script.remove();
                resolve(data);
            } else {
                reject("Questions introuvables dans " + file);
            }
        };

        script.onerror = () => reject("Erreur chargement " + file);

        document.body.appendChild(script);
    });
}

// ======================================================
// ETAPE 1 - TYPE DE QUIZ
// ======================================================
menuQuizType.querySelectorAll("button[data-file]").forEach(btn => {

    btn.onclick = async () => {

        try {
            allQuestions = await loadQuestions(btn.dataset.file);
        } catch (e) {
            alert(e);
            return;
        }

        menuQuizType.classList.add("hidden");
        menuMode.classList.remove("hidden");
        btnHome.classList.remove("hidden");
    };
});

// ======================================================
// MODE VIE
// ======================================================
document.getElementById("lifeModeBtn").onclick = async () => {

    const files = [
        "data/questionspluriannuel.js",
        "data/questionsresident.js"
    ];

    let global = [];

    try {
        for (let file of files) {
            const q = await loadQuestions(file);
            global = global.concat(q);
        }
    } catch (e) {
        alert(e);
        return;
    }

    // 🔥 IMPORTANT : cacher TOUS les menus
    menuQuizType.classList.add("hidden");
    menuMode.classList.add("hidden");
    menuTheme.classList.add("hidden");
    containerResult.classList.add("hidden");

    btnHome.classList.remove("hidden");

    lifeModeActive = true;
    currentQuizQuestions = shuffleArray(global).slice(0, 50);

    startQuiz();
};


// ======================================================
// MODE ALEATOIRE
// ======================================================
document.getElementById("randomBtn").onclick = () => {

    lifeModeActive = false;
    currentQuizQuestions = shuffleArray(allQuestions).slice(0, 40);

    startQuiz();
};

// ======================================================
// MODE THEME
// ======================================================
document.getElementById("themeBtn").onclick = () => {

    menuMode.classList.add("hidden");
    menuTheme.classList.remove("hidden");

    const categories = [...new Set(allQuestions.map(q => q.category))];

    divThemeOptions.innerHTML = "";

    categories.forEach(cat => {

        const btn = document.createElement("button");
        btn.textContent = cat;

        btn.onclick = () => {

            lifeModeActive = false;
            currentQuizQuestions = shuffleArray(
                allQuestions.filter(q => q.category === cat)
            ).slice(0, 25);

            startQuiz();
        };

        divThemeOptions.appendChild(btn);
    });
};

// ======================================================
// HISTORIQUE
// ======================================================
btnHistory.onclick = () => {

    const history = JSON.parse(localStorage.getItem("quizHistory")) || [];

    if (history.length === 0) {
        alert("Aucun historique.");
        return;
    }

    let text = "Historique des scores :\n\n";

    history.forEach((h, i) => {
        text += `${i + 1}. ${h.date} - ${h.score}\n`;
    });

    alert(text);
};

// ======================================================
// QUIZ PRINCIPAL
// ======================================================
function startQuiz() {

    menuMode.classList.add("hidden");
    menuTheme.classList.add("hidden");
    containerResult.classList.add("hidden");
    containerQuiz.classList.remove("hidden");

    let currentIndex = 0;
    let score = 0;
    let errors = 0;
    const maxErrors = 5;

    const menuQuizType = document.getElementById("quizTypeMenu");
    const spanProgress = document.getElementById("progress");
    const spanTimer = document.getElementById("timer");
    const divCategory = document.getElementById("category");
    const divQuestion = document.getElementById("question");
    const divAnswers = document.getElementById("answers");
    const divExplanation = document.getElementById("explanation");
    const btnValidate = document.getElementById("validateBtn");
    const btnNext = document.getElementById("nextBtn");
    const flag = document.getElementById("flagProgress");

    function showQuestion() {

        clearInterval(timerInterval);

        if (currentIndex >= currentQuizQuestions.length) {
            showResult();
            return;
        }

        const q = currentQuizQuestions[currentIndex];

        flag.style.left =
            (currentIndex / currentQuizQuestions.length) * 100 + "%";

        const order = shuffleArray(q.answers.map((_, i) => i));

        q.shuffled = order.map(i => ({
            text: q.answers[i],
            correct: q.correct.includes(i)
        }));

        spanProgress.textContent =
            `Question ${currentIndex + 1} / ${currentQuizQuestions.length}`;

        spanTimer.textContent = "Temps restant : 20s";

        divCategory.textContent = q.category;
        divQuestion.textContent = q.question;

        divAnswers.innerHTML = "";

        q.shuffled.forEach((a, i) => {
            const label = document.createElement("label");
            label.innerHTML =
                `<input type="checkbox" value="${i}"> ${a.text}`;
            divAnswers.appendChild(label);
        });

        btnValidate.disabled = false;
        btnNext.disabled = true;
        divExplanation.classList.add("hidden");

        startTimer();
    }

    function startTimer() {

        let time = 20;

        timerInterval = setInterval(() => {
            time--;
            spanTimer.textContent = `Temps restant : ${time}s`;

            if (time <= 0) {
                clearInterval(timerInterval);
                validate();
            }
        }, 1000);
    }

    btnValidate.onclick = validate;

    function validate() {

        const q = currentQuizQuestions[currentIndex];
        const inputs = divAnswers.querySelectorAll("input");

        const checked = [...inputs]
            .filter(i => i.checked)
            .map(i => parseInt(i.value));

        const correct = q.shuffled
            .map((a, i) => a.correct ? i : null)
            .filter(i => i !== null);

        if (checked.sort().toString() === correct.sort().toString()) {
            score++;
        } else if (lifeModeActive) {
            errors++;
            if (errors >= maxErrors) {
                showResult();
                return;
            }
        }

        inputs.forEach((input, i) => {
            input.disabled = true;

            if (q.shuffled[i].correct)
                input.parentElement.classList.add("correct");
            else if (checked.includes(i))
                input.parentElement.classList.add("incorrect");
        });

        btnValidate.disabled = true;
        btnNext.disabled = false;

        divExplanation.textContent = q.explanation;
        divExplanation.classList.remove("hidden");
    }

    btnNext.onclick = () => {
        currentIndex++;
        showQuestion();
    };

    function showResult() {
        // Arrêter le timer
        clearInterval(timerInterval);

        // Masquer le quiz et afficher le conteneur résultat
        containerQuiz.classList.add("hidden");
        containerResult.classList.remove("hidden");

        // Afficher le score
        const scoreText = `${score} / ${currentQuizQuestions.length}`;
        document.getElementById("scoreCircle").textContent = scoreText;

        // Afficher la catégorie ou mode vie
        document.getElementById("resultCategory").textContent =
            lifeModeActive ? "Mode Vie ❤️" : "Quiz classique";

        // =========================
        // ENREGISTRER L'HISTORIQUE
        // =========================
        let history = JSON.parse(localStorage.getItem("quizHistory")) || [];

        // Ajouter le résultat actuel
        history.push({
            date: new Date().toLocaleString(),
            score: scoreText,
            mode: lifeModeActive ? "Mode Vie ❤️" : "Quiz classique"
        });

        localStorage.setItem("quizHistory", JSON.stringify(history));

        // Mettre à jour l'état du bouton "Supprimer historique"
        updateClearButtonState();

        // =========================
        // MESSAGE MOTIVATION
        // =========================
        document.getElementById("resultText").textContent =
            score >= currentQuizQuestions.length * 0.7
                ? "🔥 Excellent travail !"
                : "💪 Continuez !";

        // =========================
        // BOUTON "Retour à l'accueil"
        // =========================
        const backBtn = document.getElementById("backHomeAfterResult");

        // Vérifier que le bouton existe
        if (backBtn) {
            backBtn.onclick = () => {
                containerResult.classList.add("hidden");
                menuQuizType.classList.remove("hidden"); // revenir au menu principal
            };
        }
    }

    showQuestion();
}

// ======================================================
// HOME (UNE SEULE FOIS)
// ======================================================
btnHome.onclick = resetUI;

// ======================================================
// NETTOYAGE HISTORIQUE
// ======================================================

const clearBtn = document.getElementById("clearHistoryBtn");

function hasHistory() {
    const history = localStorage.getItem("quizHistory");

    if (!history) return false;

    try {
        const parsed = JSON.parse(history);
        return Array.isArray(parsed) && parsed.length > 0;
    } catch (e) {
        return false;
    }
}

function updateClearButtonState() {
    if (hasHistory()) {
        clearBtn.disabled = false;
        clearBtn.style.opacity = "1";
        clearBtn.title = "Supprimer l'historique";
    } else {
        clearBtn.disabled = true;
        clearBtn.style.opacity = "0.4";
        clearBtn.title = "Aucun historique";
    }
}
updateClearButtonState();

clearBtn.onclick = () => {

    if (!hasHistory()) {
        alert("Aucun historique à supprimer.");
        return;
    }

    const confirmDelete = confirm("Supprimer tout l'historique ?");

    if (!confirmDelete) return;

    localStorage.removeItem("quizHistory");

    alert("Historique supprimé ✅");

    updateClearButtonState();
};

// Vérifie au chargement
updateClearButtonState();

