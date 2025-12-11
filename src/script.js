
//catégories
liste =['Mojito', 'cocaïne', 'Piano', 'farine', 'Voiture', 'France', 'Baguette', 'eau', 'Poutine', 'Kebab', 'Spaghetti', 'Chocolat', 'Montagne', 'Océan', 'Astronaute', 'Robot', 'Télévision', 'Internet', 'Smartphone', 'Café', 'Thé', 'Musique', 'Danse', 'Cinéma', 'Photographie', 'Peinture', 'Sculpture', 'Théâtre', 'Poésie', 'Roman', 'Bande dessinée', 'Jeu vidéo', 'Football', 'Basketball', 'Tennis', 'Natation', 'Cyclisme', 'Randonnée', 'Camping', 'Jardinage', 'Cuisine', 'Voyage', 'Aventure'];

const vocabulaireParCategorie = {
    "Animaux de la ferme": [
        { nom: 'canard', image: 'canard.png' }, 
        { nom: 'poule', image: 'poule.png' },
        { nom: 'vache', image: 'vache.png' },
        { nom: 'chèvre', image: 'chevre.png' },
        { nom: 'cochon', image: 'cochon.png' },
        { nom: 'dinde', image: 'dinde.png' },
        { nom: 'mouton', image: 'mouton.png' },
        { nom: 'cheval', image: 'cheval.png' },
        { nom: 'lama', image: 'lama.png' },
    ],
    "Fruits et Légumes": [
        { nom: 'Pomme', image: 'pomme.jpg' },
        { nom: 'Banane', image: 'banane.png' },
        { nom: 'Carotte', image: 'carotte.png' },
        { nom: 'Poire', image: 'poire.png' },
        { nom: 'Raisin', image: 'raisin.png' },
        { nom: 'Tomate', image: 'tomate.png' },
        { nom: 'Orange', image: 'orange.png' },
        { nom: 'Citron', image: 'citron.png' },
        { nom: 'Fraise', image: 'fraise.png' },
    ],
    "Couleurs": [
        { nom: 'Rouge', image: 'rouge.png' },
        { nom: 'Bleu', image: 'bleu.png' },
        { nom: 'Vert', image: 'vert.png' },
        { nom: 'Jaune', image: 'jaune.png' },
        { nom: 'Noir', image: 'noir.png' },
        { nom: 'Blanc', image: 'blanc.png' },
        { nom: 'Orange', image: 'orangeC.png' },
        { nom: 'Violet', image: 'violet.png' },
        { nom: 'Rose', image: 'rose.png' },
    ],
    "Autres": (function(){
        const n = 9; 
        const copie = Array.from(liste);
        for (let i = copie.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copie[i], copie[j]] = [copie[j], copie[i]];
        }
        return copie.slice(0, Math.min(n, copie.length)).map(nom => ({ nom }));
    })()

};

// API
const UNSPLASH_ACCESS_KEY = 'LdusrKiba0Z9NcRCVVAq8sas2adWD1TpOWkVDRz3tAc'; 
const UNSPLASH_API_URL = `https://api.unsplash.com/search/photos?client_id=${UNSPLASH_ACCESS_KEY}`;

//récupérer image avec API https://unsplash.com/documentation#search-photos 
async function getImageUrl(mot) {
    const url = `${UNSPLASH_API_URL}&query=${encodeURIComponent(mot)}&per_page=1`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            return data.results[0].urls.small; 
        } else {
            console.log(`Aucune image trouvée sur Unsplash pour le mot: ${mot}`); //c'est trop bien https://placehold.co/ 
            return 'https://placehold.co/150?text=Image+Non+Trouvee';
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de l'image depuis l'API:", error);
        return 'https://placehold.co/150?text=Erreur+API';
    }
}


//selection de la catégorie 
let categorieActive = Object.keys(vocabulaireParCategorie)[0]; 
let vocabulaireActif = vocabulaireParCategorie[categorieActive]; 

const vocabulaireGrid = document.getElementById('vocabulaire-grid');
const gameInfoSection = document.getElementById('game-info');
const instructionTexte = document.getElementById('instruction-texte');
const categorieSelect = document.getElementById('categorie-select');

const modeApprentissageBtn = document.getElementById('mode-apprentissage');
const modeJeuBtn = document.getElementById('mode-jeu');
const repeterAudioBtn = document.getElementById('repeter-audio');

//mode de jeu
let modeActuel = 'apprentissage'; 
let motAChercher = null; 



let voixFrancaise = null; 

function chargerVoixFrancaise() {
    const toutesLesVoix = window.speechSynthesis.getVoices();
    
    //voix Microsoft Paul - French (France)
    voixFrancaise = toutesLesVoix.find(voice => 
        voice.name === 'Microsoft Paul - French (France)' 
    );

    //bug voix pas encore chargé
    if (!voixFrancaise && toutesLesVoix.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            chargerVoixFrancaise(); 
        };
    }
}



function prononcer(texte) {
    
    
    window.speechSynthesis.cancel(); //couper la parole 
    
    const utterance = new SpeechSynthesisUtterance(texte);
    
    if (voixFrancaise) {
        utterance.voice = voixFrancaise;
    }
    utterance.lang = 'fr-FR'; 
    utterance.rate = 0.9; 

    window.speechSynthesis.speak(utterance);
}



//gestion des cartes
function creerCarte(item) {
    const col = document.createElement('div');
    col.classList.add('col'); 

    const card = document.createElement('div');
    card.classList.add('card', 'shadow-sm', 'h-100', 'text-center', 'clickable'); 
    card.setAttribute('data-name', item.nom);
    
    let srcImage = 'https://placehold.co/150?text=Chargement...'; 

    if (item.image) { 
        srcImage = `../doc/${item.image}`;
    } else {        
        getImageUrl(item.nom)
            .then(url => {
                const imgElement = card.querySelector('img');
                if (imgElement) {
                    imgElement.src = url;
                }
            })
            .catch(error => {
                const imgElement = card.querySelector('img');
                if (imgElement) {
                    imgElement.src = 'https://placehold.co/150?text=Image+Echec+API';
                }
            });
    }
    card.innerHTML = `
        <img src="${srcImage}" class="card-img-top p-3" alt="${item.nom}" style="object-fit: contain; height: 150px;">
        <div class="card-body">
            <p class="card-text fw-bold fs-5">${item.nom}</p>
        </div>
    `;
    
    card.addEventListener('click', gererClicCarte);
    
    col.appendChild(card);
    vocabulaireGrid.appendChild(col);
}




function gererClicCarte(event) {
    const carte = event.currentTarget.closest('.card');
    const nomItem = carte.getAttribute('data-name');
    
    if (modeActuel === 'apprentissage') {
        prononcer(nomItem);
        
    } else if (modeActuel === 'jeu') {
        verifierReponse(nomItem, carte);
    }
}

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


function changerCategorie(nouvelleCategorie) {

    categorieActive = nouvelleCategorie;
    vocabulaireActif = vocabulaireParCategorie[categorieActive];
    
    afficherCartesVocabulaire(vocabulaireActif);
    
    if (modeActuel === 'jeu') {
        demarrerJeu();
    } else {
        document.querySelectorAll('.card').forEach(card => card.classList.remove('correct', 'incorrect'));
    }
}


function afficherCartesVocabulaire(mots) {
    vocabulaireGrid.innerHTML = ''; 
    
    mots.forEach(creerCarte); 
}



function changerMode(nouveauMode) {
    modeActuel = nouveauMode;
    
    modeApprentissageBtn.classList.remove('active');
    modeJeuBtn.classList.remove('active');

    if (nouveauMode === 'apprentissage') {
        modeApprentissageBtn.classList.add('active');
        gameInfoSection.style.display = 'none'; 
        document.querySelectorAll('.card').forEach(card => card.classList.remove('correct', 'incorrect'));
        
    } else if (nouveauMode === 'jeu') {
        modeJeuBtn.classList.add('active');
        gameInfoSection.style.display = 'block'; 
        demarrerJeu(); 
    }
}


function demarrerJeu() {

    document.querySelectorAll('.card').forEach(card => card.classList.remove('correct', 'incorrect'));
    
    const indexAleatoire = Math.floor(Math.random() * vocabulaireActif.length);
    motAChercher = vocabulaireActif[indexAleatoire];
    
    instructionTexte.textContent = `Choisissez le bon mot`;
    
    setTimeout(() => {
        prononcer(motAChercher.nom);
    }, 500); 
}


function verifierReponse(nomClique, carteCliquee) {
    if (!motAChercher) return; 

    //désac carte quand ça parle
    document.querySelectorAll('.card').forEach(card => card.style.pointerEvents = 'none');

    if (nomClique === motAChercher.nom) {
        console.log("test correct");
        carteCliquee.classList.add('correct');
        prononcer("Correct , Bravo ");
        motAChercher = null; 
        instructionTexte.textContent = `Bien joué, c'était le ${nomClique}`;
        
        setTimeout(() => {
            document.querySelectorAll('.card').forEach(card => card.style.pointerEvents = 'auto');
            demarrerJeu();
        }, 3000); 
        
    } else {
        console.log(" test incorrect");
        carteCliquee.classList.add('incorrect');
        prononcer("Faux, réessayez");
        instructionTexte.textContent = `Réponse incorrecte. Écoutez à nouveau et réessayez.`;
        
        setTimeout(() => {
            carteCliquee.classList.remove('incorrect');
            document.querySelectorAll('.card').forEach(card => card.style.pointerEvents = 'auto');
            prononcer(motAChercher.nom); 
        }, 1500); 
    }
}

repeterAudioBtn.addEventListener('click', () => {
    if (motAChercher && modeActuel === 'jeu') {
        prononcer(motAChercher.nom);
    }
});



document.addEventListener('DOMContentLoaded', () => {
    chargerVoixFrancaise();
    remplirSelectCategories();
    afficherCartesVocabulaire(vocabulaireActif);
    categorieSelect.addEventListener('change', (event) => {
        changerCategorie(event.target.value);
    });

    modeApprentissageBtn.addEventListener('click', () => changerMode('apprentissage'));
    modeJeuBtn.addEventListener('click', () => changerMode('jeu'));
});