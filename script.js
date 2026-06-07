const i18n = {
    zh: { title: "2048", score: "得分", best: "最高", intro: "合并数字，冲向 2048！", restart: "新游戏", win: "你赢了！", lose: "游戏结束", keep: "再试一次" },
    en: { title: "2048", score: "SCORE", best: "BEST", intro: "Join the numbers to get to 2048!", restart: "New Game", win: "You Win!", lose: "Game Over", keep: "Try again" },
    ja: { title: "2048", score: "スコア", best: "最高", intro: "数字を合体させて2048を目指そう！", restart: "出直し", win: "あなたの勝ち！", lose: "ゲームオーバー", keep: "もう一度" }
};

let currentLang = 'zh';
let score = 0;
let bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
let eggClicks = 0;
let isCyberpunk = false;
let isMoving = false; 

let board = Array(4).fill().map(() => Array(4).fill(null));
let tileIdCounter = 0;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, type, duration) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

const sounds = {
    move: () => playTone(260, 'sine', 0.05),
    merge: () => playTone(440, 'triangle', 0.12), 
    win: () => { playTone(523.25, 'sine', 0.1); setTimeout(() => playTone(659.25, 'sine', 0.2), 100); },
    egg: () => playTone(880, 'sawtooth', 0.3)
};

function changeLang(lang) {
    currentLang = lang;
    document.getElementById('lbl-score').innerText = i18n[lang].score;
    document.getElementById('lbl-best').innerText = i18n[lang].best;
    document.getElementById('game-intro').innerText = i18n[lang].intro;
    document.getElementById('restart-btn').innerText = i18n[lang].restart;
    document.getElementById('keep-going-btn').innerText = i18n[lang].keep;
}

function triggerEasterEgg() {
    eggClicks++;
    if (eggClicks >= 5) {
        isCyberpunk = !isCyberpunk;
        sounds.egg();
        document.body.classList.toggle('cyberpunk', isCyberpunk);
        eggClicks = 0;
        updateDOM(false); // 刷新外观
    }
}

function initGame() {
    document.getElementById('tile-container').innerHTML = '';
    board = Array(4).fill().map(() => Array(4).fill(null));
    score = 0;
    isMoving = false;
    document.getElementById('game-message').style.display = 'none';
    document.getElementById('best-score').innerText = bestScore;
    
    addRandomTile();
    addRandomTile();
    updateDOM(false); 
}

function addRandomTile() {
    let emptyCells = [];
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            if(!board[r][c]) emptyCells.push({r, c});
        }
    }
    if (emptyCells.length > 0) {
        let {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[r][c] = {
            id: tileIdCounter++,
            value: Math.random() < 0.9 ? 2 : 4,
            displayValue: Math.random() < 0.9 ? 2 : 4, // 引入表现值，滑行时文字绝不跳动
            row: r, col: c,
            isNew: true, isMerged: false
        };
    }
}

// 【修复核心】渲染器：通过纯百分比数值控制平移，完美杜绝错位
function updateDOM(isPostMove = false) {
    document.getElementById('score').innerText = score;
    if(score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore);
        document.getElementById('best-score').innerText = bestScore;
    }

    const container = document.getElementById('tile-container');

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            let tileData = board[r][c];
            if (tileData) {
                let tileDOM = document.getElementById(`tile-${tileData.id}`);
                if (!tileDOM) {
                    tileDOM = document.createElement('div');
                    tileDOM.id = `tile-${tileData.id}`;
                    container.appendChild(tileDOM);
                }

                // 运动期只展示原本数值，滑行结束（isPostMove为true）才更新成新数值并附加合并膨胀动画
                if (isPostMove) {
                    tileData.displayValue = tileData.value;
                }

                tileDOM.className = `tile tile-${tileData.displayValue <= 2048 ? tileData.displayValue : 'super'}`;
                tileDOM.innerText = tileData.displayValue;

                // 【终极对齐方案】 25.75% = 22.75%(自身宽) + 3.0%(格子间隙)
                tileDOM.style.transform = `translate(calc(${c} * 113.19%), calc(${r} * 113.19%))`;

                if (isPostMove && tileData.isMerged) {
                    tileDOM.classList.add('tile-merged');
                    tileData.isMerged = false;
                }
                if (!isPostMove && tileData.isNew) {
                    tileDOM.classList.add('tile-new');
                    tileData.isNew = false;
                }
            }
        }
    }
}

function clearMergedTiles() {
    const container = document.getElementById('tile-container');
    const allDOMs = container.querySelectorAll('.tile');
    let activeIds = [];
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            if(board[r][c]) activeIds.push(`tile-${board[r][c].id}`);
        }
    }
    allDOMs.forEach(dom => {
        if (!activeIds.includes(dom.id)) dom.remove();
    });
}

function handleMove(direction) {
    if (isMoving) return; 

    let moved = false;
    let totalScoreGain = 0;
    let hasMergeHappened = false;

    let preMoveState = '';
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            if(board[r][c]) preMoveState += `${board[r][c].id}:${r}-${c},`;
        }
    }

    for (let i = 0; i < 4; i++) {
        let list = [];
        for (let j = 0; j < 4; j++) {
            let tile = null;
            if (direction === 'LEFT')  tile = board[i][j];
            if (direction === 'RIGHT') tile = board[i][3 - j];
            if (direction === 'UP')    tile = board[j][i];
            if (direction === 'DOWN')  tile = board[3 - j][i];
            if (tile) list.push(tile);
        }

        let newList = [];
        for (let k = 0; k < list.length; k++) {
            if (k < list.length - 1 && list[k].value === list[k+1].value) {
                let mergedTile = list[k];
                let targetTile = list[k+1];
                
                mergedTile.value *= 2;
                totalScoreGain += mergedTile.value;
                mergedTile.isMerged = true;
                hasMergeHappened = true;

                if (mergedTile.value === 2048) setTimeout(() => showMessage(true), 300);

                newList.push(mergedTile);
                
                let targetIndex = k; 
                let targetC = (direction === 'LEFT' || direction === 'RIGHT') ? (direction === 'LEFT' ? targetIndex : 3 - targetIndex) : i;
                let targetR = (direction === 'UP' || direction === 'DOWN') ? (direction === 'UP' ? targetIndex : 3 - targetIndex) : i;
                
                let targetDOM = document.getElementById(`tile-${targetTile.id}`);
                if (targetDOM) {
                    targetDOM.style.transform = `translate(calc(${targetC} * 113.19%), calc(${targetR} * 113.19%))`;
                }

                k++; 
            } else {
                newList.push(list[k]);
            }
        }

        for (let j = 0; j < 4; j++) {
            let targetTile = newList[j] || null;
            let finalRow = i, finalCol = j;

            if (direction === 'RIGHT') finalCol = 3 - j;
            if (direction === 'UP')   { finalRow = j; finalCol = i; }
            if (direction === 'DOWN') { finalRow = 3 - j; finalCol = i; }

            if (targetTile) {
                targetTile.row = finalRow;
                targetTile.col = finalCol;
            }

            if (direction === 'LEFT')  board[i][j] = targetTile;
            if (direction === 'RIGHT') board[i][3 - j] = targetTile;
            if (direction === 'UP')    board[j][i] = targetTile;
            if (direction === 'DOWN')  board[3 - j][i] = targetTile;
        }
    }

    let postMoveState = '';
    for(let r=0; r<4; r++) {
        for(let c=0; c<4; c++) {
            if(board[r][c]) postMoveState += `${board[r][c].id}:${r}-${c},`;
        }
    }

    if (preMoveState !== postMoveState) moved = true;

    if (moved) {
        isMoving = true; 
        score += totalScoreGain;
        if (hasMergeHappened) sounds.merge(); else sounds.move();

        // 阶段一：仅触发物理位置移动，方块数字此时绝对不跳变
        updateDOM(false); 
        
        // 阶段二：严格等待 100ms 轨迹滑行到达目的地后，再执行变字、清理垃圾DOM和弹出缩放特效
        setTimeout(() => {
            clearMergedTiles();
            addRandomTile();
            updateDOM(true); // 此时更新数字表现、追加pop动画
            isMoving = false; 
            if (checkGameOver()) showMessage(false);
        }, 100); 
    }
}

function checkGameOver() {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (!board[r][c]) return false;
            if (r < 3 && board[r][c].value === board[r+1][c].value) return false;
            if (c < 3 && board[r][c].value === board[r][c+1].value) return false;
        }
    }
    return true;
}

function showMessage(win) {
    const msgDiv = document.getElementById('game-message');
    const text = document.getElementById('status-text');
    text.innerText = win ? i18n[currentLang].win : i18n[currentLang].lose;
    msgDiv.style.display = 'flex';
    if(win) sounds.win();
}

window.addEventListener('keydown', e => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
    switch (e.key) {
        case 'ArrowLeft':  handleMove('LEFT');  break;
        case 'ArrowUp':    handleMove('UP');    break;
        case 'ArrowRight': handleMove('RIGHT'); break;
        case 'ArrowDown':  handleMove('DOWN');  break;
    }
});

let touchStartX = 0, touchStartY = 0;
window.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, {passive: true});

window.addEventListener('touchend', e => {
    let diffX = e.changedTouches[0].clientX - touchStartX;
    let diffY = e.changedTouches[0].clientY - touchStartY;
    
    if (Math.max(Math.abs(diffX), Math.abs(diffY)) > 40) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
            handleMove(diffX > 0 ? 'RIGHT' : 'LEFT');
        } else {
            handleMove(diffY > 0 ? 'DOWN' : 'UP');
        }
    }
}, {passive: true});

changeLang('zh');
initGame();