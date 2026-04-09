let hamish_score = parseInt(localStorage.getItem('hamish_total_score'), 10) || 412
let joe_score = parseInt(localStorage.getItem('joe_total_score'), 10) || 430
let jamie_score = parseInt(localStorage.getItem('jamie_total_score'), 10) || 419

// Detect current page and player
const path = window.location.pathname;
const isActualPage = path.endsWith('actual.html') || path.includes('/actual.html');
const isJoePage = path.endsWith('joe.html') || path.includes('/joe.html');
const isJamiePage = path.endsWith('jamie.html') || path.includes('/jamie.html');
const player = isActualPage ? 'actual' : isJoePage ? 'joe' : isJamiePage ? 'jamie' : 'hamish';

const lineupStorageKey = `${player}_wimbledon_lineup`;
const scoreWimbledonStorageKey = isActualPage ? 'actual_wimbledon_score' : `${player}_wimbledon_score_prediction`;
const scoreOpponentStorageKey = isActualPage ? 'actual_opponent_score' : `${player}_opponent_score_prediction`;
const scoreDisplayPrefix = isActualPage ? 'Saved actual score: Wimbledon ' : 'Saved score prediction: Wimbledon ';
const lineupDisplayPrefix = isActualPage ? 'Saved actual lineup: ' : 'Saved lineup: ';

function getHomeAwayKey(i, side) {
    return isActualPage
        ? `actual_${side}_${i}_score`
        : `${player}_${side}_${i}_score_prediction`;
}

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

function capitalizeCommaSeparatedWords(value) {
    return value
        .split(',')
        .map(item => {
            const trimmed = item.trim();
            return trimmed
                ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
                : '';
        })
        .filter(Boolean)
        .join(', ');
}

const lineupForm = document.getElementById('lineup-form');
const lineupDisplay = document.getElementById('lineup-display');

// Load stored lineup for current page
const storedLineup = localStorage.getItem(lineupStorageKey);
if (storedLineup !== null) {
    if (isActualPage) {
        actual_wimbledon_lineup = storedLineup;
    } else {
        wimbledon_lineup = storedLineup;
    }
}

// Always load actual lineup for comparison
const storedActualLineup = localStorage.getItem('actual_wimbledon_lineup');
if (storedActualLineup !== null) {
    actual_wimbledon_lineup = storedActualLineup;
}

function updateLineupDisplay() {
    if (!lineupDisplay) return;
    const currentLineup = isActualPage ? actual_wimbledon_lineup : wimbledon_lineup;
    lineupDisplay.textContent = currentLineup ? lineupDisplayPrefix + currentLineup : '';
}

if (lineupForm) {
    lineupForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const lineupInput = document.getElementById('lineup-input');
        if (lineupInput) {
            const formattedLineup = capitalizeCommaSeparatedWords(lineupInput.value);
            if (isActualPage) {
                actual_wimbledon_lineup = formattedLineup;
            } else {
                wimbledon_lineup = formattedLineup;
            }
            localStorage.setItem(lineupStorageKey, formattedLineup);
            lineupInput.value = formattedLineup;
            updateLineupDisplay();
        }
    });
}

const scoreDisplay = document.getElementById('score-display');
const calculateResultDisplay = document.getElementById('calculate-result-display');

function updateScoreDisplay() {
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

function getActualScores() {
    const actualWimbledonValue = localStorage.getItem('actual_wimbledon_score');
    const actualOpponentValue = localStorage.getItem('actual_opponent_score');
    const home = [];
    const away = [];
    for (let i = 1; i <= 4; i++) {
        const h = localStorage.getItem(`actual_home_${i}_score`);
        const a = localStorage.getItem(`actual_away_${i}_score`);
        home.push(h !== null ? parseInt(h, 10) : null);
        away.push(a !== null ? parseInt(a, 10) : null);
    }
    return {
        wimbledon: actualWimbledonValue !== null ? parseInt(actualWimbledonValue, 10) : null,
        opponent: actualOpponentValue !== null ? parseInt(actualOpponentValue, 10) : null,
        home,
        away,
    };
}

function countCorrectLineupPlayers() {
    const normalize = lineup => lineup
        .split(',')
        .map(p => p.trim().toLowerCase())
        .filter(Boolean);
    const playerPlayers = normalize(wimbledon_lineup);
    const actualPlayers = normalize(actual_wimbledon_lineup);
    const actualSet = new Set(actualPlayers);
    return playerPlayers.reduce((count, p) => count + (actualSet.has(p) ? 1 : 0), 0);
}

// Load stored wimbledon/opponent scores
const storedWimbledon = localStorage.getItem(scoreWimbledonStorageKey);
const storedOpponent = localStorage.getItem(scoreOpponentStorageKey);
if (storedWimbledon !== null) {
    if (isActualPage) {
        actual_wimbledon_score = parseInt(storedWimbledon, 10) || 0;
    } else {
        wimbledon_score_prediction = parseInt(storedWimbledon, 10) || 0;
    }
}
if (storedOpponent !== null) {
    if (isActualPage) {
        actual_opponent_score = parseInt(storedOpponent, 10) || 0;
    } else {
        opponent_score_prediction = parseInt(storedOpponent, 10) || 0;
    }
}

// Load stored home/away scores
for (let i = 1; i <= 4; i++) {
    const storedHome = localStorage.getItem(getHomeAwayKey(i, 'home'));
    const storedAway = localStorage.getItem(getHomeAwayKey(i, 'away'));
    if (storedHome !== null) {
        if (isActualPage) {
            actual_home_scores[i - 1] = parseInt(storedHome, 10) || 0;
        } else {
            home_scores[i - 1] = parseInt(storedHome, 10) || 0;
        }
    }
    if (storedAway !== null) {
        if (isActualPage) {
            actual_away_scores[i - 1] = parseInt(storedAway, 10) || 0;
        } else {
            away_scores[i - 1] = parseInt(storedAway, 10) || 0;
        }
    }
}

updateLineupDisplay();
updateScoreDisplay();

const scoreForm = document.getElementById('score-form');
if (scoreForm) {
    scoreForm.addEventListener('submit', function(event) {
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
                localStorage.setItem(scoreWimbledonStorageKey, String(wimbledonScore));
                localStorage.setItem(scoreOpponentStorageKey, String(opponentScore));
            } else {
                if (isActualPage) {
                    actual_wimbledon_score = null;
                    actual_opponent_score = null;
                } else {
                    wimbledon_score_prediction = null;
                    opponent_score_prediction = null;
                }
                localStorage.removeItem(scoreWimbledonStorageKey);
                localStorage.removeItem(scoreOpponentStorageKey);
            }
        }
        // Save home/away scores for games 1-4
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
                    localStorage.setItem(getHomeAwayKey(i, 'home'), String(homeScore));
                    localStorage.setItem(getHomeAwayKey(i, 'away'), String(awayScore));
                } else {
                    if (isActualPage) {
                        actual_home_scores[i - 1] = null;
                        actual_away_scores[i - 1] = null;
                    } else {
                        home_scores[i - 1] = null;
                        away_scores[i - 1] = null;
                    }
                    localStorage.removeItem(getHomeAwayKey(i, 'home'));
                    localStorage.removeItem(getHomeAwayKey(i, 'away'));
                }
            }
        }
        updateScoreDisplay();
    });
}

function getResult(home, away) {
    if (home > away) return 'home';
    if (away > home) return 'away';
    return 'draw';
}

if (!isActualPage) {
    const calculateButton = document.getElementById('calculate-score-button');
    const addPointsButton = document.getElementById('add-points-button');
    if (calculateButton && calculateResultDisplay) {
        calculateButton.addEventListener('click', function() {
            const actual = getActualScores();
            const correctPlayers = countCorrectLineupPlayers();

            let totalPoints = 0;
            const results = [];

            // Wimbledon match
            if (actual.wimbledon !== null && actual.opponent !== null &&
                wimbledon_score_prediction !== null && opponent_score_prediction !== null) {
                if (getResult(wimbledon_score_prediction, opponent_score_prediction) === getResult(actual.wimbledon, actual.opponent)) {
                    if (wimbledon_score_prediction === actual.wimbledon && opponent_score_prediction === actual.opponent) {
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

            // Home/Away games 1-4
            for (let i = 1; i <= 4; i++) {
                const hPred = home_scores[i - 1];
                const aPred = away_scores[i - 1];
                const hActual = actual.home[i - 1];
                const aActual = actual.away[i - 1];
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

            // Lineup: 1 point per correct player, +2 bonus for perfect lineup
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

            const pointsText = `+${totalPoints} Points`;
            calculateResultDisplay.textContent = `${pointsText} — ${results.join(', ')} — ${playerText}`;

            if (addPointsButton) {
                addPointsButton.style.display = totalPoints > 0 ? 'inline-block' : 'none';
            }
        });
    }
    if (addPointsButton && calculateResultDisplay) {
        addPointsButton.addEventListener('click', function() {
            const resultText = calculateResultDisplay.textContent || '';
            const match = resultText.match(/\+([0-9]+)\s*Points/i);
            const pointsToAdd = match ? parseInt(match[1], 10) : 0;
            if (player === 'joe') {
                joe_score += pointsToAdd;
                localStorage.setItem('joe_total_score', String(joe_score));
                document.getElementById('joe-score').textContent = joe_score;
            } else if (player === 'jamie') {
                jamie_score += pointsToAdd;
                localStorage.setItem('jamie_total_score', String(jamie_score));
                document.getElementById('jamie-score').textContent = jamie_score;
            } else {
                hamish_score += pointsToAdd;
                localStorage.setItem('hamish_total_score', String(hamish_score));
                document.getElementById('hamish-score').textContent = hamish_score;
            }
        });
    }
}

// Display scores in the nav bar
document.getElementById('hamish-score').textContent = hamish_score;
document.getElementById('joe-score').textContent = joe_score;
document.getElementById('jamie-score').textContent = jamie_score;
