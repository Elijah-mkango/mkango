const exprEl = document.getElementById('expr');
const resultEl = document.getElementById('result');
const keysEl = document.getElementById('keys');
const angleToggle = document.getElementById('angleToggle');
const studentWorkEl = document.getElementById('studentWork');

let angleMode = 'DEG';
let memory = 0;
let lastAns = 0;

// --- DEG/RAD toggle ---
angleToggle.addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  angleMode = e.target.dataset.mode;
  [...angleToggle.children].forEach(b =>
    b.classList.toggle('active', b.dataset.mode === angleMode)
  );
  preview();
});

// --- Helper math ---
const toRad = x => angleMode === 'DEG' ? (x * Math.PI / 180) : x;
const fromRad = x => angleMode === 'DEG' ? (x * 180 / Math.PI) : x;

function factorial(n) {
  if (!Number.isInteger(n) || n < 0) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// --- Safe evaluation ---
function safeEval(input) {
  let s = input
    .replace(/π/g, 'Math.PI')
    .replace(/e(?![a-zA-Z])/g, 'Math.E')
    .replace(/÷/g, '/')
    .replace(/×/g, '*')
    .replace(/−/g, '-')
    .replace(/√\s*\(/g, 'Math.sqrt(')
    .replace(/√\s*([0-9.]+)/g, 'Math.sqrt($1)')
    .replace(/x²/g, '**2')
    .replace(/x\^-1/g, '**-1')
    .replace(/\^/g, '**')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/%/g, '/100')
    .replace(/ANS/g, String(lastAns))
    .replace(/MR/g, String(memory));

  // Trig/inverse with DEG/RAD handling
  s = s
    .replace(/sin\(/g, 'SIN(')
    .replace(/cos\(/g, 'COS(')
    .replace(/tan\(/g, 'TAN(')
    .replace(/asin\(/g, 'ASIN(')
    .replace(/acos\(/g, 'ACOS(')
    .replace(/atan\(/g, 'ATAN(');

  const SIN = x => Math.sin(toRad(x));
  const COS = x => Math.cos(toRad(x));
  const TAN = x => Math.tan(toRad(x));
  const ASIN = x => fromRad(Math.asin(x));
  const ACOS = x => fromRad(Math.acos(x));
  const ATAN = x => fromRad(Math.atan(x));

  // Factorial
  s = s.replace(/([0-9]+)!/g, 'FACT($1)');
  const ENV = {Math, SIN, COS, TAN, ASIN, ACOS, ATAN, FACT: factorial};

  // EXP key
  s = s.replace(/EXP/g, '*10**');

  try {
    const val = Function('ENV', `with (ENV) { return (${s}); }`)(ENV);
    return val;
  } catch {
    return NaN;
  }
}

// --- Preview result ---
function preview() {
  const val = safeEval(exprEl.textContent || '0');
  resultEl.textContent = Number.isFinite(val) ? String(val) : 'Error';
}

// --- Append tokens ---
function append(token) {
  const t = exprEl.textContent;
  if (token === 'AC') { exprEl.textContent = ''; resultEl.textContent = '0'; return; }
  if (token === 'DEL') { exprEl.textContent = t.slice(0, -1); preview(); return; }
  if (token === '=') {
    const v = safeEval(t || '0');
    if (Number.isFinite(v)) { resultEl.textContent = String(v); lastAns = v; }
    else { resultEl.textContent = 'Error'; }
    return;
  }
  if (token === '±') {
    if (!t || /[+\-*/(]$/.test(t)) exprEl.textContent += '-';
    else exprEl.textContent = `-(${t})`;
    preview(); return;
  }
  if (token === '√') { exprEl.textContent += '√('; preview(); return; }
  if (token === 'x²') { exprEl.textContent += 'x²'; preview(); return; }
  if (token === 'x^-1') { exprEl.textContent += 'x^-1'; preview(); return; }
  if (token === 'EXP') { exprEl.textContent += 'EXP'; preview(); return; }
  if (token === 'ANS') { exprEl.textContent += 'ANS'; preview(); return; }

  // Memory keys
  if (token === 'MC') { memory = 0; return; }
  if (token === 'MR') { exprEl.textContent += 'MR'; preview(); return; }
  if (token === 'M+') {
    const v = safeEval(exprEl.textContent || '0');
    if (Number.isFinite(v)) memory += v;
    return;
  }
  if (token === 'M-') {
    const v = safeEval(exprEl.textContent || '0');
    if (Number.isFinite(v)) memory -= v;
    return;
  }

  if (token === '!') { exprEl.textContent += '!'; preview(); return; }

  const map = { '+': '+', '-': '−', '×': '×', '÷': '÷' };
  if (token in map) { exprEl.textContent += map[token]; preview(); return; }

  const funcs = new Set(['sin','cos','tan','asin','acos','atan','log','ln']);
  if (funcs.has(token)) { exprEl.textContent += `${token}(`; preview(); return; }

  if (['π','e','(',')','%','.'].includes(token)) { exprEl.textContent += token; preview(); return; }

  if (/^[0-9]$/.test(token) || token === '^') { exprEl.textContent += token; preview(); return; }

  exprEl.textContent += token;
  preview();
}

// --- Event listeners ---
keysEl.addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  append(e.target.dataset.k);
});

preview();

// --- LocalStorage for student workspace ---
if (studentWorkEl) {
  // Load saved notes
  studentWorkEl.value = localStorage.getItem('studentWork') || '';

  // Save notes on input
  studentWorkEl.addEventListener('input', () => {
    localStorage.setItem('studentWork', studentWorkEl.value);
  });
}
