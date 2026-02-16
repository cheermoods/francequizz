// ======================================================
// VARIABLES GLOBALES MINIMALES (références DOM seulement)
// ======================================================
const btnHome = document.getElementById("homeBtn");
const menuQuizType = document.getElementById("quizTypeMenu");
const menuMode = document.getElementById("modeMenu");
const menuTheme = document.getElementById("themeMenu");
const divThemeOptions = document.getElementById("themeOptions");
const containerQuiz = document.getElementById("quizContainer");
const containerResult = document.getElementById("resultContainer");

// ======================================================
// FONCTION UTILE - MELANGE UN TABLEAU
// ======================================================
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

// ======================================================
// ETAPE 1 - CHOIX DU TYPE DE QUIZ
// ======================================================
menuQuizType.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", async () => {

        // Variables locales du quiz
        let allQuestions = [];

        // Charger le fichier de questions
        await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = btn.dataset.file;
            script.onload = () => {
                if (typeof questions !== "undefined") {
                    allQuestions = questions;
                    resolve();
                } else reject("Les questions n'ont pas été chargées");
            };
            script.onerror = () => reject("Erreur lors du chargement du fichier");
            document.body.appendChild(script);
        });

        // Masquer menu type et afficher menu mode
        menuQuizType.classList.add("hidden");
        menuMode.classList.remove("hidden");
        btnHome.classList.remove("hidden");

        // ======================================================
        // ETAPE 2 - CHOIX DU MODE DE QUIZ
        // ======================================================
        const btnRandom = document.getElementById("randomBtn");
        const btnTheme = document.getElementById("themeBtn");

        btnRandom.onclick = () => {
            const quizQuestions = shuffleArray([...allQuestions]).slice(0, 40);
            startQuiz(quizQuestions);
        };

        btnTheme.onclick = () => {
            menuMode.classList.add("hidden");
            menuTheme.classList.remove("hidden");

            const categories = [...new Set(allQuestions.map(q => q.category))];
            divThemeOptions.innerHTML = "";

            categories.forEach(cat => {
                const btnCat = document.createElement("button");
                btnCat.textContent = cat;
                btnCat.onclick = () => {
                    const quizQuestions = shuffleArray(
                        allQuestions.filter(q => q.category === cat)
                    ).slice(0, 25);
                    startQuiz(quizQuestions);
                };
                divThemeOptions.appendChild(btnCat);
            });
        };

        // ======================================================
        // FONCTION PRINCIPALE - LANCER LE QUIZ
        // ======================================================
        function startQuiz(quizQuestions) {
            // Variables locales au quiz
            let currentIndex = 0;
            let score = 0;
            let timerInterval;

            // Références DOM locales
            const spanProgress = document.getElementById("progress");
            const spanTimer = document.getElementById("timer");
            const divCategory = document.getElementById("category");
            const divQuestion = document.getElementById("question");
            const divAnswers = document.getElementById("answers");
            const divExplanation = document.getElementById("explanation");
            const btnValidate = document.getElementById("validateBtn");
            const btnNext = document.getElementById("nextBtn");
            const scoreCircle = document.getElementById("scoreCircle");
            const resultCategoryDiv = document.getElementById("resultCategory");
            const resultTextDiv = document.getElementById("resultText");

            containerQuiz.classList.remove("hidden");
            menuMode.classList.add("hidden");
            menuTheme.classList.add("hidden");
            containerResult.classList.add("hidden");

            // ======================================================
            // FONCTION - AFFICHER UNE QUESTION
            // ======================================================
            function showQuestion() {
                clearInterval(timerInterval);

                if (currentIndex >= quizQuestions.length) {
                    showResult();
                    return;
                }

                const q = quizQuestions[currentIndex];

                // Mélanger les réponses pour que les bonnes ne soient pas toujours au même endroit
                let answerOrder = q.answers.map((ans, i) => i); // indices originaux
                answerOrder = shuffleArray(answerOrder);

                // Stocker mapping index -> vrai/faux pour validation
                q.shuffledAnswers = answerOrder.map(idx => ({
                    text: q.answers[idx],
                    isCorrect: q.correct.includes(idx)
                }));

                // Mettre à jour DOM
                spanProgress.textContent = `Question ${currentIndex + 1} / ${quizQuestions.length}`;
                spanTimer.textContent = `Temps restant : 20s`;
                divCategory.textContent = q.category;
                divQuestion.textContent = q.question;

                // Afficher les réponses
                divAnswers.innerHTML = "";
                q.shuffledAnswers.forEach((ansObj, idx) => {
                    const label = document.createElement("label");
                    label.innerHTML = `<input type="checkbox" value="${idx}"> ${ansObj.text}`;
                    divAnswers.appendChild(label);
                });

                divExplanation.classList.add("hidden");
                btnValidate.disabled = false;
                btnNext.disabled = true;

                startTimer();
            }

            // ======================================================
            // FONCTION - TIMER
            // ======================================================
            function startTimer() {
                let timeLeft = 20;
                timerInterval = setInterval(() => {
                    timeLeft--;
                    spanTimer.textContent = `Temps restant : ${timeLeft}s`;
                    if (timeLeft <= 0) {
                        clearInterval(timerInterval);
                        validateAnswer();
                    }
                }, 1000);
            }

            // ======================================================
            // FONCTION - VALIDER LA QUESTION
            // ======================================================
            btnValidate.onclick = validateAnswer;
            function validateAnswer() {
                const q = quizQuestions[currentIndex];
                const inputs = divAnswers.querySelectorAll("input");
                const checked = Array.from(inputs).filter(i => i.checked).map(i => parseInt(i.value));

                // Vérification sur le shuffledAnswers
                let correctIndices = [];
                q.shuffledAnswers.forEach((a, i) => { if(a.isCorrect) correctIndices.push(i); });

                if ([...correctIndices].sort().toString() === [...checked].sort().toString()) score++;

                // Coloration
                inputs.forEach((input, idx) => {
                    input.disabled = true;
                    if (q.shuffledAnswers[idx].isCorrect) input.parentElement.classList.add("correct");
                    if (checked.includes(idx) && !q.shuffledAnswers[idx].isCorrect) input.parentElement.classList.add("incorrect");
                });

                btnValidate.disabled = true;
                btnNext.disabled = false;

                divExplanation.textContent = q.explanation;
                divExplanation.classList.remove("hidden");
            }

            // ======================================================
            // BOUTON SUIVANT
            // ======================================================
            btnNext.onclick = () => {
                currentIndex++;
                showQuestion();
            };

            // ======================================================
            // FONCTION - RESULTAT FINAL
            // ======================================================
            function showResult() {
                clearInterval(timerInterval);
                containerQuiz.classList.add("hidden");
                containerResult.classList.remove("hidden");

                const firstCategory = quizQuestions[0]?.category || "";

                scoreCircle.textContent = `${score} / ${quizQuestions.length}`;
                resultCategoryDiv.textContent = `Catégorie : ${firstCategory}`;
                resultTextDiv.textContent = `Vous avez répondu correctement à ${score} questions sur ${quizQuestions.length}.`;
            }

            // ======================================================
            // BOUTON ACCUEIL - RESET
            // ======================================================
            btnHome.onclick = () => {
                clearInterval(timerInterval);
                containerQuiz.classList.add("hidden");
                containerResult.classList.add("hidden");
                menuQuizType.classList.remove("hidden");
                menuMode.classList.add("hidden");
                menuTheme.classList.add("hidden");
                btnHome.classList.add("hidden");
            };

            // ======================================================
            // LANCER PREMIERE QUESTION
            // ======================================================
            showQuestion();
        }
    });
});
