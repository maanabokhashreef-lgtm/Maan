const startBtn = document.getElementById('start-btn');
const number18 = document.getElementById('number-18');
const redBalloon = document.getElementById('red-balloon');
const photoContainer = document.getElementById('photo-container');
const celebrationImg = document.getElementById('celebration-img');
const canvas = document.getElementById('fireworks-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let audioCtx;
let analyser;
let dataArray;
let isFireworksActive = false;
let isMusicPlaying = false;
let fireworksIntensity = 0.05;

// تهيئة الصوت
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.connect(audioCtx.destination);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// توليد صوت انفجار ألعاب نارية واقعي وعالي
function playFireworkSound() {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 1.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.25));
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.0);

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(1.0, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(analyser);
    noise.start();
}

// صوت فرقعة البالون
function playPopSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(1.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(analyser);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

// عزف لحن Happy Birthday متكرر
function playHappyBirthdayLoop() {
    isMusicPlaying = true;
    const notes = [
        { f: 261.63, d: 0.3 }, { f: 261.63, d: 0.3 }, { f: 293.66, d: 0.6 }, { f: 261.63, d: 0.6 }, { f: 349.23, d: 0.6 }, { f: 329.63, d: 1.2 },
        { f: 261.63, d: 0.3 }, { f: 261.63, d: 0.3 }, { f: 293.66, d: 0.6 }, { f: 261.63, d: 0.6 }, { f: 392.00, d: 0.6 }, { f: 349.23, d: 1.2 },
        { f: 261.63, d: 0.3 }, { f: 261.63, d: 0.3 }, { f: 523.25, d: 0.6 }, { f: 440.00, d: 0.6 }, { f: 349.23, d: 0.6 }, { f: 329.63, d: 0.6 }, { f: 293.66, d: 1.2 },
        { f: 466.16, d: 0.3 }, { f: 466.16, d: 0.3 }, { f: 440.00, d: 0.6 }, { f: 349.23, d: 0.6 }, { f: 392.00, d: 0.6 }, { f: 349.23, d: 1.4 }
    ];

    let currentNote = 0;

    function playNext() {
        if (!isMusicPlaying) return;
        const note = notes[currentNote];
        
        [1, 0.5].forEach((mult, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = idx === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(note.f * mult, audioCtx.currentTime);

            gain.gain.setValueAtTime(idx === 0 ? 0.4 : 0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + note.d);

            osc.connect(gain);
            gain.connect(analyser);
            osc.start();
            osc.stop(audioCtx.currentTime + note.d);
        });

        currentNote = (currentNote + 1) % notes.length;
        setTimeout(playNext, note.d * 1000);
    }

    playNext();
}

// نظام الألعاب النارية (Canvas)
let particles = [];
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.015;
    }
    update() {
        this.vx *= 0.96;
        this.vy *= 0.96;
        this.vy += 0.08;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function createFirework(playSound = true) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * (canvas.height * 0.6);
    const colors = ['#ff0055', '#ffd700', '#00f2fe', '#00ff88', '#ff00ff', '#ff7700'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 65; i++) {
        particles.push(new Particle(x, y, color));
    }
    if (playSound) playFireworkSound();
}

function animateLoop() {
    ctx.fillStyle = 'rgba(11, 12, 16, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isFireworksActive && Math.random() < fireworksIntensity) {
        createFirework(!isMusicPlaying);
    }

    particles.forEach((p, index) => {
        p.update();
        p.draw();
        if (p.alpha <= 0) particles.splice(index, 1);
    });

    if (isMusicPlaying && analyser) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        let avg = sum / dataArray.length;

        let scale = 1 + (avg / 350);
        celebrationImg.style.transform = `scale(${scale})`;

        let hue = (Date.now() / 15 + avg * 2) % 360;
        document.body.style.backgroundColor = `hsl(${hue}, 60%, ${8 + avg / 12}%)`;
        celebrationImg.style.boxShadow = `0 0 ${30 + avg}px hsl(${hue}, 100%, 50%), 0 0 ${60 + avg}px hsl(${(hue + 120) % 360}, 100%, 50%)`;
    }

    requestAnimationFrame(animateLoop);
}
animateLoop();

// إنشاء بالونات الخلفية
function spawnBackgroundBalloons(count) {
    const colors = ['#ff0055', '#00f2fe', '#ffd700', '#00ff88', '#9d00ff', '#ff7700'];
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const b = document.createElement('div');
            b.className = 'bg-balloon';
            b.style.left = Math.random() * 95 + 'vw';
            const color = colors[Math.floor(Math.random() * colors.length)];
            b.style.background = `radial-gradient(circle at 30% 30%, #fff, ${color})`;
            b.style.animationDuration = (Math.random() * 4 + 5) + 's';
            document.body.appendChild(b);
            setTimeout(() => b.remove(), 9000);
        }, i * 250);
    }
}

// إطلاق القلوب والورود حول الصورة
function startHeartsAndRoses() {
    const emojis = ['❤️', '💖', '🌹', '🌸', '🌺', '💐', '💕', '✨'];
    setInterval(() => {
        const el = document.createElement('div');
        el.className = 'floating-emoji';
        el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        
        const startX = (window.innerWidth / 2) + (Math.random() - 0.5) * 250;
        const startY = (window.innerHeight / 2) + (Math.random() - 0.5) * 250;
        el.style.left = startX + 'px';
        el.style.top = startY + 'px';

        const tx = (Math.random() - 0.5) * 600 + 'px';
        const ty = (Math.random() - 0.5) * 600 - 150 + 'px';
        el.style.setProperty('--tx', tx);
        el.style.setProperty('--ty', ty);

        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }, 180);
}

// 1. عند الضغط على زر إبدأ
startBtn.addEventListener('click', () => {
    initAudio();
    startBtn.style.pointerEvents = 'none';
    let count = 5;
    startBtn.innerText = count;

    const countdown = setInterval(() => {
        count--;
        if (count > 0) {
            startBtn.innerText = count;
        } else {
            clearInterval(countdown);
            startStageTwo();
        }
    }, 1000);
});

// 2. مرحلة الألعاب النارية ورقم 18 والبالونات (لمدة 10 ثواني)
function startStageTwo() {
    startBtn.style.display = 'none';
    number18.classList.add('show');
    
    isFireworksActive = true;
    fireworksIntensity = 0.08;
    createFirework(true);
    createFirework(true);
    spawnBackgroundBalloons(35);

    setTimeout(() => {
        number18.classList.remove('show');
        isFireworksActive = false;
        showRedBalloon();
    }, 10000);
}

// 3. صعود البالون الأحمر
function showRedBalloon() {
    redBalloon.style.display = 'flex';
    setTimeout(() => {
        redBalloon.style.bottom = '45%';
    }, 50);
}

// 4. عند الضغط على البالون الأحمر
redBalloon.addEventListener('click', () => {
    playPopSound();
    
    const rect = redBalloon.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle(centerX, centerY, '#ff0000'));
        particles.push(new Particle(centerX, centerY, '#ffd700'));
    }

    redBalloon.style.display = 'none';

    photoContainer.style.display = 'flex';
    setTimeout(() => {
        photoContainer.classList.add('pop-in');
    }, 50);

    isFireworksActive = true;
    fireworksIntensity = 0.06;
    playHappyBirthdayLoop();
    startHeartsAndRoses();
});