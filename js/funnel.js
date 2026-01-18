// ===== State =====
let answers = {
    zipCode: '',
    propertyValue: null,
    mortgageBalance: null,
    goal: null,
    credit: null
};
let calculatedCash = 0;
let currentStep = 1;

// ===== DOM Elements =====
const resultPage = document.getElementById('resultPage');
const blurOverlay = document.getElementById('blurOverlay');
const quizModal = document.getElementById('quizModal');
const progressFill = document.getElementById('modalProgressFill');
const zipInput = document.getElementById('zipInput');
const zipSubmitBtn = document.getElementById('zipSubmitBtn');
const confettiCanvas = document.getElementById('confettiCanvas');
const ctx = confettiCanvas.getContext('2d');

// ===== Progress Map =====
const progressMap = {
    1: 0,
    2: 12,
    3: 25,
    4: 40,
    5: 55,
    6: 70,
    7: 85,
    8: 100
};

// ===== Confetti System =====
let confettiParticles = [];
let confettiAnimationId = null;

function resizeCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class ConfettiParticle {
    constructor() {
        this.x = Math.random() * confettiCanvas.width;
        this.y = -20;
        this.size = Math.random() * 10 + 5;
        this.speedY = Math.random() * 3 + 2;
        this.speedX = Math.random() * 4 - 2;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.color = this.getRandomColor();
        this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
        this.opacity = 1;
    }

    getRandomColor() {
        const colors = [
            '#d4af37', // Gold
            '#f4e4bc', // Light Gold
            '#22c55e', // Green
            '#3b82f6', // Blue
            '#ef4444', // Red
            '#a855f7', // Purple
            '#ec4899', // Pink
            '#f97316', // Orange
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        this.speedY += 0.1; // gravity

        if (this.y > confettiCanvas.height - 100) {
            this.opacity -= 0.02;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;

        if (this.shape === 'rect') {
            ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

function createConfetti(count = 150) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            confettiParticles.push(new ConfettiParticle());
        }, i * 10);
    }
}

function animateConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles = confettiParticles.filter(p => p.opacity > 0);

    confettiParticles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    if (confettiParticles.length > 0) {
        confettiAnimationId = requestAnimationFrame(animateConfetti);
    }
}

function startConfetti() {
    confettiParticles = [];
    createConfetti(150);
    animateConfetti();

    // Second burst after 300ms
    setTimeout(() => createConfetti(100), 300);
}

function stopConfetti() {
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
    }
    confettiParticles = [];
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

// ===== Utility Functions =====
function formatMoney(num) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

function showQuizStep(stepNum) {
    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`quizStep${stepNum}`).classList.add('active');
    currentStep = stepNum;
    const percent = progressMap[stepNum] || 0;
    progressFill.style.width = `${percent}%`;
    document.getElementById('modalProgressPercent').textContent = `${percent}%`;
}

function calculateCash() {
    if (answers.propertyValue !== null && answers.mortgageBalance !== null) {
        // Formula: (Home Value × 80% LTV) − Mortgage Balance = Available Equity
        // If mortgage is paid off, mortgageBalance = 0
        const maxLTV = 0.80; // 80% Loan-to-Value ratio
        const availableCash = (answers.propertyValue * maxLTV) - answers.mortgageBalance;
        // Cap at $390,000 maximum
        const maxCash = 390000;
        calculatedCash = Math.min(maxCash, Math.max(0, Math.round(availableCash)));
    }
}

// Count-up animation for cash display
function animateCashCountUp() {
    const cashDisplay = document.getElementById('cashValue');
    if (!cashDisplay || calculatedCash === 0) return;

    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = calculatedCash / steps;
    const stepTime = duration / steps;
    let currentValue = 0;

    const countInterval = setInterval(() => {
        currentValue += increment;
        if (currentValue >= calculatedCash) {
            currentValue = calculatedCash;
            clearInterval(countInterval);
        }
        cashDisplay.textContent = formatMoney(Math.round(currentValue));
    }, stepTime);
}

// Update results page with dynamic cash amounts
function updateResultsPage() {
    const formattedCash = formatMoney(calculatedCash);

    // Inject into all lender cards
    const quickenEl = document.getElementById('quicken-cash-amount');
    const unlockEl = document.getElementById('unlock-cash-amount');
    const hometapEl = document.getElementById('hometap-cash-amount');

    if (quickenEl) quickenEl.textContent = formattedCash;
    if (unlockEl) unlockEl.textContent = formattedCash;
    if (hometapEl) hometapEl.textContent = formattedCash;
}

function unlockResults() {
    // Stop any confetti (keeping function for backwards compat)
    stopConfetti();

    // Update results page with calculated amounts before showing
    updateResultsPage();

    // Hide modal and overlay
    quizModal.classList.add('hidden');
    blurOverlay.classList.add('hidden');

    // Show loading overlay
    const loadingOverlay = document.getElementById('resultsLoadingOverlay');
    loadingOverlay.classList.add('active');

    // After 2 seconds, hide loading and show results
    setTimeout(() => {
        loadingOverlay.classList.remove('active');
        resultPage.classList.remove('blurred');

        // Scroll to first card
        setTimeout(() => {
            document.querySelector('.lender-list').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 400);
    }, 2000);
}

// ===== Initialize - Lock the page =====
resultPage.classList.add('blurred');

// ===== Step 1: Zip Code =====
zipInput.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '').slice(0, 5);
    answers.zipCode = this.value;

    if (this.value.length >= 5) {
        zipSubmitBtn.classList.remove('disabled');
        zipSubmitBtn.disabled = false;
    } else {
        zipSubmitBtn.classList.add('disabled');
        zipSubmitBtn.disabled = true;
    }
});

zipSubmitBtn.addEventListener('click', function() {
    if (answers.zipCode.length >= 5) {
        showQuizStep(2);
        startSearchAnimation();
    }
});

// ===== Step 2: Search Animation =====
function startSearchAnimation() {
    document.getElementById('zipDisplay').textContent = answers.zipCode;

    const step1 = document.getElementById('sStep1');
    const step2 = document.getElementById('sStep2');
    const step3 = document.getElementById('sStep3');

    // Reset
    [step1, step2, step3].forEach(s => {
        s.classList.remove('active', 'complete');
        s.querySelector('span').textContent = '⏳';
    });

    // Animate steps
    step1.classList.add('active');

    setTimeout(() => {
        step1.classList.remove('active');
        step1.classList.add('complete');
        step1.querySelector('span').textContent = '✓';
        step2.classList.add('active');
    }, 1000);

    setTimeout(() => {
        step2.classList.remove('active');
        step2.classList.add('complete');
        step2.querySelector('span').textContent = '✓';
        step3.classList.add('active');
    }, 2000);

    setTimeout(() => {
        step3.classList.remove('active');
        step3.classList.add('complete');
        step3.querySelector('span').textContent = '✓';
    }, 3000);

    setTimeout(() => {
        showQuizStep(3);
        startLenderCountAnimation(); // Start the count-up animation
    }, 3500);
}

// ===== Step 3: Lenders Found - AUTO-ADVANCE (No Continue Button) =====
function startLenderCountAnimation() {
    const lenderDisplay = document.getElementById('lenderCountDisplay');
    let count = 0;
    const targetCount = 12;
    const duration = 1000; // 1 second count-up
    const interval = duration / targetCount;

    // Animate count from 0 to 10
    const countInterval = setInterval(() => {
        count++;
        lenderDisplay.textContent = count;
        if (count >= targetCount) {
            clearInterval(countInterval);
        }
    }, interval);

    // AUTO-ADVANCE after 2.5 seconds (give user time to read)
    setTimeout(() => {
        showQuizStep(4);
    }, 2500);
}

// ===== Step 4: Property Value =====
document.querySelectorAll('#quizStep4 .quiz-option').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.add('selected');
        answers.propertyValue = parseInt(this.dataset.value);
        setTimeout(() => showQuizStep(5), 400);
    });
});

// ===== Step 5: Mortgage Balance - Slider =====
const mortgageSlider = document.getElementById('mortgageSlider');
const mortgageValueDisplay = document.getElementById('mortgageValueDisplay');
const sliderHint = document.querySelector('.slider-hint');
const sliderTrackFill = document.getElementById('sliderTrackFill');
const mortgageSubmitBtn = document.getElementById('mortgageSubmitBtn');

function getSliderHint(value) {
    if (value === 0) return 'Paid Off - Best Rates!';
    if (value <= 100000) return 'Low Balance';
    if (value <= 300000) return 'Moderate Balance';
    if (value <= 500000) return 'Average Balance';
    if (value <= 750000) return 'Higher Balance';
    return 'High Balance';
}

function updateSliderDisplay() {
    const value = parseInt(mortgageSlider.value);
    mortgageValueDisplay.textContent = formatMoney(value);
    sliderHint.textContent = getSliderHint(value);

    // Update track fill percentage
    const percent = (value / 1000000) * 100;
    sliderTrackFill.style.width = `${percent}%`;

    // Update hint color based on value
    if (value === 0) {
        sliderHint.style.color = '#22c55e';
    } else if (value <= 300000) {
        sliderHint.style.color = '#22c55e';
    } else if (value <= 600000) {
        sliderHint.style.color = '#eab308';
    } else {
        sliderHint.style.color = '#f97316';
    }
}

mortgageSlider.addEventListener('input', updateSliderDisplay);

mortgageSubmitBtn.addEventListener('click', () => {
    answers.mortgageBalance = parseInt(mortgageSlider.value);
    calculateCash();
    showQuizStep(6);
});

// ===== Step 6: Credit Score =====
document.querySelectorAll('#quizStep6 .quiz-option').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.add('selected');
        answers.credit = this.dataset.id;
        setTimeout(() => {
            showQuizStep(7);
            startFinalLoading();
        }, 400);
    });
});

// ===== Step 7: Final Loading =====
function startFinalLoading() {
    const step1 = document.getElementById('fStep1');
    const step2 = document.getElementById('fStep2');
    const step3 = document.getElementById('fStep3');

    // Reset
    [step1, step2, step3].forEach(s => s.classList.remove('active', 'complete'));
    step1.classList.add('active');

    setTimeout(() => {
        step1.classList.remove('active');
        step1.classList.add('complete');
        step2.classList.add('active');
    }, 800);

    setTimeout(() => {
        step2.classList.remove('active');
        step2.classList.add('complete');
        step3.classList.add('active');
    }, 1600);

    setTimeout(() => {
        step3.classList.remove('active');
        step3.classList.add('complete');
    }, 2400);

    // Show Cash + Goals screen (Step 8)
    setTimeout(() => {
        showQuizStep(8);
        animateCashCountUp(); // Start count-up animation
    }, 3000);
}

// ===== Step 8: Goal Selection =====
document.querySelectorAll('#quizStep8 .goal-card').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove selection from others
        document.querySelectorAll('#quizStep8 .goal-card').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected');
        answers.goal = this.dataset.id;

        // Auto-redirect after selection
        setTimeout(() => {
            unlockResults();
        }, 600);
    });
});

// ===== Header Back Button =====
const quizBackBtn = document.getElementById('quizBackBtn');

// Map current step to previous step
const stepBackMap = {
    1: null,  // No back from step 1
    2: null,  // No back during search animation
    3: null,  // No back during lenders found
    4: 1,     // Property value -> Zip code
    5: 4,     // Mortgage -> Property value
    6: 5,     // Credit -> Mortgage
    7: null,  // No back during loading
    8: 6      // Goals -> Credit
};

function updateBackButton() {
    const prevStep = stepBackMap[currentStep];
    if (prevStep) {
        quizBackBtn.style.visibility = 'visible';
        quizBackBtn.style.opacity = '1';
    } else {
        quizBackBtn.style.visibility = 'hidden';
        quizBackBtn.style.opacity = '0';
    }
}

quizBackBtn.addEventListener('click', () => {
    const prevStep = stepBackMap[currentStep];
    if (prevStep) {
        showQuizStep(prevStep);
    }
});

// Override showQuizStep to also update back button
const originalShowQuizStep = showQuizStep;
showQuizStep = function(stepNum) {
    originalShowQuizStep(stepNum);
    updateBackButton();
};

// ===== Show first step =====
showQuizStep(1);
