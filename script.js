import { db } from './firebase.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// -- Page detection --
const path = window.location.pathname;
const isActualPage = path.endsWith('actual.html') || path.includes('/actual.html');
const isJoePage = path.endsWith('joe.html') || path.includes('/joe.html');
const isJamiePage = path.endsWith('jamie.html') || path.includes('/jamie.html');
const player = isActualPage ? 'actual' : isJoePage ? 'joe' : isJamiePage ? 'jamie' : 'hamish';

const scoreDisplayPrefix = isActualPage ? 'Saved actual score: Wimbledon ' : 'Saved score prediction: Wimbledon ';
const lineupDisplayPrefix = isActualPage ? 'Saved actual lineup: ' : 'Saved lineup: ';

// -- State --
let hamish_score = 412;
let joe_score = 430;
let jamie_score = 419;

let wimbledon_lineup = '';
let wimbledon_score_prediction = null;
let opponent_score_prediction = null;
let home_scores = [null, null, null, null];
let away_scores = [null, null, null, null];

let actual_wimbledon_lineup = '';
let actual_wimbledon_score = null;
let actual_opponent_score = null;
let actual_home_scores = [null, null, null, null];
let actual_away_scores = [null, null, null, null];

// -- Display helpers --
function updateLineupDisplay() {
    const lineupDisplay = document.getElementById('lineup-display');
    if (!lineupDisplay) return;
    const currentLineup = isActualPage ? actual_wimbledon_lineup : wimbledon_lineup;
    lineupDisplay.textContent = currentLineup ? lineupDisplayPrefix + currentLineup : '';
}

function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) return;
    const currentWimbledonScore = isActualPage ? actual_wimbledon_score : wimbledon_score_prediction;
    const currentOpponentScore = isActualPage ? actual_opponent_score : opponent_score_prediction;
    const currentHomeScores = isActualPage ? actual_home_scores : home_scores;
    const currentAwayScores = isActualPage ? actual_away_scores : away_scores;
    const gamesSummary = [0, 1, 2, 3]
        .filter(i => currentHomeScores[i] !== null && currentAwayScores[i] !== null)
        .map(i => `Game ${i + 1}: ${currentHomeScores[i]}-${currentAwayScores[i]}`)
        .join(' | ');
    const suffix = gamesSummary ? ` | ${gamesSummary}` : '';
    scoreDisplay.textContent = `${scoreDisplayPrefix}${currentWimbledonScore} - Opponent ${currentOpponentScore}${suffix}`;
}

function updateNavScores() {
    document.getElementById('hamish-score').textContent = hamish_score;
    document.getElementById('joe-score').textContent = joe_score;
    document.getElementById('jamie-score').textContent = jamie_score;
}

// -- Scoring helpers --
function capitalizeCommaSeparatedWords(value) {
    return value
        .split(',')
        .map(item => {
            const trimmed = item.trim();
            return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase() : '';
        })
        .filter(Boolean)
        .join(', ');
}

function getResult(home, away) {
    if (home > away) return 'home';
    if (away > home) return 'away';
    return 'draw';
}

function countCorrectLineupPlayers() {
    const normalize = lineup => lineup.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
    const playerPlayers = normalize(wimbledon_lineup);
    const actualPlayers = normalize(actual_wimbledon_lineup);
    const actualSet = new Set(actualPlayers);
    return playerPlayers.reduce((count, p) => count + (actualSet.has(p) ? 1 : 0), 0);
}

// -- Firestore save helpers --
async function savePlayerData() {
    const data = isActualPage
        ? {
            lineup: actual_wimbledon_lineup,
            wimbledonScore: actual_wimbledon_score,
            opponentScore: actual_opponent_score,
            homeScores: actual_home_scores,
            awayScores: actual_away_scores,
        }
        : {
            lineup: wimbledon_lineup,
            wimbledonScore: wimbledon_score_prediction,
            opponentScore: opponent_score_prediction,
            homeScores: home_scores,
            awayScores: away_scores,
        };
    await setDoc(doc(db, 'playerData', player), data, { merge: true });
}

async function saveTotalScore(playerName, score) {
    await setDoc(doc(db, 'playerData', playerName), { totalScore: score }, { merge: true });
}

// -- Form setup (runs after data is loaded) --
function setupForms() {
    const lineupForm = document.getElementById('lineup-form');
    if (lineupForm) {
        lineupForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const lineupInput = document.getElementById('lineup-input');
            if (lineupInput) {
                const formattedLineup = capitalizeCommaSeparatedWords(lineupInput.value);
                if (isActualPage) {
                    actual_wimbledon_lineup = formattedLineup;
                } else {
                    wimbledon_lineup = formattedLineup;
                }
                lineupInput.value = formattedLineup;
                updateLineupDisplay();
                await savePlayerData();
            }
        });
    }

    const scoreForm = document.getElementById('score-form');
    if (scoreForm) {
        scoreForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const wimbledonInput = document.getElementById('wimbledon-score');
            const opponentInput = document.getElementById('opponent-score');
            if (wimbledonInput && opponentInput) {
                if (wimbledonInput.value !== '' && opponentInput.value !== '') {
                    const wimbledonScore = parseInt(wimbledonInput.value, 10) || 0;
                    const opponentScore = parseInt(opponentInput.value, 10) || 0;
                    if (isActualPage) {
                        actual_wimbledon_score = wimbledonScore;
                        actual_opponent_score = opponentScore;
                    } else {
                        wimbledon_score_prediction = wimbledonScore;
                        opponent_score_prediction = opponentScore;
                    }
                } else {
                    if (isActualPage) {
                        actual_wimbledon_score = null;
                        actual_opponent_score = null;
                    } else {
                        wimbledon_score_prediction = null;
                        opponent_score_prediction = null;
                    }
                }
            }

            for (let i = 1; i <= 4; i++) {
                const homeInput = document.getElementById(`home-score-${i}`);
                const awayInput = document.getElementById(`away-score-${i}`);
                if (homeInput && awayInput) {
                    if (homeInput.value !== '' && awayInput.value !== '') {
                        const homeScore = parseInt(homeInput.value, 10) || 0;
                        const awayScore = parseInt(awayInput.value, 10) || 0;
                        if (isActualPage) {
                            actual_home_scores[i - 1] = homeScore;
                            actual_away_scores[i - 1] = awayScore;
                        } else {
                            home_scores[i - 1] = homeScore;
                            away_scores[i - 1] = awayScore;
                        }
                    } else {
                        if (isActualPage) {
                            actual_home_scores[i - 1] = null;
                            actual_away_scores[i - 1] = null;
                        } else {
                            home_scores[i - 1] = null;
                            away_scores[i - 1] = null;
                        }
                    }
                }
            }

            updateScoreDisplay();
            await savePlayerData();
        });
    }

    if (!isActualPage) {
        const calculateButton = document.getElementById('calculate-score-button');
        const addPointsButton = document.getElementById('add-points-button');
        const calculateResultDisplay = document.getElementById('calculate-result-display');

        if (calculateButton && calculateResultDisplay) {
            calculateButton.addEventListener('click', function () {
                const correctPlayers = countCorrectLineupPlayers();
                let totalPoints = 0;
                const results = [];

                if (actual_wimbledon_score !== null && actual_opponent_score !== null &&
                    wimbledon_score_prediction !== null && opponent_score_prediction !== null) {
                    if (getResult(wimbledon_score_prediction, opponent_score_prediction) === getResult(actual_wimbledon_score, actual_opponent_score)) {
                        if (wimbledon_score_prediction === actual_wimbledon_score && opponent_score_prediction === actual_opponent_score) {
                            totalPoints += 4;
                            results.push('Wimbledon: Perfect Score (+4)');
                        } else {
                            totalPoints += 2;
                            results.push('Wimbledon: Correct Result (+2)');
                        }
                    } else {
                        results.push('Wimbledon: Incorrect');
                    }
                }

                for (let i = 1; i <= 4; i++) {
                    const hPred = home_scores[i - 1];
                    const aPred = away_scores[i - 1];
                    const hActual = actual_home_scores[i - 1];
                    const aActual = actual_away_scores[i - 1];
                    if (hActual !== null && aActual !== null && hPred !== null && aPred !== null) {
                        if (getResult(hPred, aPred) === getResult(hActual, aActual)) {
                            if (hPred === hActual && aPred === aActual) {
                                totalPoints += 4;
                                results.push(`Game ${i}: Perfect Score (+4)`);
                            } else {
                                totalPoints += 2;
                                results.push(`Game ${i}: Correct Result (+2)`);
                            }
                        } else {
                            results.push(`Game ${i}: Incorrect`);
                        }
                    }
                }

                totalPoints += correctPlayers;
                const perfectLineupBonus = correctPlayers === 11 ? 2 : 0;
                totalPoints += perfectLineupBonus;
                const playerText = correctPlayers === 11
                    ? `Perfect Lineup: 11/11 (+11, +2 bonus)`
                    : `${correctPlayers} correct player${correctPlayers === 1 ? '' : 's'} (+${correctPlayers})`;

                if (results.length === 0) {
                    calculateResultDisplay.textContent = `No score predictions entered yet. — ${playerText}`;
                    if (addPointsButton) addPointsButton.style.display = totalPoints > 0 ? 'inline-block' : 'none';
                    return;
                }

                calculateResultDisplay.textContent = `+${totalPoints} Points — ${results.join(', ')} — ${playerText}`;
                if (addPointsButton) addPointsButton.style.display = totalPoints > 0 ? 'inline-block' : 'none';
            });
        }

        if (addPointsButton && calculateResultDisplay) {
            addPointsButton.addEventListener('click', async function () {
                const resultText = calculateResultDisplay.textContent || '';
                const match = resultText.match(/\+([0-9]+)\s*Points/i);
                const pointsToAdd = match ? parseInt(match[1], 10) : 0;
                if (player === 'joe') {
                    joe_score += pointsToAdd;
                    document.getElementById('joe-score').textContent = joe_score;
                    await saveTotalScore('joe', joe_score);
                } else if (player === 'jamie') {
                    jamie_score += pointsToAdd;
                    document.getElementById('jamie-score').textContent = jamie_score;
                    await saveTotalScore('jamie', jamie_score);
                } else {
                    hamish_score += pointsToAdd;
                    document.getElementById('hamish-score').textContent = hamish_score;
                    await saveTotalScore('hamish', hamish_score);
                }
            });
        }
    }
}

// -- Initialise: load all data from Firestore, then set up the page --
async function init() {
    // Load total scores for all three players
    for (const p of ['hamish', 'joe', 'jamie']) {
        const snap = await getDoc(doc(db, 'playerData', p));
        if (snap.exists() && snap.data().totalScore !== undefined) {
            if (p === 'hamish') hamish_score = snap.data().totalScore;
            if (p === 'joe') joe_score = snap.data().totalScore;
            if (p === 'jamie') jamie_score = snap.data().totalScore;
        }
    }

    // Always load the actual results (needed on every page for score comparison)
    const actualSnap = await getDoc(doc(db, 'playerData', 'actual'));
    if (actualSnap.exists()) {
        const d = actualSnap.data();
        actual_wimbledon_lineup = d.lineup || '';
        actual_wimbledon_score = d.wimbledonScore ?? null;
        actual_opponent_score = d.opponentScore ?? null;
        actual_home_scores = d.homeScores || [null, null, null, null];
        actual_away_scores = d.awayScores || [null, null, null, null];
    }

    // Load the current player's predictions (not needed on the actual page)
    if (!isActualPage) {
        const playerSnap = await getDoc(doc(db, 'playerData', player));
        if (playerSnap.exists()) {
            const d = playerSnap.data();
            wimbledon_lineup = d.lineup || '';
            wimbledon_score_prediction = d.wimbledonScore ?? null;
            opponent_score_prediction = d.opponentScore ?? null;
            home_scores = d.homeScores || [null, null, null, null];
            away_scores = d.awayScores || [null, null, null, null];
        }
    }

    updateNavScores();
    updateLineupDisplay();
    updateScoreDisplay();
    setupForms();
}

init();
