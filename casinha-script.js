// js/casinha-script.js - VERSÃO COM BOTÃO "PREENCHER FORMULÁRIO"

document.addEventListener('DOMContentLoaded', () => {

    const casinhaGrid = document.getElementById('casinha-grid');
    const loginPrompt = document.getElementById('login-prompt-casinha');
    const casinhaContent = document.getElementById('casinha-content');
    const casinhaVaziaMsg = document.getElementById('casinha-vazia-msg');

    // 1. Verifica Login
    if (!window.supabaseClient) return;

    window.supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
            if(loginPrompt) loginPrompt.style.display = 'none';
            renderizarCasinha();
        } else {
            if(casinhaContent) casinhaContent.style.display = 'none';
            if(casinhaVaziaMsg) casinhaVaziaMsg.style.display = 'none';
            if(loginPrompt) loginPrompt.style.display = 'block';
        }
    });

    // 2. Renderiza os Cards
    function renderizarCasinha() {
        if (!casinhaGrid) return;
        
        const casinha = JSON.parse(localStorage.getItem('casinhaAdopet')) || [];
        casinhaGrid.innerHTML = '';

        if (casinha.length === 0) {
            if(casinhaContent) casinhaContent.style.display = 'none';
            if(casinhaVaziaMsg) casinhaVaziaMsg.style.display = 'block';
            return;
        }

        if(casinhaContent) casinhaContent.style.display = 'block';
        if(casinhaVaziaMsg) casinhaVaziaMsg.style.display = 'none';

        casinha.forEach(animal => {
            const card = document.createElement('div');
            card.className = 'animal-card';
            
            // AQUI MUDAMOS O NOME E A CLASSE DO BOTÃO
            card.innerHTML = `
                <img src="${animal.img || 'img/placeholder_animal.png'}" alt="${animal.nome}">
                <h3>${animal.nome}</h3>
                <p><i class="fas fa-paw"></i> ${animal.porte || 'N/A'}</p>
                
                <div class="casinha-actions">
                    <!-- BOTÃO DIFERENCIADO -->
                    <button class="adopt-button btn-ir-formulario" data-id="${animal.id}" style="background-color: var(--primary-color);">
                        Preencher Formulário <i class="fas fa-file-signature"></i>
                    </button>
                    
                    <button class="btn-remove-casinha" data-id="${animal.id}">
                        Remover da Casinha
                    </button>
                </div>
            `;
            casinhaGrid.appendChild(card);
        });

        // 3. EVENTO DE CLIQUE PARA IR AO FORMULÁRIO
        document.querySelectorAll('.btn-ir-formulario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                // Redireciona enviando o ID na URL
                console.log("Indo para formulário do animal:", id);
                window.location.href = `adocao.html?animalId=${id}`;
            });
        });

        // Evento Remover
        document.querySelectorAll('.btn-remove-casinha').forEach(btn => {
            btn.addEventListener('click', (e) => {
                removerDaCasinha(e.target.dataset.id);
            });
        });
    }

    function removerDaCasinha(id) {
        let casinha = JSON.parse(localStorage.getItem('casinhaAdopet')) || [];
        casinha = casinha.filter(a => String(a.id) !== String(id));
        localStorage.setItem('casinhaAdopet', JSON.stringify(casinha));
        renderizarCasinha();
        if (typeof updateCasinhaContador === 'function') updateCasinhaContador();
    }
});