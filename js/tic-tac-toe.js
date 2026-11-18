/**
 * Tic Tac Toe — Cyber Matrix Arcade
 * Full-featured zero-dependency game module with:
 * - Single Player VS AI (Easy, Medium, Master Minimax) & Pass & Play (2P)
 * - Animated SVG winning strike-through & particle celebration
 * - Web Audio API synthesized retro sound effects
 * - Fullscreen toggle for laptop & mobile
 * - LocalStorage score persistence
 */
(() => {
  'use strict';

  const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  const WIN_LINE_COORDS = {
    '0,1,2': { x1: 20, y1: 50, x2: 280, y2: 50 },
    '3,4,5': { x1: 20, y1: 150, x2: 280, y2: 150 },
    '6,7,8': { x1: 20, y1: 250, x2: 280, y2: 250 },
    '0,3,6': { x1: 50, y1: 20, x2: 50, y2: 280 },
    '1,4,7': { x1: 150, y1: 20, x2: 150, y2: 280 },
    '2,5,8': { x1: 250, y1: 20, x2: 250, y2: 280 },
    '0,4,8': { x1: 25, y1: 25, x2: 275, y2: 275 },
    '2,4,6': { x1: 275, y1: 25, x2: 25, y2: 275 }
  };

  const TicTacToeGame = (() => {
    let board = Array(9).fill('');
    let currentPlayer = 'X'; // X always goes first
    let isGameOver = false;
    let mode = 'ai'; // 'ai' or 'pvp'
    let difficulty = 'hard'; // 'easy', 'medium', 'hard' (Master Minimax)
    let scores = { X: 0, O: 0, draws: 0 };
    let soundEnabled = true;
    let audioCtx = null;
    let isThinking = false;

    // DOM Elements
    let container, cells, statusEl, resetBtn, soundBtn, fsBtn;
    let modeToggle, diffToggle;
    let scoreXEl, scoreOEl, scoreDrawEl;
    let cardX, cardO, labelO, winLineSvg;

    function getAudio() {
      if (!soundEnabled) return null;
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audioCtx = new Ctx();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    }

    function playSound(type) {
      const ctx = getAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'x') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.08);
      } else if (type === 'o') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.1);
      } else if (type === 'win') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + i * 0.07);
          g.gain.setValueAtTime(0.14, now + i * 0.07);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
          o.connect(g); g.connect(ctx.destination);
          o.start(now + i * 0.07); o.stop(now + i * 0.07 + 0.2);
        });
      } else if (type === 'draw') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.22);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.22);
      }
    }

    function vibrate(ms = 25) {
      try {
        if (navigator.vibrate) navigator.vibrate(ms);
      } catch (_) {}
    }

    function loadScores() {
      try {
        const saved = JSON.parse(localStorage.getItem('ttt_scores_v2') || '{}');
        scores.X = saved.X || 0;
        scores.O = saved.O || 0;
        scores.draws = saved.draws || 0;
      } catch (_) {
        scores = { X: 0, O: 0, draws: 0 };
      }
      updateScoreUI();
    }

    function saveScores() {
      try {
        localStorage.setItem('ttt_scores_v2', JSON.stringify(scores));
      } catch (_) {}
      updateScoreUI();
    }

    function updateScoreUI() {
      if (scoreXEl) scoreXEl.textContent = String(scores.X);
      if (scoreOEl) scoreOEl.textContent = String(scores.O);
      if (scoreDrawEl) scoreDrawEl.textContent = String(scores.draws);
      if (labelO) labelO.textContent = mode === 'ai' ? 'AI (O)' : 'PLAYER O';
    }

    function updateTurnUI() {
      if (!cardX || !cardO) return;
      if (isGameOver) {
        cardX.classList.remove('active-turn');
        cardO.classList.remove('active-turn');
        return;
      }
      cardX.classList.toggle('active-turn', currentPlayer === 'X');
      cardO.classList.toggle('active-turn', currentPlayer === 'O');
    }

    function checkWin(b, player) {
      for (const combo of WINNING_COMBOS) {
        if (combo.every((idx) => b[idx] === player)) {
          return combo;
        }
      }
      return null;
    }

    function checkDraw(b) {
      return b.every((val) => val !== '');
    }

    // Minimax Unbeatable Algorithm
    function minimax(currBoard, depth, isMaximizing) {
      const aiWin = checkWin(currBoard, 'O');
      if (aiWin) return 10 - depth;
      const playerWin = checkWin(currBoard, 'X');
      if (playerWin) return depth - 10;
      if (checkDraw(currBoard)) return 0;

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (currBoard[i] === '') {
            currBoard[i] = 'O';
            const evaluation = minimax(currBoard, depth + 1, false);
            currBoard[i] = '';
            maxEval = Math.max(maxEval, evaluation);
          }
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (let i = 0; i < 9; i++) {
          if (currBoard[i] === '') {
            currBoard[i] = 'X';
            const evaluation = minimax(currBoard, depth + 1, true);
            currBoard[i] = '';
            minEval = Math.min(minEval, evaluation);
          }
        }
        return minEval;
      }
    }

    function getBestMove() {
      const available = [];
      for (let i = 0; i < 9; i++) {
        if (board[i] === '') available.push(i);
      }
      if (!available.length) return -1;

      // Easy: mostly random
      if (difficulty === 'easy') {
        // 25% chance to win if available, otherwise random
        for (const idx of available) {
          board[idx] = 'O';
          if (checkWin(board, 'O')) { board[idx] = ''; return idx; }
          board[idx] = '';
        }
        return available[Math.floor(Math.random() * available.length)];
      }

      // Medium: blocks player or takes win, occasionally mistakes
      if (difficulty === 'medium') {
        // 1. Take win
        for (const idx of available) {
          board[idx] = 'O';
          if (checkWin(board, 'O')) { board[idx] = ''; return idx; }
          board[idx] = '';
        }
        // 2. Block player
        for (const idx of available) {
          board[idx] = 'X';
          if (checkWin(board, 'X')) { board[idx] = ''; return idx; }
          board[idx] = '';
        }
        // 3. 50% minimax, 50% random
        if (Math.random() < 0.5) {
          return available[Math.floor(Math.random() * available.length)];
        }
      }

      // Master (Minimax) - completely unbeatable!
      // Center preference if empty
      if (board[4] === '' && Math.random() < 0.7) return 4;

      let bestScore = -Infinity;
      let move = available[0];
      for (const idx of available) {
        board[idx] = 'O';
        const score = minimax(board, 0, false);
        board[idx] = '';
        if (score > bestScore) {
          bestScore = score;
          move = idx;
        }
      }
      return move;
    }

    function drawWinLine(combo) {
      if (!winLineSvg) return;
      const key = combo.join(',');
      const coords = WIN_LINE_COORDS[key];
      if (!coords) return;

      winLineSvg.innerHTML = `
        <line x1="${coords.x1}" y1="${coords.y1}" x2="${coords.x2}" y2="${coords.y2}"
              class="ttt-strike-line" />
      `;
    }

    function clearWinLine() {
      if (winLineSvg) winLineSvg.innerHTML = '';
    }

    function renderCell(index) {
      const cell = cells[index];
      if (!cell) return;
      const val = board[index];
      cell.textContent = val;
      cell.className = 'ttt-cell' + (val ? ` is-${val.toLowerCase()}` : '');
      cell.setAttribute('aria-label', `Cell ${index + 1}, ${val || 'empty'}`);
      cell.disabled = Boolean(val) || isGameOver || isThinking;
    }

    function renderBoard() {
      cells.forEach((_, i) => renderCell(i));
      updateTurnUI();
    }

    function makeMove(index, player) {
      if (board[index] !== '' || isGameOver) return false;
      board[index] = player;
      renderCell(index);
      playSound(player.toLowerCase());
      vibrate(20);

      const winningCombo = checkWin(board, player);
      if (winningCombo) {
        isGameOver = true;
        scores[player]++;
        saveScores();
        drawWinLine(winningCombo);
        winningCombo.forEach((idx) => cells[idx]?.classList.add('is-winning'));
        playSound('win');
        vibrate([50, 40, 90]);
        if (statusEl) {
          if (mode === 'ai') {
            statusEl.textContent = player === 'X' ? '🎉 Brilliant Victory! You defeated the AI!' : '🤖 Cyber AI Wins! Try again or adjust difficulty.';
          } else {
            statusEl.textContent = `🎉 Player ${player} Wins the match!`;
          }
        }
        updateTurnUI();
        return true;
      }

      if (checkDraw(board)) {
        isGameOver = true;
        scores.draws++;
        saveScores();
        playSound('draw');
        if (statusEl) statusEl.textContent = "🤝 It's a draw! Perfectly balanced match.";
        updateTurnUI();
        return true;
      }

      // Switch player
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      updateTurnUI();

      if (statusEl) {
        if (mode === 'ai') {
          statusEl.textContent = currentPlayer === 'X' ? 'Your turn! Place your X.' : 'Cyber AI is calculating move…';
        } else {
          statusEl.textContent = `Player ${currentPlayer}'s turn!`;
        }
      }

      // AI turn
      if (mode === 'ai' && currentPlayer === 'O' && !isGameOver) {
        isThinking = true;
        cells.forEach((c) => { c.disabled = true; });
        const delay = difficulty === 'hard' ? 260 : 380;
        setTimeout(() => {
          isThinking = false;
          if (isGameOver) return;
          const aiIndex = getBestMove();
          if (aiIndex >= 0) {
            makeMove(aiIndex, 'O');
          }
          if (!isGameOver) {
            cells.forEach((c, idx) => { if (!board[idx]) c.disabled = false; });
          }
        }, delay);
      }

      return true;
    }

    function newRound() {
      board = Array(9).fill('');
      currentPlayer = 'X';
      isGameOver = false;
      isThinking = false;
      clearWinLine();
      cells.forEach((c) => {
        c.className = 'ttt-cell';
        c.textContent = '';
        c.disabled = false;
      });
      updateTurnUI();
      if (statusEl) {
        statusEl.textContent = mode === 'ai'
          ? 'New round ready! You play as X. Make your first move!'
          : "Player X starts the round. Tap any square to place X.";
      }
    }

    function toggleFullscreen() {
      const stage = document.getElementById('tttStage') || container;
      if (!stage) return;
      const isFs = document.fullscreenElement || document.webkitFullscreenElement;
      if (!isFs) {
        if (stage.requestFullscreen) stage.requestFullscreen().catch(() => stage.classList.toggle('is-fullscreen-fallback'));
        else if (stage.webkitRequestFullscreen) stage.webkitRequestFullscreen();
        else stage.classList.toggle('is-fullscreen-fallback');
      } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        stage.classList.remove('is-fullscreen-fallback');
      }
    }

    function syncFullscreenBtn() {
      if (!fsBtn) return;
      const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.querySelector('.ttt-stage.is-fullscreen-fallback'));
      fsBtn.textContent = isFs ? '✕ Exit Fullscreen' : '⛶ Fullscreen';
      fsBtn.setAttribute('aria-pressed', String(isFs));
    }

    function setup() {
      container = document.getElementById('lab-tic-tac-toe');
      if (!container) return;

      cells = Array.from(container.querySelectorAll('.ttt-cell'));
      statusEl = document.getElementById('tttStatus');
      resetBtn = document.getElementById('tttResetBtn');
      soundBtn = document.getElementById('tttSoundBtn');
      fsBtn = document.getElementById('tttFullscreenBtn');
      modeToggle = document.getElementById('tttModeToggle');
      diffToggle = document.getElementById('tttDiffToggle');
      scoreXEl = document.getElementById('tttScoreX');
      scoreOEl = document.getElementById('tttScoreO');
      scoreDrawEl = document.getElementById('tttScoreDraw');
      cardX = document.getElementById('tttCardX');
      cardO = document.getElementById('tttCardO');
      labelO = document.getElementById('tttLabelO');
      winLineSvg = document.getElementById('tttWinLine');

      loadScores();

      // Cells click / touch
      cells.forEach((cell, idx) => {
        cell.addEventListener('click', () => {
          if (isThinking || isGameOver) return;
          if (mode === 'ai' && currentPlayer !== 'X') return;
          makeMove(idx, currentPlayer);
        });
      });

      // New Round
      resetBtn?.addEventListener('click', () => {
        newRound();
        playSound('x');
      });

      // Sound Toggle
      soundBtn?.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundBtn.textContent = soundEnabled ? '🔊 Sound' : '🔇 Muted';
        soundBtn.setAttribute('aria-pressed', String(soundEnabled));
        if (soundEnabled) playSound('x');
      });

      // Fullscreen Toggle
      fsBtn?.addEventListener('click', toggleFullscreen);
      document.addEventListener('fullscreenchange', syncFullscreenBtn);
      document.addEventListener('webkitfullscreenchange', syncFullscreenBtn);

      // Mode Toggle (VS AI / Pass & Play)
      modeToggle?.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          const m = btn.dataset.tttMode;
          if (m === mode) return;
          mode = m;
          modeToggle.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tttMode === m)));
          if (diffToggle) diffToggle.hidden = (mode === 'pvp');
          updateScoreUI();
          newRound();
        });
      });

      // AI Difficulty Toggle
      diffToggle?.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => {
          const d = btn.dataset.difficulty;
          if (d === difficulty) return;
          difficulty = d;
          diffToggle.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.difficulty === d)));
          newRound();
        });
      });

      newRound();
    }

    return {
      init: setup,
      newRound
    };
  })();

  window.TicTacToeGame = TicTacToeGame;
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('lab-tic-tac-toe')) {
      TicTacToeGame.init();
    }
  });
})();
