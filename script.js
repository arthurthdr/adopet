// js/script.js - VERSÃO COMPLETA E FINAL

document.addEventListener('DOMContentLoaded', () => {

    // Verifica se o Supabase carregou
    if (!window.supabaseClient) {
        console.warn("SupabaseClient não encontrado.");
        return;
    }

    // ======================================================
    // 1. LÓGICA DA PÁGINA DE ADOÇÃO (Alternância Grid/Form)
    // ======================================================
    const sectionGrid = document.getElementById('animais-disponiveis');
    const sectionForm = document.getElementById('adocao-form-section');
    const hiddenInput = document.getElementById('animal-id-hidden-input');

    // Verifica se estamos na página de adoção (se os elementos existem)
    if (sectionGrid && sectionForm) {
        
        // Pega o ID da URL (ex: adocao.html?animalId=5)
        const urlParams = new URLSearchParams(window.location.search);
        const animalIdParam = urlParams.get('animalId');

        if (animalIdParam) {
            // --- MODO FORMULÁRIO (Veio da Casinha ou Carrossel) ---
            console.log("Modo Formulário Ativado. ID:", animalIdParam);

            // Esconde a lista e Mostra o form (Forçado com !important para vencer o CSS)
            sectionGrid.style.setProperty('display', 'none', 'important');
            sectionForm.style.setProperty('display', 'block', 'important');

            // Preenche ID imediatamente para não dar erro no envio
            if (hiddenInput) hiddenInput.value = animalIdParam;

            // Busca detalhes para preencher o título
            buscarNomeAnimal(animalIdParam);

        } else {
            // --- MODO LISTA (Acesso direto pelo menu) ---
            console.log("Modo Lista Ativado.");

            // Mostra a lista e Esconde o form
            sectionGrid.style.setProperty('display', 'block', 'important');
            sectionForm.style.setProperty('display', 'none', 'important');

            // Carrega a lista de animais do banco
            carregarListaAnimais();
        }

        // Configura o botão Cancelar (Volta para a lista limpa)
        const btnCancel = document.getElementById('cancel-button');
        if (btnCancel) {
            btnCancel.onclick = () => {
                window.location.href = 'adocao.html';
            };
        }
    }

    // ======================================================
    // 2. LÓGICA DO CARROSSEL (PÁGINA INICIAL)
    // ======================================================
    if (document.getElementById('carousel-track')) {
        iniciarCarrossel();
        configurarBotoesCarrossel();
    }

    // ======================================================
    // 3. ENVIO DO FORMULÁRIO (COM VALIDAÇÕES)
    // ======================================================
    const formAdocao = document.getElementById('adocao-form');
    if (formAdocao) {
        configurarEnvioFormulario(formAdocao);
    }
});

// ======================================================
// === FUNÇÕES AUXILIARES ===
// ======================================================

// --- 1. Carrega os animais na Grid (Apenas botão Casinha) ---
async function carregarListaAnimais() {
    const grid = document.getElementById('animais-grid');
    if (!grid) return;
    
    grid.innerHTML = '<p>Buscando amiguinhos...</p>';

    try {
        const { data, error } = await window.supabaseClient
            .from('animais')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        grid.innerHTML = '';
        if (!data || data.length === 0) {
            grid.innerHTML = '<p>Nenhum animal cadastrado no momento.</p>';
            return;
        }

        data.forEach(animal => {
            const card = document.createElement('div');
            card.className = 'animal-card';
            
            // Aqui só mostramos o botão de adicionar à casinha
            card.innerHTML = `
                <img src="${animal.img || 'img/placeholder_animal.png'}" alt="${animal.nome}">
                <h3>${animal.nome}</h3>
                <p><i class="fas fa-paw"></i> ${animal.porte || 'N/A'}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${animal.cidade || 'N/A'}</p>
                
                <button class="adopt-button btn-add-casinha" 
                    data-id="${animal.id}" 
                    data-nome="${animal.nome}" 
                    data-img="${animal.img}" 
                    data-porte="${animal.porte}">
                    Adicionar à Casinha <i class="fas fa-heart"></i>
                </button>
            `;
            grid.appendChild(card);
        });

        // Adiciona evento de clique aos botões gerados
        document.querySelectorAll('.btn-add-casinha').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dados = {
                    id: e.target.dataset.id,
                    nome: e.target.dataset.nome,
                    img: e.target.dataset.img,
                    porte: e.target.dataset.porte
                };
                adicionarAoLocalStorage(dados);
            });
        });

    } catch (e) {
        grid.innerHTML = '<p>Erro ao carregar lista.</p>';
        console.error(e);
    }
}

// --- 2. Salva na Casinha (LocalStorage) ---
function adicionarAoLocalStorage(animal) {
    let casinha = JSON.parse(localStorage.getItem('casinhaAdopet')) || [];
    
    // Verifica duplicidade
    if (casinha.some(item => String(item.id) === String(animal.id))) {
        alert(`${animal.nome} já está na sua casinha!`);
        return;
    }
    
    casinha.push(animal);
    localStorage.setItem('casinhaAdopet', JSON.stringify(casinha));
    alert(`${animal.nome} foi adicionado à sua Casinha!`);
    
    // Atualiza contador (função definida em casinha-global.js)
    if (typeof updateCasinhaContador === 'function') updateCasinhaContador();
}

// --- 3. Busca nome para o título do formulário ---
async function buscarNomeAnimal(id) {
    if (!window.supabaseClient) return;
    try {
        const { data } = await window.supabaseClient
            .from('animais')
            .select('nome')
            .eq('id', id)
            .single();
        
        if (data) {
            const title = document.getElementById('adocao-form-title');
            if (title) title.textContent = `Formulário de Adoção para ${data.nome}`;
            
            // Rola a tela até o formulário
            const section = document.getElementById('adocao-form-section');
            if(section) section.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (e) { console.error("Erro ao buscar nome:", e); }
}

// --- 4. Lógica de Envio do Formulário ---
function configurarEnvioFormulario(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // A. Verifica Login
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            alert("Você precisa estar logado para enviar o pedido.");
            window.location.href = 'login.html';
            return;
        }

        // B. Verifica ID do Animal
        const idInput = document.getElementById('animal-id-hidden-input').value;
        if (!idInput) {
            alert("Erro crítico: ID do animal não encontrado. Volte para a Casinha e tente novamente.");
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Enviando...';

        // C. Monta dados (Convertendo ID para Int para evitar erro BigInt)
        const dados = {
            animal_id: parseInt(idInput), 
            user_id: user.id,
            nome_adotante: document.getElementById('nome-adotante').value,
            cpf: document.getElementById('cpf-adotante').value,
            cidade: document.getElementById('cidade-adotante').value,
            endereco: document.getElementById('endereco-adotante').value,
            telefone_adotante: document.getElementById('telefone-adotante').value,
            email_adotante: document.getElementById('email-adotante').value,
            mensagem_motivacao: document.getElementById('mensagem-adotante').value,
            status: 'pendente'
        };

        try {
            const { error } = await window.supabaseClient.from('pedidos_adocao').insert([dados]);
            if (error) throw error;
            
            alert("Pedido enviado com sucesso! Acompanhe o status no seu Perfil.");
            window.location.href = 'perfil.html';
        } catch (e) {
            alert("Erro ao enviar: " + e.message);
            console.error(e);
            btn.disabled = false;
            btn.textContent = 'Enviar Pedido';
        }
    });
}

// --- 5. Lógica do Carrossel (Home) ---
async function iniciarCarrossel() {
    const track = document.getElementById('carousel-track');
    if (!track) return;

    try {
        const { data } = await window.supabaseClient
            .from('animais')
            .select('*')
            .limit(6);
        
        if (data && data.length > 0) {
            track.innerHTML = '';
            data.forEach(a => {
                const d = document.createElement('div');
                d.className = 'carousel-slide';
                // O botão do carrossel leva direto ao formulário
                d.innerHTML = `
                    <div class="slide-image-container">
                        <img src="${a.img || 'img/placeholder_animal.png'}" alt="${a.nome}">
                    </div>
                    <div class="slide-content">
                        <h3>${a.nome}</h3>
                        <ul class="pet-info">
                             <li><i class="fas fa-paw"></i> ${a.especie}</li>
                             <li><i class="fas fa-ruler-vertical"></i> ${a.porte}</li>
                        </ul>
                        <a href="adocao.html?animalId=${a.id}" class="adopt-button">Quero Adotar!</a>
                    </div>`;
                track.appendChild(d);
            });
        }
    } catch (e) {
        console.error("Erro no carrossel:", e);
    }
}

function configurarBotoesCarrossel() {
    const track = document.getElementById('carousel-track');
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');
    
    if (prev && next && track) {
        prev.onclick = () => track.scrollBy({ left: -300, behavior: 'smooth' });
        next.onclick = () => track.scrollBy({ left: 300, behavior: 'smooth' });
    }
}