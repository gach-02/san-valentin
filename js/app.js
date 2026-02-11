const correctDate = "11-10-2025";
const aiPhotos = new Set([1, 4, 5]);
const selected = new Set();

// ====== CONFIG RETO CANCION ======
const SNIPPET_SECONDS = 9;
const SNIPPET_MS = SNIPPET_SECONDS * 1000;

function setFullscreenMode(isOn) {
  document.body.classList.toggle("fs-mode", isOn);
}

function goToScreen(n) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(`screen-${n}`);
  if (!el) return;
  el.classList.add("active");
  setFullscreenMode(el.classList.contains("full-screen"));

  if (n === 6) startConfetti();
  else stopConfetti();
}

function updatePickCount() {
  const el = document.getElementById("pickCount");
  if (el) el.textContent = String(selected.size);
}

function resetSelectionUI() {
  selected.clear();
  document.querySelectorAll(".photoBtn").forEach(btn => btn.classList.remove("selected"));
  updatePickCount();
  const fb = document.getElementById("imageFeedback");
  if (fb) fb.textContent = "";
}

function normalizeText(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ✅ SIEMPRE EMPEZAR EN INTRO */
window.addEventListener("load", () => {
  goToScreen(0);
  updatePickCount();
  resetBubbles();
});

// INTRO -> FECHA
document.getElementById("startBtn").addEventListener("click", () => goToScreen(1));

// FECHA
document.getElementById("dateBtn").addEventListener("click", () => {
  const input = document.getElementById("dateInput").value.trim();
  const feedback = document.getElementById("dateFeedback");
  const dateRegex = /^\d{2}-\d{2}-\d{4}$/;

  if (!input) {
    feedback.textContent = "Escribe una fecha 🙂";
    feedback.style.color = "#c0392b";
    return;
  }
  if (!dateRegex.test(input)) {
    feedback.textContent = "Formato incorrecto (dd-mm-yyyy)";
    feedback.style.color = "#c0392b";
    return;
  }
  if (input === correctDate) {
    feedback.textContent = "Correcto ❤️ Aquí empezó todo.";
    feedback.style.color = "#27ae60";
    setTimeout(() => {
      resetSelectionUI();
      goToScreen(2);
    }, 700);
  } else {
    feedback.textContent = "Mmm… ese no fue el día 😉";
    feedback.style.color = "#c0392b";
  }
});

// REAL O IA
document.querySelectorAll(".photoBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = Number(btn.dataset.id);

    if (selected.has(id)) {
      selected.delete(id);
      btn.classList.remove("selected");
    } else {
      if (selected.size >= 3) return;
      selected.add(id);
      btn.classList.add("selected");
    }
    updatePickCount();
  });
});

document.getElementById("checkAiBtn").addEventListener("click", () => {
  const feedback = document.getElementById("imageFeedback");

  if (selected.size !== 3) {
    feedback.textContent = "Selecciona exactamente 3 fotos 🙂";
    feedback.style.color = "#c0392b";
    return;
  }

  const ok =
    selected.size === aiPhotos.size &&
    [...selected].every(x => aiPhotos.has(x));

  if (ok) {
    feedback.textContent = "¡SÍ! 😂 Has pillado las de IA. Muy bien 😌";
    feedback.style.color = "#27ae60";
    setTimeout(() => goToScreen(3), 900);
  } else {
    feedback.textContent = "Casi 😜 Hay alguna real/IA que se te ha colado. Prueba otra vez.";
    feedback.style.color = "#c0392b";
  }
});

document.getElementById("backBtn").addEventListener("click", () => goToScreen(1));

// ===== CANCION =====
const songAudio = document.getElementById("songAudio");
const playSnippetBtn = document.getElementById("playSnippetBtn");
const songFeedback = document.getElementById("songFeedback");

let snippetTimeout = null;

function stopSnippet() {
  if (snippetTimeout) {
    clearTimeout(snippetTimeout);
    snippetTimeout = null;
  }
  songAudio.pause();
  try { songAudio.currentTime = 0; } catch (_) {}
  playSnippetBtn.disabled = false;
}

playSnippetBtn.addEventListener("click", async () => {
  stopSnippet();
  playSnippetBtn.disabled = true;
  songFeedback.textContent = "";

  try {
    songAudio.currentTime = 0;
    await songAudio.play();
    snippetTimeout = setTimeout(() => {
      songAudio.pause();
      playSnippetBtn.disabled = false;
    }, SNIPPET_MS);
  } catch (e) {
    playSnippetBtn.disabled = false;
    songFeedback.textContent = "No se pudo reproducir 😅 Revisa el mp3/ruta.";
    songFeedback.style.color = "#c0392b";
  }
});

document.getElementById("songCheckBtn").addEventListener("click", () => {
  const user = normalizeText(document.getElementById("songInput").value);

  if (!user) {
    songFeedback.textContent = "Escribe un nombre 🙂";
    songFeedback.style.color = "#c0392b";
    return;
  }

  const hasTitle =
    user.includes("cuando no era cantante") ||
    (user.includes("no era cantante") && user.includes("cuando"));

  if (hasTitle) {
    songFeedback.textContent = "SÍ ❤️ Esa es. Siempre será nuestra.";
    songFeedback.style.color = "#27ae60";
    stopSnippet();
    setTimeout(() => goToScreen(4), 900);
  } else {
    songFeedback.textContent = "Mmm… no 😜 escucha otra vez y prueba.";
    songFeedback.style.color = "#c0392b";
  }
});

document.getElementById("backTo2Btn").addEventListener("click", () => {
  stopSnippet();
  resetSelectionUI();
  goToScreen(2);
});

document.getElementById("backTo3Btn").addEventListener("click", () => goToScreen(3));

/* ==========================================
   FLAPPY: TU CÓDIGO EXISTENTE
   Solo cambio: cuando gana -> ir a burbujas (screen-5)
   ========================================== */

const canvas = document.getElementById("flappyCanvas");
const ctx = canvas.getContext("2d");

const startGameBtn = document.getElementById("startGameBtn");
const restartGameBtn = document.getElementById("restartGameBtn");
const scoreEl = document.getElementById("score");
const gameFeedback = document.getElementById("gameFeedback");

let raf = null;

const GOAL = 5;
const GRAVITY = 0.45;
const JUMP = -7.5;
const PIPE_SPEED = 2.6;
const PIPE_GAP = 150;
const PIPE_WIDTH = 60;
const PIPE_SPAWN_MS = 1400;

let gameRunning = false;

let bird, pipes, score, lastSpawn, lastTime;

function resetGame() {
  bird = { x: 80, y: canvas.height / 2, r: 14, vy: 0 };
  pipes = [];
  score = 0;
  lastSpawn = 0;
  lastTime = performance.now();
  scoreEl.textContent = "0";
  gameFeedback.textContent = "";
  gameFeedback.style.color = "#333";
}

function spawnPipe() {
  const margin = 40;
  const gapCenterMin = margin + PIPE_GAP / 2;
  const gapCenterMax = canvas.height - margin - PIPE_GAP / 2;
  const gapCenter = gapCenterMin + Math.random() * (gapCenterMax - gapCenterMin);
  pipes.push({ x: canvas.width + 10, gapY: gapCenter, passed: false });
}

function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < (cr * cr);
}

function endGame(msg) {
  gameRunning = false;
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  gameFeedback.textContent = msg;
  gameFeedback.style.color = "#c0392b";
}

function winGame() {
  gameRunning = false;
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  gameFeedback.textContent = "¡GOOOOL! 😈 Has llegado a 5. Vamos a la prueba final 🫧";
  gameFeedback.style.color = "#27ae60";

  setTimeout(() => {
    resetBubbles();
    goToScreen(5);
  }, 1100);
}

function jump() {
  if (!gameRunning) return;
  bird.vy = JUMP;
}

function update(dt) {
  bird.vy += GRAVITY;
  bird.y += bird.vy;

  if (bird.y - bird.r < 0) {
    bird.y = bird.r;
    bird.vy = 0;
  }
  if (bird.y + bird.r > canvas.height) {
    endGame("💥 Te has caído… reinicia y dale otra vez 😏");
    return;
  }

  lastSpawn += dt;
  if (lastSpawn >= PIPE_SPAWN_MS) {
    lastSpawn = 0;
    spawnPipe();
  }

  for (const p of pipes) {
    p.x -= PIPE_SPEED;

    const topH = p.gapY - PIPE_GAP / 2;
    const botY = p.gapY + PIPE_GAP / 2;
    const botH = canvas.height - botY;

    const hitTop = circleRectCollide(bird.x, bird.y, bird.r, p.x, 0, 60, topH);
    const hitBot = circleRectCollide(bird.x, bird.y, bird.r, p.x, botY, 60, botH);
    if (hitTop || hitBot) {
      endGame("💥 Crash… demasiado dopamina 😈 (reinicia)");
      return;
    }

    if (!p.passed && p.x + 60 < bird.x) {
      p.passed = true;
      score += 1;
      scoreEl.textContent = String(score);
      if (score >= GOAL) { winGame(); return; }
    }
  }

  pipes = pipes.filter(p => p.x + 60 > -20);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const p of pipes) {
    const topH = p.gapY - PIPE_GAP / 2;
    const botY = p.gapY + PIPE_GAP / 2;
    ctx.fillRect(p.x, 0, 60, topH);
    ctx.fillRect(p.x, botY, 60, canvas.height - botY);
  }

  ctx.beginPath();
  ctx.arc(80, bird.y, bird.r, 0, Math.PI * 2);
  ctx.fill();

  if (!gameRunning) {
    ctx.globalAlpha = 0.9;
    ctx.fillText("Pulsa Empezar y salta tocando la pantalla", 20, 40);
    ctx.globalAlpha = 1;
  }
}

function loop(now) {
  const dt = now - lastTime;
  lastTime = now;

  if (gameRunning) update(dt);
  draw();

  raf = requestAnimationFrame(loop);
}

canvas.addEventListener("mousedown", (e) => { e.preventDefault(); jump(); });
canvas.addEventListener("touchstart", (e) => { e.preventDefault(); jump(); }, { passive: false });

startGameBtn.addEventListener("click", () => {
  resetGame();
  gameRunning = true;
  lastTime = performance.now();
  if (!raf) raf = requestAnimationFrame(loop);
  gameFeedback.textContent = "Dale 😈 ¡A por 5!";
  gameFeedback.style.color = "#333";
});

restartGameBtn.addEventListener("click", () => {
  resetGame();
  gameRunning = true;
  lastTime = performance.now();
  if (!raf) raf = requestAnimationFrame(loop);
  gameFeedback.textContent = "Reiniciado 😏 ¡A por 5!";
  gameFeedback.style.color = "#333";
});

resetGame();
draw();

/* =======================
   BURBUJAS (12)
   ======================= */
let winningBubble = 1;

const bubbleFeedback = document.getElementById("bubbleFeedback");
const bubbles = Array.from(document.querySelectorAll(".bubble"));

function resetBubbles() {
  winningBubble = 1 + Math.floor(Math.random() * 12); // ✅ 1..12
  if (bubbleFeedback) {
    bubbleFeedback.textContent = "";
    bubbleFeedback.style.color = "#333";
  }
  bubbles.forEach(b => {
    b.disabled = false;
    b.classList.remove("bad", "good");
    b.textContent = "🫧";
  });
}

bubbles.forEach(btn => {
  btn.addEventListener("click", () => {
    const id = Number(btn.dataset.b);

    if (id === winningBubble) {
      btn.classList.add("good");
      btn.textContent = "💖";
      bubbleFeedback.textContent = "¡Esa era! 😈 Vamooos al regalo…";
      bubbleFeedback.style.color = "#27ae60";
      bubbles.forEach(b => b.disabled = true);
      setTimeout(() => goToScreen(6), 900);
    } else {
      btn.classList.add("bad");
      btn.disabled = true;
      btn.textContent = "💥";
      bubbleFeedback.textContent = "No 😏 prueba otra…";
      bubbleFeedback.style.color = "#c0392b";
    }
  });
});

document.getElementById("resetBubblesBtn").addEventListener("click", () => {
  resetBubbles();
  bubbleFeedback.textContent = "Va, otra vez 😈";
  bubbleFeedback.style.color = "#333";
});

document.getElementById("backTo4Btn").addEventListener("click", () => goToScreen(4));

/* =======================
   FINAL + CONFETI
   ======================= */
const confettiCanvas = document.getElementById("confettiCanvas");
const cctx = confettiCanvas.getContext("2d");

let confettiPieces = [];
let confettiRaf = null;

function resizeConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfetti);

function startConfetti() {
  resizeConfetti();
  confettiPieces = [];
  for (let i = 0; i < 140; i++) {
    confettiPieces.push({
      x: Math.random() * confettiCanvas.width,
      y: -Math.random() * confettiCanvas.height,
      r: 3 + Math.random() * 4,
      vx: -1 + Math.random() * 2,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: -0.1 + Math.random() * 0.2,
      a: 0.7 + Math.random() * 0.3
    });
  }
  if (!confettiRaf) confettiRaf = requestAnimationFrame(confettiLoop);
}

function stopConfetti() {
  if (confettiRaf) cancelAnimationFrame(confettiRaf);
  confettiRaf = null;
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

function confettiLoop() {
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  for (const p of confettiPieces) {
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;

    if (p.y > confettiCanvas.height + 20) {
      p.y = -20;
      p.x = Math.random() * confettiCanvas.width;
    }
    if (p.x < -20) p.x = confettiCanvas.width + 20;
    if (p.x > confettiCanvas.width + 20) p.x = -20;

    cctx.save();
    cctx.globalAlpha = p.a;
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot);
    cctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
    cctx.restore();
  }

  confettiRaf = requestAnimationFrame(confettiLoop);
}

document.getElementById("finalBtn").addEventListener("click", () => {
  goToScreen(0);
});
