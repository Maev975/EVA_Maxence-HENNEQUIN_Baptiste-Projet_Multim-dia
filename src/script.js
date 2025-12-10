// ====================================================================
// FICHIER : script.js (Complet et mis à jour avec gestion des catégories)
// ====================================================================


// --- 1. DONNÉES ET ÉLÉMENTS DU DOM ---

// Restructuration du vocabulaire par catégorie (AJOUT DE LA STRUCTURE)
const vocabulaireParCategorie = {
    "Animaux de la ferme": [
        // Assurez-vous d'avoir les images 'goose.jpg', 'chicken.jpg', etc., dans le dossier spécifié
        { nom: 'Goose', image: 'image.png' }, 
        { nom: 'Chicken', image: 'image.png' },
        { nom: 'Cow', image: 'image.png' },
        { nom: 'Dog', image: 'image.png' },
        { nom: 'Pig', image: 'image.png' },
        { nom: 'Turkey', image: 'image.png' },
        { nom: 'Sheep', image: 'image.png' },
        { nom: 'Horse', image: 'image.png' },
        { nom: 'Llama', image: 'image.png' },
    ],
    "Fruits et Légumes": [
        { nom: 'Pomme', image: 'image.png' },
        { nom: 'Banane', image: 'image.png' },
        { nom: 'Carotte', image: 'image.png' },
        { nom: 'Poire', image: 'image.png' },
        { nom: 'Raisin', image: 'image.png' },
        { nom: 'Tomate', image: 'image.png' },
        { nom: 'Orange', image: 'image.png' },
        { nom: 'Citron', image: 'image.png' },
        { nom: 'Fraise', image: 'image.png' },
    ],
    "Couleurs": [
        { nom: 'Rouge', image: 'image.png' },
        { nom: 'Bleu', image: 'image.png' },
        { nom: 'Vert', image: 'image.png' },
        { nom: 'Jaune', image: 'image.png' },
        { nom: 'Noir', image: 'image.png' },
        { nom: 'Blanc', image: 'image.png' },
        { nom: 'Orange', image: 'image.png' },
        { nom: 'Violet', image: 'image.png' },
        { nom: 'Rose', image: 'image.png' },
    ]
};

// Variable globale pour la catégorie et le vocabulaire actifs
let categorieActive = Object.keys(vocabulaireParCategorie)[0]; // Initialiser avec la première catégorie
let vocabulaireActif = vocabulaireParCategorie[categorieActive]; // Le tableau de mots actuellement affiché

// Récupération des conteneurs HTML
const vocabulaireGrid = document.getElementById('vocabulaire-grid');
const gameInfoSection = document.getElementById('game-info');
const instructionTexte = document.getElementById('instruction-texte');
const categorieSelect = document.getElementById('categorie-select'); // NOUVEAU

// Récupération des boutons de mode
const modeApprentissageBtn = document.getElementById('mode-apprentissage');
const modeJeuBtn = document.getElementById('mode-jeu');
const repeterAudioBtn = document.getElementById('repeter-audio');

// Variables d'état du jeu
let modeActuel = 'apprentissage'; // 'apprentissage' ou 'jeu'
let motAChercher = null; // Le mot à deviner en mode jeu


// --- 2. FONCTION DE SYNTHÈSE VOCALE ---

let voixFrancaise = null; // Renommé pour plus de clarté (car vous utilisez 'fr-FR')

// Fonction asynchrone pour charger et définir la voix française
function chargerVoixFrancaise() {
    const toutesLesVoix = window.speechSynthesis.getVoices();
    
    // Chercher une voix française
    voixFrancaise = toutesLesVoix.find(voice => 
        voice.lang.startsWith('fr') // 'fr-FR', 'fr-CA', etc.
    );
    
    // Si les voix ne sont pas chargées immédiatement, on réessaie après l'événement
    if (!voixFrancaise && toutesLesVoix.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            chargerVoixFrancaise(); 
        };
    }
}


/**
 * Prononce un texte donné en utilisant la voix française (si disponible).
 * @param {string} texte - Le mot à prononcer.
 */
function prononcer(texte) {
    if (!('speechSynthesis' in window)) {
        console.error("Votre navigateur ne supporte pas l'API Web Speech.");
        return;
    }
    
    window.speechSynthesis.cancel(); // Annuler toute parole en cours
    
    const utterance = new SpeechSynthesisUtterance(texte);
    
    if (voixFrancaise) {
        utterance.voice = voixFrancaise;
    }
    utterance.lang = 'fr-FR'; 
    utterance.rate = 0.9; 

    window.speechSynthesis.speak(utterance);
}


// --- 3. RENDU DES CARTES ET GESTION DES CLICS ---

/**
 * Construit et insère une carte de vocabulaire dans le DOM.
 * @param {object} item - L'objet contenant le nom et le chemin de l'image.
 */
function creerCarte(item) {
    const col = document.createElement('div');
    col.classList.add('col'); 

    const card = document.createElement('div');
    card.classList.add('card', 'shadow-sm', 'h-100', 'text-center', 'clickable'); 
    card.setAttribute('data-name', item.nom);
    
    // Assurez-vous que le chemin vers l'image est correct (ici: '../doc/')
    card.innerHTML = `
        <img src="../doc/${item.image}" class="card-img-top p-3" alt="${item.nom}" style="object-fit: contain; height: 150px;">
        <div class="card-body">
            <p class="card-text fw-bold fs-5">${item.nom}</p>
        </div>
    `;
    
    card.addEventListener('click', gererClicCarte);
    
    col.appendChild(card);
    vocabulaireGrid.appendChild(col);
}

// Fonction appelée lors du clic sur n'importe quelle carte
function gererClicCarte(event) {
    const carte = event.currentTarget.closest('.card');
    const nomItem = carte.getAttribute('data-name');
    
    if (modeActuel === 'apprentissage') {
        prononcer(nomItem);
        
    } else if (modeActuel === 'jeu') {
        verifierReponse(nomItem, carte);
    }
}


// --- 4. GESTION DES CATÉGORIES ET DE L'AFFICHAGE ---

/**
 * Remplit le menu déroulant avec les catégories disponibles.
 */
function remplirSelectCategories() {
    const categories = Object.keys(vocabulaireParCategorie);
    
    categories.forEach(categorie => {
        const option = document.createElement('option');
        option.value = categorie;
        option.textContent = categorie;
        categorieSelect.appendChild(option);
    });
    
    categorieSelect.value = categorieActive;
}

/**
 * Change la catégorie active, met à jour le vocabulaire et rafraîchit la grille.
 * @param {string} nouvelleCategorie - La clé de la nouvelle catégorie.
 */
function changerCategorie(nouvelleCategorie) {
    if (nouvelleCategorie === categorieActive) return; // Éviter de recharger si c'est la même

    categorieActive = nouvelleCategorie;
    vocabulaireActif = vocabulaireParCategorie[categorieActive];
    
    // 1. Mettre à jour la grille
    afficherCartesVocabulaire(vocabulaireActif);
    
    // 2. Si on est en mode Jeu, redémarrer le jeu avec le nouveau vocabulaire
    if (modeActuel === 'jeu') {
        demarrerJeu();
    } else {
        // En mode apprentissage, on réinitialise l'affichage au cas où
        document.querySelectorAll('.card').forEach(card => card.classList.remove('correct', 'incorrect'));
    }
}

/**
 * Affiche les cartes du vocabulaire donné.
 * @param {Array<Object>} mots - Le tableau de mots à afficher.
 */
function afficherCartesVocabulaire(mots) {
    // Vider la grille existante
    vocabulaireGrid.innerHTML = ''; 
    
    // Créer les nouvelles cartes
    mots.forEach(creerCarte); 
}


// --- 5. GESTION DES MODES ---

/**
 * Met à jour l'interface en fonction du mode sélectionné.
 */
function changerMode(nouveauMode) {
    modeActuel = nouveauMode;
    
    modeApprentissageBtn.classList.remove('active');
    modeJeuBtn.classList.remove('active');

    if (nouveauMode === 'apprentissage') {
        modeApprentissageBtn.classList.add('active');
        gameInfoSection.style.display = 'none'; 
        // Rétablir l'apparence normale des cartes
        document.querySelectorAll('.card').forEach(card => card.classList.remove('correct', 'incorrect'));
        
    } else if (nouveauMode === 'jeu') {
        modeJeuBtn.classList.add('active');
        gameInfoSection.style.display = 'block'; 
        demarrerJeu(); // Lancer la première manche
    }
}


// --- 6. LOGIQUE DU JEU DE RECONNAISSANCE ---

/**
 * Démarre une nouvelle manche de jeu.
 */
function demarrerJeu() {
    // Si le vocabulaire actif est vide (ne devrait pas arriver si bien configuré), on annule.
    if (vocabulaireActif.length === 0) {
        instructionTexte.textContent = "Catégorie vide. Veuillez choisir une autre catégorie.";
        return;
    }

    // 1. Réinitialiser visuellement les cartes
    document.querySelectorAll('.card').forEach(card => card.classList.remove('correct', 'incorrect'));
    
    // 2. Choisir un mot au hasard DANS LE VOCABULAIRE ACTIF
    const indexAleatoire = Math.floor(Math.random() * vocabulaireActif.length);
    motAChercher = vocabulaireActif[indexAleatoire];
    
    // 3. Afficher l'instruction 
    instructionTexte.textContent = `Cliquez sur le bon mot : ?`;
    
    // 4. Prononcer le mot
    setTimeout(() => {
        prononcer(motAChercher.nom);
    }, 500); 
}

/**
 * Vérifie si la carte cliquée correspond au mot à trouver.
 * @param {string} nomClique - Le nom de l'item cliqué.
 * @param {HTMLElement} carteCliquee - L'élément DOM de la carte.
 */
function verifierReponse(nomClique, carteCliquee) {
    if (!motAChercher) return; // La manche est déjà terminée ou non commencée

    // Désactiver temporairement les clics des autres cartes pour le feedback
    document.querySelectorAll('.card').forEach(card => card.style.pointerEvents = 'none');

    if (nomClique === motAChercher.nom) {
        // Réponse Correcte
        carteCliquee.classList.add('correct');
        prononcer("Correct ! Bravo !");
        motAChercher = null; 
        instructionTexte.textContent = `✅ Bien joué, c'était le ${nomClique} !`;
        
        // Démarrer la manche suivante après un court délai
        setTimeout(() => {
            document.querySelectorAll('.card').forEach(card => card.style.pointerEvents = 'auto');
            demarrerJeu();
        }, 3000); 
        
    } else {
        // Réponse Incorrecte
        carteCliquee.classList.add('incorrect');
        prononcer("Faux, réessayez.");
        instructionTexte.textContent = `❌ Réponse incorrecte. Écoutez à nouveau et réessayez.`;
        
        // Retirer la classe incorrecte et re-prononcer le mot
        setTimeout(() => {
            carteCliquee.classList.remove('incorrect');
            document.querySelectorAll('.card').forEach(card => card.style.pointerEvents = 'auto');
            prononcer(motAChercher.nom); // Redonner l'audio
        }, 1500); 
    }
}

// Ajout de la fonction pour répéter l'audio en mode Jeu
repeterAudioBtn.addEventListener('click', () => {
    if (motAChercher && modeActuel === 'jeu') {
        prononcer(motAChercher.nom);
    }
});


// --- 7. INITIALISATION AU CHARGEMENT DE LA PAGE ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Lancer le chargement des voix
    chargerVoixFrancaise();
    
    // 2. Remplir le menu déroulant des catégories
    remplirSelectCategories();
    
    // 3. Afficher les cartes de la catégorie initiale
    afficherCartesVocabulaire(vocabulaireActif);
    
    // 4. Ajouter l'écouteur pour le changement de catégorie
    categorieSelect.addEventListener('change', (event) => {
        changerCategorie(event.target.value);
    });

    // 5. Ajouter les écouteurs de mode (déjà attachés plus haut mais réaffirmés ici)
    modeApprentissageBtn.addEventListener('click', () => changerMode('apprentissage'));
    modeJeuBtn.addEventListener('click', () => changerMode('jeu'));
});