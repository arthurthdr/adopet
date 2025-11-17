// js/script.js - VERSÃO FINAL E CORRIGIDA

document.addEventListener('DOMContentLoaded', function() {
    // Valida se o cliente Supabase está disponível
    if (typeof supabaseClient === 'undefined') {
        console.error("script.js: supabaseClient não foi encontrado. 'auth-ui.js' deve ser carregado primeiro.");
        return;
    }

    // --- LÓGICA DO CARROSSEL ---
    // Verifica se estamos na página que contém o carrossel (index.html)
    if (document.getElementById('carousel-track')) {
        inicializarCarrossel(); 
    }
    
    // --- LÓGICA DA PÁGINA DE ADOÇÃO ---
    // Verifica se estamos na página de adoção
    if (document.getElementById('animais-grid')) {
        const urlParams = new URLSearchParams(window.location.search);
        const animalIdParaAdotar = urlParams.get('animalId');
        
        if (animalIdParaAdotar) {
            abrirFormularioParaAnimalEspecifico(animalIdParaAdotar);
        } else {
            buscarEExibirAnimais();
        }
        configurarFormularioAdoção();
    }
});

// =======================================================
// === FUNÇÃO UNIFICADA E CORRIGIDA PARA O CARROSSEL ===
// =======================================================

async function inicializarCarrossel() {
    const track = document.getElementById('carousel-track');
    const prevButton = document.getElementById('carousel-prev');
    const nextButton = document.getElementById('carousel-next');
    const carouselContainer = track.closest('.carousel-viewport');
    track.innerHTML = '<p style="padding: 20px; color: #333;">Carregando destaques...</p>';

    try {
        // 1. BUSCA OS ANIMAIS NO BANCO DE DADOS
        const { data: animais, error } = await supabaseClient
            .from('animais')
            .select('*')
            .order('id', { ascending: false })
            .limit(10);

        if (error) throw error;

        track.innerHTML = ''; // Limpa a mensagem de "carregando"

        if (!animais || animais.length === 0) {
            track.innerHTML = '<p style="padding: 20px; color: #333;">Nenhum animal em destaque no momento.</p>';
            // Esconde os botões se não houver animais
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
            return;
        }

      // 2. CRIA OS SLIDES E ADICIONA NA PÁGINA
animais.forEach(animal => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    
    // SUBSTITUA O INNERHTML ANTIGO POR ESTE NOVO BLOCO
    slide.innerHTML = `
        <div class="slide-image-container">
            <img src="${animal.img || 'img/placeholder_animal.png'}" alt="Foto de ${animal.nome}">
        </div>
        <div class="slide-content">
            <h3>${animal.nome}</h3>
            <ul class="pet-info">
                <li><i class="fas fa-venus-mars"></i> <span>${animal.sexo || 'Não informado'}</span></li>
                <li><i class="fas fa-paw"></i> <span>Porte ${animal.porte || 'Não informado'}</span></li>
                <li><i class="fas fa-birthday-cake"></i> <span>${animal.idade != null ? `${animal.idade} ano(s)` : 'Não informado'}</span></li>
            </ul>
            <a href="adocao.html?animalId=${animal.id}" class="adopt-button">Quero Adotar!</a>
        </div>
    `;
    track.appendChild(slide);
});

        // 3. AGORA QUE OS SLIDES EXISTEM, CONFIGURA A NAVEGAÇÃO
        // Esta parte só executa se a etapa 2 foi um sucesso.
        let intervalId = null;

        const moverSlides = (direction) => {
            const slide = track.querySelector('.carousel-slide');
            if (!slide) return;
            const slideWidth = slide.offsetWidth + (parseInt(getComputedStyle(slide).marginLeft) * 2);
            track.scrollBy({ left: direction === 'next' ? slideWidth : -slideWidth, behavior: 'smooth' });
        };

        const startAutoplay = () => {
            stopAutoplay();
            intervalId = setInterval(() => {
                if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
                    track.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    moverSlides('next');
                }
            }, 4000);
        };

        const stopAutoplay = () => clearInterval(intervalId);

        prevButton.addEventListener('click', () => { moverSlides('prev'); startAutoplay(); });
        nextButton.addEventListener('click', () => { moverSlides('next'); startAutoplay(); });

        carouselContainer.addEventListener('mouseenter', stopAutoplay);
        carouselContainer.addEventListener('mouseleave', startAutoplay);

        startAutoplay();

    } catch (error) {
        track.innerHTML = `<p style="padding: 20px; color: #c00;">Erro ao carregar destaques.</p>`;
        console.error("Erro ao inicializar o carrossel:", error);
    }
}


// =======================================================
// === FUNÇÕES DA PÁGINA DE ADOÇÃO (Sem alterações) ===
// =======================================================
async function abrirFormularioParaAnimalEspecifico(animalId) { /* ...código original... */ }
async function buscarEExibirAnimais() { /* ...código original... */ }
function exibirAnimaisNaGrid(animais) { /* ...código original... */ }
function adicionarPetNaCasinha(animalData) { /* ...código original... */ }
function adicionarEventoAosBotoesAdotar() { /* ...código original... */ }
function configurarFormularioAdoção() { /* ...código original... */ }
// Cole aqui as funções da página de adoção que estavam no seu script.js original
// Se você já substituiu pelo meu código anterior, elas já estão lá.
// Se não, aqui estão elas para garantir:
async function abrirFormularioParaAnimalEspecifico(animalId) {
    try {
        const { data: animal, error } = await supabaseClient.from('animais').select('id, nome').eq('id', animalId).single();
        if (error || !animal) throw new Error("Animal não encontrado.");
        document.getElementById('animais-disponiveis').style.display = 'none';
        const formSection = document.getElementById('adocao-form-section');
        document.getElementById('adocao-form-title').textContent = `Formulário de Adoção para ${animal.nome}`;
        document.getElementById('animal-id-hidden-input').value = animal.id;
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        alert("Erro: " + error.message);
    }
}

async function buscarEExibirAnimais() {
    const grid = document.getElementById('animais-grid');
    grid.innerHTML = '<p>Buscando...</p>';
    try {
        const { data: animais, error } = await supabaseClient.from('animais').select('*').order('nome', { ascending: true });
        if (error) throw error;
        exibirAnimaisNaGrid(animais);
    } catch (error) {
        grid.innerHTML = `<p style="color:red;">Não foi possível carregar os animais.</p>`;
    }
}

function exibirAnimaisNaGrid(animais) {
    const grid = document.getElementById('animais-grid');
    grid.innerHTML = '';
    if (!animais || animais.length === 0) {
        grid.innerHTML = '<p>Nenhum animalzinho encontrado.</p>';
        return;
    }
    animais.forEach(animal => {
        const card = document.createElement('div');
        card.className = 'animal-card';
        card.dataset.id = animal.id; card.dataset.nome = animal.nome; card.dataset.porte = animal.porte;
        card.innerHTML = `<img src="${animal.img||'img/placeholder_animal.png'}" alt="Foto de ${animal.nome}"><h3>${animal.nome}</h3><p><i class="fas fa-paw"></i> Porte ${animal.porte||'N/A'}</p><p><i class="fas fa-birthday-cake"></i> ${animal.idade!=null?`${animal.idade} ano(s)`:'N/A'}</p><button class="adopt-button page-link-button">Adicionar à Casinha <i class="fas fa-plus-circle"></i></button>`;
        grid.appendChild(card);
    });
    adicionarEventoAosBotoesAdotar();
}

function adicionarPetNaCasinha(animalData) {
    const casinha = getCasinha();
    if (casinha.some(animal => String(animal.id) === String(animalData.id))) {
        alert(`${animalData.nome} já está na sua casinha!`);
    } else {
        casinha.push(animalData);
        saveCasinha(casinha);
        alert(`${animalData.nome} foi adicionado(a) à sua casinha!`);
    }
}

function adicionarEventoAosBotoesAdotar() {
    document.querySelectorAll('#animais-grid .animal-card .adopt-button').forEach(botao => {
        botao.addEventListener('click', e => {
            const card = e.target.closest('.animal-card');
            adicionarPetNaCasinha({id: card.dataset.id, nome: card.dataset.nome, img: card.querySelector('img').src, porte: card.dataset.porte});
        });
    });
}

function configurarFormularioAdoção() {
    const formSection = document.getElementById('adocao-form-section');
    const formAdocao = document.getElementById('adocao-form');
    if (formAdocao) {
        formAdocao.querySelector('.cancel-button')?.addEventListener('click', () => {
            formSection.style.display = 'none';
            formAdocao.reset();
            document.getElementById('animais-disponiveis').style.display = 'block';
        });
        formAdocao.addEventListener('submit', async e => {
            e.preventDefault();
            const submitButton = formAdocao.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
            try {
                const dadosPedido = {
                    nome_adotante: document.getElementById('nome-adotante').value,
                    email_adotante: document.getElementById('email-adotante').value,
                    telefone_adotante: document.getElementById('telefone-adotante').value,
                    mensagem_motivacao: document.getElementById('mensagem-adotante').value,
                    animal_id: document.getElementById('animal-id-hidden-input').value,
                };
                const { error } = await supabaseClient.from('pedidos_adocao').insert([dadosPedido]);
                if (error) throw error;
                alert('Pedido de adoção enviado com sucesso!');
                formSection.style.display = 'none';
                formAdocao.reset();
                document.getElementById('animais-disponiveis').style.display = 'block';
            } catch (error) {
                alert(`Houve um erro: ${error.message}.`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar Pedido de Adoção';
            }
        });
    }
}