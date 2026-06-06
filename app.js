const translations = {
  en: {
    eyebrow: "Tiny puzzle, big combo",
    title: "2048 Triple Tile",
    language: "Language",
    soundOn: "Sound",
    soundOff: "Muted",
    score: "Score",
    best: "Best",
    newGame: "New Game",
    howTitle: "How to play",
    howText: "Use arrow keys or swipe. Merge matching tiles to reach 2048.",
    sparkTitle: "Spark",
    sparkText: "Make a 512 tile to wake up the board.",
    continue: "Continue",
    restart: "Restart",
    winTitle: "You made 2048!",
    winText: "The board is glowing. Keep climbing?",
    overTitle: "Game over",
    overText: "No moves left. Give it another run.",
    neon: "Neon board unlocked at 512.",
    lucky: "Lucky 8! A bonus tile slipped in.",
    ready: "Ready for a fresh board."
  },
  zh: {
    eyebrow: "小棋盘，大连击",
    title: "2048 三语方块",
    language: "语言",
    soundOn: "音效",
    soundOff: "静音",
    score: "分数",
    best: "最高",
    newGame: "新游戏",
    howTitle: "玩法",
    howText: "用方向键或滑动操作。合并相同数字，冲到 2048。",
    sparkTitle: "彩蛋",
    sparkText: "合成 512，棋盘会被点亮。",
    continue: "继续",
    restart: "重开",
    winTitle: "合成 2048！",
    winText: "棋盘已经发光了，要继续冲高分吗？",
    overTitle: "游戏结束",
    overText: "没有可移动的格子了，再来一局。",
    neon: "512 彩蛋已触发：霓虹棋盘开启。",
    lucky: "幸运 8！偷偷送你一个奖励方块。",
    ready: "新棋盘已准备好。"
  },
  ja: {
    eyebrow: "小さな盤面、大きな連鎖",
    title: "2048 トリプルタイル",
    language: "言語",
    soundOn: "効果音",
    soundOff: "ミュート",
    score: "スコア",
    best: "ベスト",
    newGame: "新規ゲーム",
    howTitle: "遊び方",
    howText: "矢印キーまたはスワイプで操作。同じ数字を合わせて 2048 を目指します。",
    sparkTitle: "おまけ",
    sparkText: "512 タイルを作ると盤面が目覚めます。",
    continue: "続ける",
    restart: "最初から",
    winTitle: "2048 達成！",
    winText: "盤面が光っています。さらに上を目指しますか？",
    overTitle: "ゲーム終了",
    overText: "動かせる場所がありません。もう一度どうぞ。",
    neon: "512 のおまけ解放：ネオン盤面になりました。",
    lucky: "ラッキー 8！ボーナスタイルが入りました。",
    ready: "新しい盤面の準備ができました。"
  }
};

const boardElement = document.querySelector("#board");
const messageElement = document.querySelector("#message");
const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#bestScore");
const languageSelect = document.querySelector("#languageSelect");
const soundButton = document.querySelector("#soundButton");
const toast = document.querySelector("#toast");
const confettiCanvas = document.querySelector("#confetti");
const confettiCtx = confettiCanvas.getContext("2d");

const size = 4;
let grid = [];
let score = 0;
let bestScore = Number(localStorage.getItem("triple2048Best") || 0);
let language = localStorage.getItem("triple2048Language") || "en";
let soundEnabled = localStorage.getItem("triple2048Sound") !== "off";
let audioContext;
let audioReady = false;
let gameWon = false;
let neonUnlocked = localStorage.getItem("triple2048Neon") === "yes";
let touchStart = null;
let confettiBits = [];
let tileId = 0;

function t(key) {
  return translations[language][key] || translations.en[key] || key;
}

function createEmptyGrid() {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function setupCells() {
  boardElement.innerHTML = "";
  for (let i = 0; i < size * size; i += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    boardElement.appendChild(cell);
  }
}

function randomEmptyCell() {
  const empty = [];
  grid.forEach((row, y) => {
    row.forEach((value, x) => {
      if (!value) empty.push({ x, y });
    });
  });
  return empty[Math.floor(Math.random() * empty.length)];
}

function addTile(value = Math.random() < 0.9 ? 2 : 4, forcedCell) {
  const cell = forcedCell || randomEmptyCell();
  if (!cell) return;
  grid[cell.y][cell.x] = { value, id: `tile-${tileId += 1}`, x: cell.x, isNew: true, merged: false };
}

function startGame() {
  grid = createEmptyGrid();
  score = 0;
  gameWon = false;
  hideMessage();
  addTile();
  addTile();
  updateScore();
  render();
  showToast(t("ready"));
  playSound("start");
}

function updateScore() {
  scoreElement.textContent = score;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("triple2048Best", String(bestScore));
  }
  bestScoreElement.textContent = bestScore;
}

function render() {
  document.body.classList.toggle("neon", neonUnlocked);
  boardElement.querySelectorAll(".tile").forEach((tile) => tile.remove());
  const gap = Number(getComputedStyle(document.documentElement).getPropertyValue("--gap").replace("px", ""));
  const tileSize = Number(getComputedStyle(document.documentElement).getPropertyValue("--tile-size").replace("px", ""));

  grid.forEach((row, y) => {
    row.forEach((tile) => {
      if (!tile) return;
      const tileElement = document.createElement("div");
      tileElement.className = `tile tile-${tile.value > 2048 ? "super" : tile.value}`;
      if (tile.isNew) tileElement.classList.add("new");
      if (tile.merged) tileElement.classList.add("merge");
      tileElement.textContent = tile.value;
      tileElement.style.transform = `translate(${gap + tile.x * (tileSize + gap)}px, ${gap + y * (tileSize + gap)}px)`;
      tileElement.setAttribute("role", "gridcell");
      tileElement.setAttribute("aria-label", String(tile.value));
      boardElement.appendChild(tileElement);
      tile.isNew = false;
      tile.merged = false;
    });
  });
}

function normalizePositions() {
  grid.forEach((row) => {
    row.forEach((tile, x) => {
      if (tile) tile.x = x;
    });
  });
}

function slideLine(line) {
  const compact = line.filter(Boolean);
  const result = [];
  let moved = compact.length !== line.length;
  let gained = 0;

  for (let i = 0; i < compact.length; i += 1) {
    const current = compact[i];
    const next = compact[i + 1];
    if (next && current.value === next.value) {
      current.value *= 2;
      current.merged = true;
      gained += current.value;
      result.push(current);
      i += 1;
      moved = true;
    } else {
      result.push(current);
    }
  }

  while (result.length < size) result.push(null);
  if (!moved) {
    moved = result.some((tile, index) => tile !== line[index]);
  }
  return { line: result, moved, gained };
}

function rotateGrid(direction) {
  const next = createEmptyGrid();
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (direction === "left") next[y][x] = grid[y][x];
      if (direction === "right") next[y][x] = grid[y][size - 1 - x];
      if (direction === "up") next[y][x] = grid[x][y];
      if (direction === "down") next[y][x] = grid[size - 1 - x][y];
    }
  }
  return next;
}

function unrotateGrid(rotated, direction) {
  const next = createEmptyGrid();
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (direction === "left") next[y][x] = rotated[y][x];
      if (direction === "right") next[y][size - 1 - x] = rotated[y][x];
      if (direction === "up") next[x][y] = rotated[y][x];
      if (direction === "down") next[size - 1 - x][y] = rotated[y][x];
    }
  }
  return next;
}

function move(direction) {
  if (!["left", "right", "up", "down"].includes(direction)) return;
  const rotated = rotateGrid(direction);
  let moved = false;
  let gained = 0;

  for (let y = 0; y < size; y += 1) {
    const slide = slideLine(rotated[y]);
    rotated[y] = slide.line;
    moved = moved || slide.moved;
    gained += slide.gained;
  }

  if (!moved) {
    playSound("blocked");
    return;
  }

  grid = unrotateGrid(rotated, direction);
  normalizePositions();
  score += gained;
  updateScore();
  maybeUnlockEasterEggs(gained);
  addTile();
  render();
  playSound(gained ? "merge" : "move");
  checkState();
}

function maybeUnlockEasterEggs(gained) {
  const highest = Math.max(...grid.flat().filter(Boolean).map((tile) => tile.value), 0);
  if (highest >= 512 && !neonUnlocked) {
    neonUnlocked = true;
    localStorage.setItem("triple2048Neon", "yes");
    showToast(t("neon"));
    burstConfetti(70);
  }

  if (gained >= 128 && score > 0 && score % 888 === 0) {
    const empty = randomEmptyCell();
    if (empty) {
      addTile(8, empty);
      showToast(t("lucky"));
      playSound("bonus");
    }
  }
}

function hasMoves() {
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const tile = grid[y][x];
      if (!tile) return true;
      if (grid[y][x + 1]?.value === tile.value) return true;
      if (grid[y + 1]?.[x]?.value === tile.value) return true;
    }
  }
  return false;
}

function checkState() {
  const highest = Math.max(...grid.flat().filter(Boolean).map((tile) => tile.value), 0);
  if (highest >= 2048 && !gameWon) {
    gameWon = true;
    showMessage(t("winTitle"), t("winText"));
    burstConfetti(120);
    playSound("win");
  } else if (!hasMoves()) {
    showMessage(t("overTitle"), t("overText"));
    playSound("over");
  }
}

function showMessage(title, text) {
  messageTitle.textContent = title;
  messageText.textContent = text;
  messageElement.classList.remove("hidden");
}

function hideMessage() {
  messageElement.classList.add("hidden");
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), 1900);
}

function setLanguage(nextLanguage) {
  language = nextLanguage;
  localStorage.setItem("triple2048Language", language);
  document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  soundButton.querySelector("[data-i18n]").textContent = soundEnabled ? t("soundOn") : t("soundOff");
  languageSelect.value = language;
}

function setSound(enabled) {
  soundEnabled = enabled;
  localStorage.setItem("triple2048Sound", enabled ? "on" : "off");
  soundButton.setAttribute("aria-pressed", String(enabled));
  soundButton.querySelector("[data-i18n]").textContent = enabled ? t("soundOn") : t("soundOff");
  if (enabled && audioReady) playSound("start");
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playSound(type) {
  if (!soundEnabled || !audioReady) return;
  const context = getAudioContext();
  const notes = {
    start: [392, 494],
    move: [260],
    merge: [330, 520],
    blocked: [110],
    bonus: [660, 880, 990],
    win: [523, 659, 784, 1046],
    over: [220, 165]
  }[type] || [300];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type === "blocked" || type === "over" ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, context.currentTime + index * 0.055);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + index * 0.055 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + index * 0.055 + 0.14);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + index * 0.055);
    oscillator.stop(context.currentTime + index * 0.055 + 0.16);
  });
}

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth * devicePixelRatio;
  confettiCanvas.height = window.innerHeight * devicePixelRatio;
  confettiCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function burstConfetti(count) {
  resizeConfetti();
  const colors = ["#f05d3b", "#0e8f8f", "#ffbe0b", "#3a86ff", "#8338ec"];
  for (let i = 0; i < count; i += 1) {
    confettiBits.push({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.25,
      vx: (Math.random() - 0.5) * 9,
      vy: Math.random() * -7 - 2,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 90
    });
  }
  requestAnimationFrame(drawConfetti);
}

function drawConfetti() {
  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  confettiBits = confettiBits.filter((bit) => bit.life > 0);
  confettiBits.forEach((bit) => {
    bit.x += bit.vx;
    bit.y += bit.vy;
    bit.vy += 0.22;
    bit.life -= 1;
    confettiCtx.globalAlpha = Math.max(bit.life / 90, 0);
    confettiCtx.fillStyle = bit.color;
    confettiCtx.fillRect(bit.x, bit.y, bit.size, bit.size * 0.58);
  });
  confettiCtx.globalAlpha = 1;
  if (confettiBits.length) requestAnimationFrame(drawConfetti);
}

document.addEventListener("keydown", (event) => {
  const directions = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down"
  };
  if (!directions[event.key]) return;
  event.preventDefault();
  audioReady = true;
  move(directions[event.key]);
});

document.querySelector("#newGameButton").addEventListener("click", startGame);
document.querySelector("#restartButton").addEventListener("click", startGame);
document.querySelector("#continueButton").addEventListener("click", hideMessage);
languageSelect.addEventListener("change", (event) => setLanguage(event.target.value));
soundButton.addEventListener("click", () => setSound(!soundEnabled));

document.querySelector(".board-wrap").addEventListener("pointerdown", (event) => {
  audioReady = true;
  touchStart = { x: event.clientX, y: event.clientY };
});

document.querySelector(".board-wrap").addEventListener("pointerup", (event) => {
  if (!touchStart) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    move(dx > 0 ? "right" : "left");
  } else {
    move(dy > 0 ? "down" : "up");
  }
});

window.addEventListener("resize", () => {
  render();
  resizeConfetti();
});

setupCells();
setLanguage(language);
setSound(soundEnabled);
updateScore();
if (neonUnlocked) showToast(t("neon"));
startGame();
