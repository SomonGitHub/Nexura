/**
 * Nexura Onboarding Tutorial Logic
 */
const tutorialData = [
    {
        icon: 'zap',
        title: 'Bienvenue sur Nexura',
        desc: 'Nexura est votre nouveau centre de contrôle domotique intelligent, rapide et privé.'
    },
    {
        icon: 'link',
        title: 'Connexion Home Assistant',
        desc: 'Pour commencer, vous devez lier votre instance Home Assistant. Préparez votre URL locale et votre jeton d\'accès.'
    },
    {
        icon: 'layout',
        title: 'Organisez votre maison',
        desc: 'Créez des pièces et scannez vos entités pour personnaliser votre tableau de bord en quelques clics.'
    },
    {
        icon: 'rocket',
        title: 'Prêt à décoller ?',
        desc: 'Cliquez sur le bouton ci-dessous pour accéder aux paramètres et configurer votre première pièce.'
    }
];

let currentStep = 0;

function startTutorial() {
    console.log("Starting Onboarding Tutorial...");
    const overlay = document.getElementById('tutorialOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        renderStep(0);
    }
}

function nextStep() {
    if (currentStep < tutorialData.length - 1) {
        currentStep++;
        renderStep(currentStep);
    } else {
        finishTutorial();
    }
}

function renderStep(stepIndex) {
    currentStep = stepIndex;
    const data = tutorialData[stepIndex];
    const container = document.getElementById('tutorialContent');
    if (!container) return;

    // Update Dots
    const dots = document.querySelectorAll('.tutorial-dots .dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === stepIndex);
    });

    // Animate content change
    container.style.opacity = '0';
    setTimeout(() => {
        container.innerHTML = `
            <div class="tutorial-icon">
                <i data-lucide="${data.icon}"></i>
            </div>
            <h2>${data.title}</h2>
            <p>${data.desc}</p>
        `;
        lucide.createIcons({
            attrs: {
                'stroke-width': 2
            }
        });
        container.style.opacity = '1';

        const nextBtn = document.getElementById('tutorialNextBtn');
        if (nextBtn) {
            nextBtn.innerText = stepIndex === tutorialData.length - 1 ? 'Aller aux paramètres' : 'Suivant';
        }
    }, 200);
}

function finishTutorial() {
    document.getElementById('tutorialOverlay').style.display = 'none';
    window.location.href = 'settings.html';
}

window.startTutorial = startTutorial;
window.nextStep = nextStep;
