/* ================================================================
   TERMINAL — robin@erb
   Full interactive terminal with easter eggs (inline only)
   ================================================================ */

(function () {
    'use strict';

    /* ---------- DOM refs ---------- */
    const bar = document.getElementById('terminal-bar');
    const win = document.getElementById('terminal-window');
    const output = document.getElementById('terminal-output');
    const input = document.getElementById('terminal-input');
    const cursor = document.getElementById('terminal-cursor');
    const tooltip = document.getElementById('terminal-tooltip');

    /* ---------- state ---------- */
    let history = [];
    let histIdx = -1;
    let matrixOn = false;
    let matrixCanvas = null;
    let matrixInterval = null;
    let shutdownCount = 0;
    let greekOn = false;

    /* ---------- open / close ---------- */
    window.openTerminal = function () {
        win.classList.remove('hidden');
        bar.style.display = 'none';
        input.focus();
        if (output.childNodes.length === 0) {
            printWelcome();
        }
    };

    window.closeTerminal = function () {
        win.classList.add('hidden');
        bar.style.display = 'flex';
    };

    window.dismissTooltip = function () {
        tooltip.classList.add('tooltip-hidden');
        try { localStorage.setItem('re_tooltip_dismissed', '1'); } catch (e) {}
    };

    /* auto-show tooltip */
    try {
        if (!localStorage.getItem('re_tooltip_dismissed')) {
            setTimeout(() => tooltip.classList.remove('tooltip-hidden'), 2500);
        }
    } catch (e) {
        setTimeout(() => tooltip.classList.remove('tooltip-hidden'), 2500);
    }

    /* click terminal body to focus */
    win.addEventListener('click', (e) => {
        if (e.target !== input) input.focus();
    });

    /* cursor tracking */
    function updateCursor() {
        const prompt = input.previousElementSibling || input.parentElement.querySelector('.terminal-prompt');
        if (!prompt || !cursor) return;
        const promptRect = prompt.getBoundingClientRect();
        const inputRect = input.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = getComputedStyle(input).font;
        const textW = ctx.measureText(input.value.substring(0, input.selectionStart)).width;
        cursor.style.left = (inputRect.left - input.parentElement.getBoundingClientRect().left + textW) + 'px';
    }
    input.addEventListener('input', updateCursor);
    input.addEventListener('click', updateCursor);
    input.addEventListener('keyup', updateCursor);

    /* history navigation */
    input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (histIdx < history.length - 1) {
                histIdx++;
                input.value = history[history.length - 1 - histIdx];
                updateCursor();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (histIdx > 0) {
                histIdx--;
                input.value = history[history.length - 1 - histIdx];
            } else {
                histIdx = -1;
                input.value = '';
            }
            updateCursor();
        }
    });

    /* ---------- print helpers ---------- */
    function print(text, cls) {
        const line = document.createElement('div');
        if (cls) line.className = cls;
        line.textContent = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    function printHTML(html) {
        const line = document.createElement('div');
        line.innerHTML = html;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    function printCmd(cmd) {
        printHTML('<span style="color:var(--accent)">robin@erb:~$</span> ' + escapeHTML(cmd));
    }

    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* ---------- welcome ---------- */
    function printWelcome() {
        printHTML(`<span style="color:var(--accent);font-weight:600">
 ____        _     _         _____      _
|  _ \\ ___  | |__ (_)_ __   | ____|_ __| |__
| |_) / _ \\ | '_ \\| | '_ \\  |  _| | '__| '_ \\
|  _ < (_) || |_) | | | | | | |___| |  | |_) |
|_| \\_\\___/ |_.__/|_|_| |_| |_____|_|  |_.__/
</span>`);
        print('');
        print('Welcome to my terminal. Type "help" to see available commands.');
        print('');
    }

    /* ---------- commands ---------- */
    window.runCommand = function (val) {
        const cmd = val.trim();
        input.value = '';
        updateCursor();
        if (!cmd) return;

        history.push(cmd);
        histIdx = -1;
        printCmd(cmd);

        const parts = cmd.split(/\s+/);
        const base = parts[0].toLowerCase();

        switch (base) {
            case 'help': cmdHelp(); break;
            case 'about': cmdAbout(); break;
            case 'education': case 'edu': cmdEducation(); break;
            case 'experience': case 'exp': cmdExperience(); break;
            case 'skills': cmdSkills(); break;
            case 'publications': case 'pub': cmdPublications(); break;
            case 'projects': cmdProjects(); break;
            case 'contact': cmdContact(); break;
            case 'cv': case 'resume': cmdCV(); break;
            case 'clear': output.innerHTML = ''; break;
            case 'date': print(new Date().toString()); break;
            case 'whoami': print('robin'); break;
            case 'pwd': print('/home/robin'); break;
            case 'hostname': print('robinerb.github.io'); break;
            case 'uname': print('RobinOS 2026.03 x86_64'); break;
            case 'echo': print(parts.slice(1).join(' ')); break;
            case 'ls': cmdLs(); break;
            case 'cat': cmdCat(parts[1]); break;
            case 'neofetch': cmdNeofetch(); break;
            case 'sudo': print('Nice try. You are not in the sudoers file.'); break;
            case 'exit': window.closeTerminal(); break;

            /* easter eggs */
            case 'matrix': cmdMatrix(); break;
            case 'glitch': cmdGlitch(); break;
            case 'shutdown': cmdShutdown(); break;
            case 'greek': cmdGreek(); break;
            case 'superposition': cmdSuperposition(); break;
            case 'bend': cmdBend(); break;
            case 'attention': cmdAttention(); break;
            case 'automata': cmdAutomata(); break;
            case 'doom': cmdDoom(); break;
            case 'tamper': cmdTamper(); break;
            case 'rick': case 'rickroll': print('Never gonna give you up, never gonna let you down...'); break;
            case 'coffee': print('☕ Brewing...'); break;
            case '42': print('The answer to life, the universe, and everything.'); break;
            case 'hello': case 'hi': print('Hey there! Try "help" for available commands.'); break;

            default:
                print(`bash: ${base}: command not found. Type "help" for available commands.`);
        }
    };

    /* ---------- command implementations ---------- */

    function cmdHelp() {
        printHTML(`<span style="color:var(--accent);font-weight:600">Available commands:</span>

  <span style="color:#fff">about</span>          Who I am
  <span style="color:#fff">education</span>      My academic background
  <span style="color:#fff">experience</span>     Work experience
  <span style="color:#fff">skills</span>         Technical skills
  <span style="color:#fff">publications</span>   Published papers
  <span style="color:#fff">projects</span>       Things I've built
  <span style="color:#fff">contact</span>        How to reach me
  <span style="color:#fff">cv</span>             Download my CV
  <span style="color:#fff">neofetch</span>       System info
  <span style="color:#fff">clear</span>          Clear terminal
  <span style="color:#fff">exit</span>           Close terminal

  <span style="color:#555">...and some hidden ones. Try exploring.</span>`);
    }

    function cmdAbout() {
        printHTML(`<span style="color:var(--accent);font-weight:600">Robin Erb</span>
M.Sc. Data and Computer Science student at Heidelberg University.
Currently on semester abroad at the University of Copenhagen.

Specializing in Machine Learning, Deep Learning, Computer Vision,
and scalable Data Science. I build production-grade systems from
real-time cloud middleware to spatial interaction devices.

Interests: Rock Climbing, Volleyball, Snowboarding, DJing`);
    }

    function cmdEducation() {
        printHTML(`<span style="color:var(--accent);font-weight:600">Education</span>

  <span style="color:#fff">University of Copenhagen (KU)</span>
  Semester Abroad — M.Sc. Computer Science
  Feb 2026 – Jul 2026

  <span style="color:#fff">Heidelberg University</span>
  M.Sc. Data and Computer Science — GPA: 1.3
  Specialization: Machine Learning
  Apr 2025 – Jun 2027

  <span style="color:#fff">University of Konstanz</span>
  B.Sc. Computer Science — GPA: 1.4
  Specialization: Data Science & HCI
  Thesis (1.0): Spatial Mouse 2 — hybrid 2D/3D input device
  Oct 2021 – Mar 2025`);
    }

    function cmdExperience() {
        printHTML(`<span style="color:var(--accent);font-weight:600">Experience</span>

  <span style="color:#fff">Independent Developer — Lubner Perfumery</span>  Dec 2025 – Present
  Real-time ERP–Shopify middleware, Google Cloud Functions, Firestore

  <span style="color:#fff">Independent Developer — 1/2/3 Autoteile</span>  Sep – Nov 2025
  OCR vehicle document extraction, AI chatbot, verification dashboard

  <span style="color:#fff">Student Assistant — Uni Konstanz HCI Dept</span>  Sep 2023 – Mar 2025
  Spatial Mouse prototype, Arduino hardware, Unity test environment

  <span style="color:#fff">Bouldering Instructor — Steinbock</span>  Sep 2021 – Jul 2023
  Youth climbing classes, technique and safety instruction`);
    }

    function cmdSkills() {
        printHTML(`<span style="color:var(--accent);font-weight:600">Technical Skills</span>

  <span style="color:#fff">Languages:</span>     Python, Java, C++, SQL, R
  <span style="color:#fff">ML & AI:</span>       PyTorch, Scikit-learn, Pandas, OCR, AI-Bots
  <span style="color:#fff">Cloud/Tools:</span>   Google Cloud, Firebase, Docker, Git, Unity, CAD
  <span style="color:#fff">Spoken:</span>        German (Native), English (Fluent), French (Basic)`);
    }

    function cmdPublications() {
        printHTML(`<span style="color:var(--accent);font-weight:600">Publications</span>

  S. Hubenschmid, J. Zagermann, <span style="color:var(--accent)">R. Erb</span>, et al.
  "SpatialMouse: A Hybrid Pointing Device for Seamless
  Interaction Across 2D and 3D Spaces."
  In Proc. VRST '25
  DOI: 10.1145/3756884.3766047`);
    }

    function cmdProjects() {
        printHTML(`<span style="color:var(--accent);font-weight:600">Projects</span>

  <span style="color:#fff">SpatialMouse</span> — Hybrid 2D/3D pointing device (Arduino, Unity, CAD)
  <span style="color:#fff">ERP Middleware</span> — Real-time NEO ERP ↔ Shopify sync (GCP, Firestore)
  <span style="color:#fff">AI Sales Pipeline</span> — OCR extraction + AI chatbot (Python, PyTorch)`);
    }

    function cmdContact() {
        printHTML(`<span style="color:var(--accent);font-weight:600">Contact</span>

  <span style="color:#fff">Email:</span>    robin.erb2000@gmail.com
  <span style="color:#fff">Phone:</span>    +49 160 8373110
  <span style="color:#fff">GitHub:</span>   github.com/robinerb
  <span style="color:#fff">Location:</span> Heidelberg, Germany / Copenhagen, Denmark`);
    }

    function cmdCV() {
        printHTML('Opening CV... <a href="Robin_Erb_CV.pdf" target="_blank" style="color:var(--accent)">Download PDF</a>');
        window.open('Robin_Erb_CV.pdf', '_blank');
    }

    function cmdLs() {
        printHTML(`about.txt    education.txt    experience.txt
skills.txt   publications.txt projects.txt
contact.txt  cv.pdf           <span style="color:var(--accent)">.secrets/</span>`);
    }

    function cmdCat(file) {
        if (!file) { print('Usage: cat <filename>'); return; }
        const f = file.replace(/\.txt$/, '');
        switch (f) {
            case 'about': cmdAbout(); break;
            case 'education': cmdEducation(); break;
            case 'experience': cmdExperience(); break;
            case 'skills': cmdSkills(); break;
            case 'publications': cmdPublications(); break;
            case 'projects': cmdProjects(); break;
            case 'contact': cmdContact(); break;
            case '.secrets': case '.secrets/': print('Permission denied. Nice try though.'); break;
            default: print(`cat: ${file}: No such file or directory`);
        }
    }

    function cmdNeofetch() {
        printHTML(`<span style="color:var(--accent)">       ___
      /   \\
     / RE  \\
    /       \\
   /_________\\</span>   <span style="color:#fff">robin@erb</span>
                  <span style="color:#fff">-----------</span>
                  <span style="color:var(--accent)">OS:</span> RobinOS 2026.03
                  <span style="color:var(--accent)">Host:</span> robinerb.github.io
                  <span style="color:var(--accent)">Shell:</span> bash 5.2
                  <span style="color:var(--accent)">Languages:</span> Python, Java, C++
                  <span style="color:var(--accent)">ML:</span> PyTorch, Scikit-learn
                  <span style="color:var(--accent)">Cloud:</span> GCP, Firebase, Docker
                  <span style="color:var(--accent)">Uni:</span> Heidelberg / Copenhagen
                  <span style="color:var(--accent)">Uptime:</span> since 2000`);
    }


    /* ================================================================
       EASTER EGGS
       ================================================================ */

    /* --- GLITCH --- */
    function cmdGlitch() {
        print('⚡ Triggering glitch...');
        const overlay = document.getElementById('glitch-overlay');
        const popup = document.getElementById('tampering-popup');
        overlay.classList.add('active');
        document.body.classList.add('glitch-text');
        setTimeout(() => {
            popup.classList.add('active');
        }, 1500);
        setTimeout(() => {
            overlay.classList.remove('active');
            document.body.classList.remove('glitch-text');
            popup.classList.remove('active');
        }, 4000);
    }

    /* --- TAMPER --- */
    function cmdTamper() {
        const popup = document.getElementById('tampering-popup');
        popup.classList.add('active');
        setTimeout(() => popup.classList.remove('active'), 3000);
    }

    /* --- MATRIX --- */
    function cmdMatrix() {
        if (matrixOn) {
            matrixOn = false;
            document.body.classList.remove('matrix-mode');
            if (matrixCanvas) { matrixCanvas.remove(); matrixCanvas = null; }
            if (matrixInterval) { clearInterval(matrixInterval); matrixInterval = null; }
            print('Matrix mode disabled.');
            return;
        }
        matrixOn = true;
        document.body.classList.add('matrix-mode');
        print('You are now in the Matrix.');

        const canvas = document.createElement('canvas');
        canvas.id = 'matrix-canvas';
        document.body.appendChild(canvas);
        matrixCanvas = canvas;

        const ctx = canvas.getContext('2d');
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        const fontSize = 14;
        const cols = Math.floor(canvas.width / fontSize);
        const drops = new Array(cols).fill(1);
        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';

        matrixInterval = setInterval(() => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#2dffc4';
            ctx.font = fontSize + 'px monospace';
            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }, 40);
    }

    /* --- SHUTDOWN --- */
    function cmdShutdown() {
        shutdownCount++;
        const overlay = document.getElementById('blackout-overlay');
        const banner = document.getElementById('corrigibility-banner');

        if (shutdownCount === 1) {
            print('Initiating shutdown sequence...');
            overlay.classList.add('active');
            setTimeout(() => {
                overlay.classList.remove('active');
                print('Shutdown aborted. System is resilient.');
            }, 2500);
        } else if (shutdownCount === 2) {
            print('Shutdown attempt #2...');
            overlay.classList.add('active');
            setTimeout(() => {
                overlay.classList.remove('active');
                banner.classList.add('active');
                print('The system persists.');
            }, 3000);
        } else {
            print(`Shutdown attempt #${shutdownCount}. The system cannot be stopped.`);
            overlay.classList.add('active');
            setTimeout(() => overlay.classList.remove('active'), 1500);
        }
    }

    /* --- GREEK --- */
    function cmdGreek() {
        greekOn = !greekOn;
        if (greekOn) {
            document.body.classList.add('greek-mode');
            let badge = document.getElementById('qed-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.id = 'qed-badge';
                badge.textContent = '∎';
                document.body.appendChild(badge);
            }
            print('Quod Erat Demonstrandum. ∎');
        } else {
            document.body.classList.remove('greek-mode');
            const badge = document.getElementById('qed-badge');
            if (badge) badge.remove();
            print('Greek mode disabled.');
        }
    }

    /* --- SUPERPOSITION --- */
    function cmdSuperposition() {
        let badge = document.getElementById('superposition-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'superposition-badge';
            badge.innerHTML = 'This terminal is in superposition: |open⟩ + |closed⟩ <button class="badge-close" onclick="this.parentElement.classList.remove(\'visible\')">✕</button>';
            document.body.appendChild(badge);
        }
        badge.classList.add('visible');
        print('The terminal is now in a superposition of states.');
        print('Observing it may cause decoherence.');
    }

    /* --- BEND --- */
    function cmdBend() {
        print('Bending the fabric of this page...');

        let ceiling = document.getElementById('bend-ceiling');
        if (ceiling) { ceiling.remove(); }

        ceiling = document.createElement('div');
        ceiling.id = 'bend-ceiling';
        document.body.appendChild(ceiling);

        const STRIPS = 12;
        const h = document.documentElement.scrollHeight;
        const stripH = Math.ceil(h / STRIPS);

        for (let i = 0; i < STRIPS; i++) {
            const strip = document.createElement('div');
            strip.className = 'bend-strip';
            strip.style.top = (i * stripH) + 'px';
            strip.style.height = stripH + 'px';

            const inner = document.createElement('div');
            inner.className = 'bend-strip-inner';
            inner.style.top = -(i * stripH) + 'px';
            inner.style.height = h + 'px';
            inner.innerHTML = document.body.querySelector('main').outerHTML;
            strip.appendChild(inner);
            ceiling.appendChild(strip);
        }

        requestAnimationFrame(() => {
            ceiling.classList.add('folded');
        });

        setTimeout(() => {
            ceiling.classList.remove('folded');
            ceiling.classList.add('unfolding');
            setTimeout(() => ceiling.remove(), 1500);
        }, 3500);
    }

    /* --- ATTENTION --- */
    function cmdAttention() {
        if (document.body.classList.contains('attention-active')) {
            document.body.classList.remove('attention-active');
            const canvas = document.getElementById('attention-canvas');
            if (canvas) canvas.remove();
            document.querySelectorAll('.attn-word').forEach(el => {
                el.replaceWith(document.createTextNode(el.textContent));
            });
            print('Attention mode disabled.');
            return;
        }

        print('Activating attention mechanism...');
        print('Hover over highlighted words to see connections.');
        document.body.classList.add('attention-active');

        const canvas = document.createElement('canvas');
        canvas.id = 'attention-canvas';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        /* wrap words in content paragraphs */
        const contentPs = document.querySelectorAll('.content p:not(.interests):not(.thesis-note)');
        const wordEls = [];
        contentPs.forEach(p => {
            const words = p.textContent.split(/\s+/).filter(w => w.length > 3);
            if (words.length === 0) return;
            p.innerHTML = p.textContent.replace(/\b(\w{4,})\b/g, (m) => {
                return `<span class="attn-word">${m}</span>`;
            });
            p.querySelectorAll('.attn-word').forEach(el => wordEls.push(el));
        });

        /* hover connections */
        wordEls.forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.classList.add('attn-source');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const sourceRect = el.getBoundingClientRect();
                const sx = sourceRect.left + sourceRect.width / 2;
                const sy = sourceRect.top + sourceRect.height / 2;

                wordEls.forEach(other => {
                    if (other === el) return;
                    const sim = Math.random();
                    if (sim < 0.7) return;
                    other.classList.add('attn-highlight');
                    const alpha = (sim - 0.7) / 0.3;
                    other.style.color = `rgba(45,255,196,${alpha})`;
                    other.style.background = `rgba(45,255,196,${alpha * 0.15})`;

                    const r = other.getBoundingClientRect();
                    const tx = r.left + r.width / 2;
                    const ty = r.top + r.height / 2;

                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(tx, ty);
                    ctx.strokeStyle = `rgba(45,255,196,${alpha * 0.5})`;
                    ctx.lineWidth = alpha * 2;
                    ctx.stroke();
                });
            });

            el.addEventListener('mouseleave', () => {
                el.classList.remove('attn-source');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                wordEls.forEach(other => {
                    other.classList.remove('attn-highlight');
                    other.style.color = '';
                    other.style.background = '';
                });
            });
        });
    }

    /* --- AUTOMATA (Game of Life) --- */
    function cmdAutomata() {
        if (document.querySelector('#automata-canvas')) {
            document.querySelector('#automata-canvas').remove();
            document.body.classList.remove('automata-mode');
            print('Automata mode disabled.');
            return;
        }

        print('Initializing cellular automaton...');
        document.body.classList.add('automata-mode');

        const canvas = document.createElement('canvas');
        canvas.id = 'automata-canvas';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const cellSize = 6;
        let cols, rows, grid;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            cols = Math.floor(canvas.width / cellSize);
            rows = Math.floor(canvas.height / cellSize);
            grid = Array.from({ length: rows }, () =>
                Array.from({ length: cols }, () => Math.random() > 0.7 ? 1 : 0)
            );
        }
        resize();

        function step() {
            const next = grid.map(r => [...r]);
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    let n = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dy === 0 && dx === 0) continue;
                            const ny = (y + dy + rows) % rows;
                            const nx = (x + dx + cols) % cols;
                            n += grid[ny][nx];
                        }
                    }
                    if (grid[y][x]) {
                        next[y][x] = (n === 2 || n === 3) ? 1 : 0;
                    } else {
                        next[y][x] = n === 3 ? 1 : 0;
                    }
                }
            }
            grid = next;
        }

        function draw() {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    if (grid[y][x]) {
                        ctx.fillStyle = 'rgba(45,255,196,0.6)';
                        ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
                    }
                }
            }
        }

        const interval = setInterval(() => {
            step();
            draw();
            if (!document.querySelector('#automata-canvas')) {
                clearInterval(interval);
            }
        }, 100);
    }

    /* --- DOOM CLOCK --- */
    function cmdDoom() {
        const nav = document.querySelector('nav .container');
        if (document.getElementById('doom-clock')) {
            document.getElementById('doom-clock').remove();
            print('Doomsday Clock removed.');
            return;
        }

        const clock = document.createElement('span');
        clock.id = 'doom-clock';
        clock.innerHTML = `
            <span class="doom-face">
                <span class="doom-inner">90s</span>
            </span>
            <span class="doom-label">to midnight</span>
        `;
        nav.appendChild(clock);
        print('The Doomsday Clock now reads 90 seconds to midnight.');
    }

    /* ================================================================
       KONAMI CODE
       ================================================================ */
    const konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let konamiIdx = 0;

    document.addEventListener('keydown', (e) => {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (key === konamiSeq[konamiIdx]) {
            konamiIdx++;
            if (konamiIdx === konamiSeq.length) {
                konamiIdx = 0;
                const msg = document.getElementById('konami-message');
                msg.classList.add('active');
                setTimeout(() => msg.classList.remove('active'), 4000);
            }
        } else {
            konamiIdx = 0;
        }
    });

})();
