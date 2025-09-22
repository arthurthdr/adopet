
document.addEventListener('DOMContentLoaded', function() {

    if (document.querySelector('.casinha-section')) {
        if (typeof supabaseClient === 'undefined') {
            console.error("Erro Crítico: supabaseClient não foi definido no HTML antes de casinha-script.js");
            return;
        }

        const loginPrompt = document.getElementById('login-prompt-casinha');
        const casinhaContent = document.getElementById('casinha-content');
        const casinhaGrid = document.getElementById('casinha-grid');
        const casinhaVaziaMsg = document.getElementById('casinha-vazia-msg');

        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (session && session.user) {
                loginPrompt.style.display = 'none';
                displayPetsNaCasinha();
            } else {
                casinhaContent.style.display = 'none';
                casinhaVaziaMsg.style.display = 'none';
                loginPrompt.style.display = 'block';
            }
        });

        function displayPetsNaCasinha() {
            const casinha = getCasinha();
            console.log("Itens na casinha:", casinha); 
            casinhaGrid.innerHTML = '';

            if (casinha.length === 0) {
                casinhaContent.style.display = 'none';
                casinhaVaziaMsg.style.display = 'block';
                return;
            }

            casinhaContent.style.display = 'block';
            casinhaVaziaMsg.style.display = 'none';

            casinha.forEach(animal => {
                const card = document.createElement('div');
                card.className = 'animal-card';
                const animalId = String(animal.id);
                card.innerHTML = `
                    <img src="${animal.img || 'img/placeholder_animal.png'}" alt="Foto de ${animal.nome}">
                    <h3>${animal.nome}</h3>
                    <p><i class="fas fa-paw"></i> Porte ${animal.porte || 'Não informado'}</p>
                    <button class="adopt-button page-link-button" onclick="iniciarAdocao('${animalId}')">Adotar</button>
                    <button class="cancel-button" style="background-color: #d9534f; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 5px;" onclick="removerDaCasinha('${animalId}')">Remover</button>
                `;
                casinhaGrid.appendChild(card);
            });
        }

        window.removerDaCasinha = function(animalId) {
            let casinha = getCasinha();
            casinha = casinha.filter(animal => String(animal.id) !== animalId);
            saveCasinha(casinha);
            displayPetsNaCasinha();
        }
        
        window.iniciarAdocao = function(animalId) {
            window.location.href = `adocao.html?animalId=${animalId}`;
        }
    }
});