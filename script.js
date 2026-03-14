document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Tabs ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const views = document.querySelectorAll('.view');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.currentTarget;
            tabBtns.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            targetBtn.classList.add('active');
            document.getElementById(targetBtn.dataset.target).classList.add('active');
        });
    });

    // --- Coin Toss Logic ---
    const coin = document.getElementById('coin');
    const flipBtn = document.getElementById('flipBtn');
    const resultText = document.getElementById('result');
    const coinScene = document.getElementById('coinScene');
    
    let isFlipping = false;
    let currentRotation = 0;
    const FLIP_DURATION = 3000;

    function flipCoin() {
        if (isFlipping) return;
        isFlipping = true;
        flipBtn.disabled = true;
        resultText.classList.remove('animate-pop');
        resultText.textContent = "FLIPPING...";
        resultText.style.color = "var(--text-muted)";
        resultText.style.textShadow = "none";
        
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        const isHeads = (randomBuffer[0] % 2) === 0;
        
        const spins = Math.floor(Math.random() * 6) + 5;
        const degreesPerSpin = 180;
        let targetRotation = currentRotation + (spins * degreesPerSpin);
        
        const remainder = targetRotation % 360;
        if (isHeads && remainder !== 0) {
            targetRotation += 180;
        } else if (!isHeads && remainder !== 180) {
            targetRotation += 180;
        }
        
        currentRotation = targetRotation;
        coin.style.transform = `rotateY(${currentRotation}deg)`;
        
        setTimeout(() => {
            resultText.textContent = isHeads ? "IT'S HEADS!" : "IT'S TAILS!";
            resultText.style.color = isHeads ? "#ffdf00" : "#e2e8f0";
            resultText.style.textShadow = isHeads ? "0 0 25px rgba(255,223,0,0.8)" : "0 0 25px rgba(226,232,240,0.8)";
            resultText.classList.add('animate-pop');
            isFlipping = false;
            flipBtn.disabled = false;
        }, FLIP_DURATION);
    }

    flipBtn.addEventListener('click', flipCoin);
    coinScene.addEventListener('click', flipCoin);
    coinScene.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            flipCoin();
        }
    });

    // --- Cricket Scorer Logic ---
    let match = {
        overs: 0,
        currInning: 0,
        teams: []
    };
    
    let tempTeamA = "";
    let tempTeamB = "";
    let tempOvers = 0;

    const startMatchBtn = document.getElementById('startMatchBtn');
    const backToSetupBtn = document.getElementById('backToSetupBtn');
    const batTeamABtn = document.getElementById('batTeamABtn');
    const batTeamBBtn = document.getElementById('batTeamBBtn');
    const newMatchBtn = document.getElementById('newMatchBtn');

    startMatchBtn.addEventListener('click', () => {
        tempTeamA = document.getElementById('teamA').value.trim() || 'Team A';
        tempTeamB = document.getElementById('teamB').value.trim() || 'Team B';
        tempOvers = parseInt(document.getElementById('overs').value);
        
        if (!tempOvers || tempOvers <= 0) {
            alert("Please enter a valid number of overs!");
            return;
        }

        document.getElementById('setupScreen').classList.add('hidden');
        
        batTeamABtn.textContent = tempTeamA;
        batTeamBBtn.textContent = tempTeamB;
        document.getElementById('choiceScreen').classList.remove('hidden');
    });

    backToSetupBtn.addEventListener('click', () => {
        document.getElementById('choiceScreen').classList.add('hidden');
        document.getElementById('setupScreen').classList.remove('hidden');
    });

    function initializeMatch(battingTeam, bowlingTeam) {
        match = {
            overs: tempOvers,
            currInning: 0,
            teams: [
                { name: battingTeam, runs: 0, wickets: 0, balls: 0, batters: {}, bowlers: {} },
                { name: bowlingTeam, runs: 0, wickets: 0, balls: 0, batters: {}, bowlers: {} }
            ]
        };

        document.getElementById('choiceScreen').classList.add('hidden');
        document.getElementById('scoringScreen').classList.remove('hidden');
        document.getElementById('targetDiv').classList.add('hidden');
        
        updateScoreboard();
    }

    batTeamABtn.addEventListener('click', () => initializeMatch(tempTeamA, tempTeamB));
    batTeamBBtn.addEventListener('click', () => initializeMatch(tempTeamB, tempTeamA));

    newMatchBtn.addEventListener('click', () => {
        document.getElementById('resultScreen').classList.add('hidden');
        document.getElementById('setupScreen').classList.remove('hidden');
        document.getElementById('strikerIn').value = '';
        document.getElementById('nonStrikerIn').value = '';
        document.getElementById('bowlerIn').value = '';
    });

    // Score Action Handlers
    document.querySelectorAll('.run-btn').forEach(btn => {
        btn.addEventListener('click', () => handleDelivery(parseInt(btn.dataset.run), 'run'));
    });
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => handleDelivery(btn.dataset.action, 'action'));
    });

    function handleDelivery(val, type) {
        const batTeam = match.teams[match.currInning];
        const bowlTeam = match.teams[1 - match.currInning];
        
        const strikerStr = document.getElementById('strikerIn').value.trim();
        const nonStrikerStr = document.getElementById('nonStrikerIn').value.trim();
        const bowlerStr = document.getElementById('bowlerIn').value.trim();
        
        if (!strikerStr || !nonStrikerStr || !bowlerStr) {
            alert("Please enter Striker, Non-Striker and Bowler names!");
            return;
        }
        if (strikerStr.toLowerCase() === nonStrikerStr.toLowerCase()) {
            alert("Striker and Non-Striker cannot be the same person!");
            return;
        }

        // Initialize players
        if (!batTeam.batters[strikerStr]) batTeam.batters[strikerStr] = { runs: 0, balls: 0, out: false };
        if (!batTeam.batters[nonStrikerStr]) batTeam.batters[nonStrikerStr] = { runs: 0, balls: 0, out: false };
        if (!bowlTeam.bowlers[bowlerStr]) bowlTeam.bowlers[bowlerStr] = { runs: 0, balls: 0, wickets: 0 };

        let isExtra = false;
        let runsScored = 0;

        if (type === 'run') {
            runsScored = val;
            batTeam.runs += runsScored;
            batTeam.balls++;
            batTeam.batters[strikerStr].runs += runsScored;
            batTeam.batters[strikerStr].balls++;
            bowlTeam.bowlers[bowlerStr].runs += runsScored;
            bowlTeam.bowlers[bowlerStr].balls++;
        } else if (type === 'action') {
            if (val === 'W') {
                batTeam.balls++;
                batTeam.wickets++;
                batTeam.batters[strikerStr].balls++;
                batTeam.batters[strikerStr].out = true;
                bowlTeam.bowlers[bowlerStr].balls++;
                bowlTeam.bowlers[bowlerStr].wickets++;
                document.getElementById('strikerIn').value = '';
            } else if (val === 'WD' || val === 'NB') {
                isExtra = true;
                batTeam.runs += 1;
                bowlTeam.bowlers[bowlerStr].runs += 1;
            }
        }

        updateScoreboard();

        let inningsOver = false;
        if (batTeam.wickets >= 10 || batTeam.balls >= match.overs * 6) inningsOver = true;
        if (match.currInning === 1 && batTeam.runs > bowlTeam.runs) inningsOver = true;

        if (inningsOver) {
            if (match.currInning === 0) {
                setTimeout(() => {
                    alert(`Innings Break! Target is ${batTeam.runs + 1}`);
                    match.currInning = 1;
                    document.getElementById('strikerIn').value = '';
                    document.getElementById('nonStrikerIn').value = '';
                    document.getElementById('bowlerIn').value = '';
                    document.getElementById('targetDiv').classList.remove('hidden');
                    document.getElementById('targetScore').textContent = batTeam.runs + 1;
                    updateScoreboard();
                }, 100);
                return;
            } else {
                setTimeout(() => showResult(), 100);
                return;
            }
        }

        if (!isExtra && type === 'run' && runsScored % 2 !== 0) {
            swapBatters();
        }

        if (!isExtra && batTeam.balls % 6 === 0) {
            swapBatters();
            document.getElementById('bowlerIn').value = '';
        }
    }

    function swapBatters() {
        const s = document.getElementById('strikerIn');
        const ns = document.getElementById('nonStrikerIn');
        const temp = s.value;
        s.value = ns.value;
        ns.value = temp;
    }

    function updateScoreboard() {
        const batTeam = match.teams[match.currInning];
        document.getElementById('battingTeamName').textContent = batTeam.name + ' BATTING';
        document.getElementById('scoreText').textContent = `${batTeam.runs} / ${batTeam.wickets}`;
        document.getElementById('oversText').textContent = formatOvers(batTeam.balls);
        document.getElementById('totalOversText').textContent = match.overs;
    }

    function formatOvers(balls) {
        return Math.floor(balls / 6) + '.' + (balls % 6);
    }

    function showResult() {
        document.getElementById('scoringScreen').classList.add('hidden');
        document.getElementById('resultScreen').classList.remove('hidden');
        
        const tA = match.teams[0];
        const tB = match.teams[1];
        let winner = "";
        if (tA.runs > tB.runs) winner = `${tA.name} WON BY ${tA.runs - tB.runs} RUNS!`;
        else if (tB.runs > tA.runs) winner = `${tB.name} WON BY ${10 - tB.wickets} WICKETS!`;
        else winner = "MATCH TIED!";
        
        document.getElementById('winnerText').textContent = winner;
        
        let bestPlayer = "None";
        let maxPoints = -1;
        let pomStats = "";
        
        match.teams.forEach(team => {
            let players = new Set([...Object.keys(team.batters), ...Object.keys(team.bowlers)]);
            players.forEach(p => {
                let pts = 0;
                let runs = 0;
                let wkts = 0;
                if (team.batters[p]) {
                    pts += team.batters[p].runs;
                    runs = team.batters[p].runs;
                }
                if (team.bowlers[p]) {
                    pts += team.bowlers[p].wickets * 20;
                    wkts = team.bowlers[p].wickets;
                }
                
                if (pts > maxPoints) {
                    maxPoints = pts;
                    bestPlayer = p;
                    pomStats = `${runs} runs & ${wkts} wickets`;
                }
            });
        });
        
        document.getElementById('pomText').textContent = `PLAYER OF THE MATCH: ${bestPlayer} (${pomStats})`;
        
        let html = '';
        match.teams.forEach((team, idx) => {
            const bowlTeam = match.teams[1 - idx];
            html += `<h4>${team.name} Innings (${team.runs}/${team.wickets} in ${formatOvers(team.balls)} ov)</h4>`;
            
            html += `<table class="score-table"><tr><th>Batter</th><th>R</th><th>B</th></tr>`;
            for (let b in team.batters) {
                const stat = team.batters[b];
                html += `<tr><td>${b} <small style="color:var(--text-muted)">${stat.out ? '(out)' : '(not out)'}</small></td><td>${stat.runs}</td><td>${stat.balls}</td></tr>`;
            }
            html += `</table>`;
            
            html += `<table class="score-table"><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th></tr>`;
            for (let b in bowlTeam.bowlers) {
                const stat = bowlTeam.bowlers[b];
                html += `<tr><td>${b}</td><td>${formatOvers(stat.balls)}</td><td>${stat.runs}</td><td>${stat.wickets}</td></tr>`;
            }
            html += `</table>`;
        });
        
        document.getElementById('scorecardsContainer').innerHTML = html;
    }
});