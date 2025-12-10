// --- 1. DONNÉES ET ÉLÉMENTS DU DOM ---

const vocabulaire = [
    { nom: 'Girafe', image: 'image.png' },
    { nom: 'Canabis', image: 'image.png' },
    { nom: 'Cocaine', image: 'image.png' },
    { nom: 'Chicken', image: 'image.png' },
    { nom: 'Cow', image: 'image.png' },
    { nom: 'Dog', image: 'image.png' },
    { nom: 'Pig', image: 'image.png' },
    { nom: 'Turkey', image: 'image.png' },
    { nom: 'Sheep', image: 'image.png' },
];

// Récupération des conteneurs HTML
const vocabulaireGrid = document.getElementById('vocabulaire-grid');
const gameInfoSection = document.getElementById('game-info');
const instructionTexte = document.getElementById('instruction-texte');

// Récupération des boutons de mode
const modeApprentissageBtn = document.getElementById('mode-apprentissage');
const modeJeuBtn = document.getElementById('mode-jeu');
const repeterAudioBtn = document.getElementById('repeter-audio');

// Variables d'état du jeu
let modeActuel = 'apprentissage'; // 'apprentissage' ou 'jeu'
let motAChercher = null; // Le mot à deviner en mode jeu

// --- 2. FONCTION DE SYNTHÈSE VOCALE ---

let voixAnglaise = null;

// Fonction asynchrone pour charger et définir la voix anglaise
function chargerVoixAnglaise() {
    // 1. Récupérer toutes les voix disponibles
    const toutesLesVoix = window.speechSynthesis.getVoices();
    
    // 2. Chercher une voix anglaise (en-US ou en-GB)
    voixAnglaise = toutesLesVoix.find(voice => 
        voice.lang === 'fr' || voice.lang === 'fr-FR'
    );
    
    // Si la voix n'est pas chargée immédiatement, on réessaie après l'événement 'voiceschanged'
    if (!voixAnglaise && toutesLesVoix.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            // Rappeler la fonction une fois que les voix sont chargées par le navigateur
            chargerVoixAnglaise(); 
        };
    }
}

// Lancer le chargement des voix dès le début
chargerVoixAnglaise();


/**
 * Prononce un texte donné en utilisant la voix anglaise (si disponible).
 * @param {string} texte - Le mot à prononcer.
 */
function prononcer(texte) {
    if (!('speechSynthesis' in window)) {
        console.error("Votre navigateur ne supporte pas l'API Web Speech.");
        return;
    }
    
    // Annuler toute parole en cours pour éviter les chevauchements
    window.speechSynthesis.cancel(); 
    
    // Créer l'objet Utterance avec le texte
    const utterance = new SpeechSynthesisUtterance(texte);
    
    // Définir la langue et la voix si elle a été trouvée
    if (voixAnglaise) {
        utterance.voice = voixAnglaise;
    }
    utterance.lang = 'fr-FR'; 
    utterance.rate = 0.9; // Vitesse de lecture légèrement réduite pour la clarté

    // Lancer la synthèse vocale
    window.speechSynthesis.speak(utterance);
}

// --- 3. RENDU DES CARTES ET GESTION DES CLICS ---

/**
 * Construit et insère une carte de vocabulaire dans le DOM.
 * @param {object} animal - L'objet contenant le nom et le chemin de l'image.
 */
function creerCarte(animal) {
    // La carte sera dans une colonne de la grille Bootstrap
    const col = document.createElement('div');
    col.classList.add('col'); // Chaque carte prend une colonne

    const card = document.createElement('div');
    card.classList.add('card', 'shadow-sm', 'h-100', 'text-center', 'clickable'); // Classes Bootstrap
    card.setAttribute('data-name', animal.nom);
    
    // Structure interne de la carte
    card.innerHTML = `
        <img src="../doc//${animal.image}" class="card-img-top p-3" alt="${animal.nom}" style="object-fit: contain; height: 150px;">
        <div class="card-body">
            <p class="card-text fw-bold fs-5">${animal.nom}</p>
        </div>
    `;
    
    // Gestionnaire d'événement de clic
    card.addEventListener('click', gererClicCarte);
    
    col.appendChild(card);
    vocabulaireGrid.appendChild(col);
}

// Fonction appelée lors du clic sur n'importe quelle carte
function gererClicCarte(event) {
    // Trouver l'élément de la carte (peut être le div, l'image ou le p)
    const carte = event.currentTarget.closest('.card');
    const nomAnimal = carte.getAttribute('data-name');
    
    if (modeActuel === 'apprentissage') {
        // Mode 1: Apprentissage (prononce juste le mot)
        prononcer(nomAnimal);
        
    } else if (modeActuel === 'jeu') {
        // Mode 2: Jeu (vérifie la réponse)
        verifierReponse(nomAnimal, carte);
    }
}

// Initialisation : afficher toutes les cartes au chargement
vocabulaire.forEach(creerCarte);

// --- 4. GESTION DES MODES ---

/**
 * Met à jour l'interface en fonction du mode sélectionné.
 */
function changerMode(nouveauMode) {
    // 1. Mise à jour des variables d'état et des classes de boutons
    modeActuel = nouveauMode;
    
    modeApprentissageBtn.classList.remove('active');
    modeJeuBtn.classList.remove('active');

    if (nouveauMode === 'apprentissage') {
        modeApprentissageBtn.classList.add('active');
        gameInfoSection.style.display = 'none'; // Cacher les instructions du jeu
        // Rétablir l'apparence normale des cartes (au cas où elles étaient colorées par le jeu)
        document.querySelectorAll('.card').forEach(card => card.classList.remove('correct', 'incorrect'));
        
    } else if (nouveauMode === 'jeu') {
        modeJeuBtn.classList.add('active');
        gameInfoSection.style.display = 'block'; // Afficher les instructions
        demarrerJeu(); // Lancer la première manche
    }
}

// Attacher les écouteurs d'événements aux boutons de mode
modeApprentissageBtn.addEventListener('click', () => changerMode('apprentissage'));
modeJeuBtn.addEventListener('click', () => changerMode('jeu'));

// --- 5. LOGIQUE DU JEU DE RECONNAISSANCE ---

/**
 * Démarre une nouvelle manche de jeu.
 */
function demarrerJeu() {
    // 1. Réinitialiser visuellement les cartes
    document.querySelectorAll('.card').forEach(card => card.classList.remove('correct', 'incorrect'));
    
    // 2. Choisir un mot au hasard
    const indexAleatoire = Math.floor(Math.random() * vocabulaire.length);
    motAChercher = vocabulaire[indexAleatoire];
    
    // 3. Afficher l'instruction à l'utilisateur
    instructionTexte.textContent = `Cliquez sur l'animal : ?`;
    
    // 4. Prononcer le mot
    setTimeout(() => {
        prononcer(motAChercher.nom);
    }, 500); // Délai pour s'assurer que l'UI est mise à jour

    // Mettre à jour l'instruction après la prononciation (ou ajouter un événement si nécessaire)
    // Pour l'instant, on laisse l'utilisateur deviner le mot prononcé.
}

/**
 * Vérifie si la carte cliquée correspond au mot à trouver.
 * @param {string} nomClique - Le nom de l'animal cliqué.
 * @param {HTMLElement} carteCliquee - L'élément DOM de la carte.
 */
function verifierReponse(nomClique, carteCliquee) {
    // Empêcher l'utilisateur de cliquer tant qu'une réponse n'est pas traitée
    if (!motAChercher) return; 

    if (nomClique === motAChercher.nom) {
        // Réponse Correcte
        carteCliquee.classList.add('correct');
        prononcer("Correct ! Bravo !");
        motAChercher = null; // Marquer la manche comme terminée
        instructionTexte.textContent = `✅ Bien joué, c'était le ${nomClique} !`;
        
        // Démarrer la manche suivante après un court délai
        setTimeout(demarrerJeu, 3000); // 3 secondes pour voir le feedback
        
    } else {
        // Réponse Incorrecte
        carteCliquee.classList.add('incorrect');
        prononcer("Faux, réessayez.");
        instructionTexte.textContent = `❌ Réponse incorrecte. Écoutez à nouveau et réessayez.`;
        
        // Retirer la classe incorrecte après 1 seconde
        setTimeout(() => {
            carteCliquee.classList.remove('incorrect');
            // Re-prononcer le mot pour donner une chance
            prononcer(motAChercher.nom);
        }, 1000); 
    }
}

// Ajout de la fonction pour répéter l'audio en mode Jeu
repeterAudioBtn.addEventListener('click', () => {
    if (motAChercher && modeActuel === 'jeu') {
        prononcer(motAChercher.nom);
    }
});