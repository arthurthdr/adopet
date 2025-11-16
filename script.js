// js/script.js

document.addEventListener('DOMContentLoaded', function() {

    // --- LÓGICA 1: CARROSSEL (só executa se o elemento existir) ---
    const carouselTrack = document.getElementById('carousel-track');
    if (carouselTrack) {
        const carouselContainer = carouselTrack.closest('.carousel-container');
        if (carouselContainer) {
            let intervalId = null;

            function startAutoplay() {
                stopAutoplay(); // Garante que não haja múltiplos timers
                intervalId = setInterval(() => {
                    const slides = Array.from(carouselTrack.children);
                    if (slides.length === 0) return;

                    const slideWidth = slides[0].offsetWidth + (parseInt(window.getComputedStyle(slides[0]).marginRight) * 2);
                    let currentIndex = Math.round(carouselTrack.scrollLeft / slideWidth);
                    let nextIndex = currentIndex + 1;

                    // Lógica de loop
                    if (nextIndex >= slides.length) {
                        carouselTrack.scrollLeft = 0;
                    } else {
                        carouselTrack.scrollLeft = nextIndex * slideWidth;
                    }
                }, 3000); // Muda a cada 3 segundos
            }

            function stopAutoplay() {
                clearInterval(intervalId);
            }

            carouselContainer.addEventListener('mouseenter', stopAutoplay);
            carouselContainer.addEventListener('mouseleave', startAutoplay);
            
            const adoptButtons = carouselTrack.querySelectorAll('.adopt-button');
            adoptButtons.forEach(button => {
                button.addEventListener('click', () => window.location.href = 'adocao.html');
            });

            startAutoplay();
        }
    }
    
    // --- LÓGICA 2: PÁGINA DE ADOÇÃO (só executa se o elemento existir) ---
    const animaisGrid = document.getElementById('animais-grid');
    if (animaisGrid) {
        if (typeof supabaseClient === 'undefined') {
            animaisGrid.innerHTML = '<p style="color:red;">Erro crítico: Cliente Supabase não foi carregado.</p>';
            return;
        }

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


// ======================================================
// === FUNÇÕES DA PÁGINA DE ADOÇÃO ======================
// ======================================================

async function abrirFormularioParaAnimalEspecifico(animalId) {
    try {
        const { data: animal, error } = await supabaseClient.from('animais').select('id, nome').eq('id', animalId).single();
        if (error || !animal) {
            throw new Error(error?.message || "Animal não encontrado.");
        }
        const gridContainer = document.getElementById('animais-disponiveis');
        if (gridContainer) gridContainer.style.display = 'none';
        const formSection = document.getElementById('adocao-form-section');
        const formTitle = document.getElementById('adocao-form-title');
        formTitle.textContent = `Formulário de Adoção para ${animal.nome}`;
        document.getElementById('animal-id-hidden-input').value = animal.id;
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        alert("Erro ao preparar o formulário: " + error.message);
    }
}

async function buscarEExibirAnimais() {
    const grid = document.getElementById('animais-grid');
    grid.innerHTML = '<p>Buscando amiguinhos...</p>';
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
        card.setAttribute('data-id', animal.id);
        card.setAttribute('data-nome', animal.nome);
        card.setAttribute('data-porte', animal.porte);
        card.innerHTML = `
            <img src="${animal.img || 'img/placeholder_animal.png'}" alt="Foto de ${animal.nome}">
            <h3>${animal.nome}</h3>
            <p><i class="fas fa-paw"></i> Porte ${animal.porte || 'Não informado'}</p>
            <p><i class="fas fa-birthday-cake"></i> ${animal.idade !== null ? `${animal.idade} ano(s)` : 'Idade não informada'}</p>
            <button class="adopt-button page-link-button">Adicionar à Casinha <i class="fas fa-plus-circle"></i></button>
        `;
        grid.appendChild(card);
    });
    adicionarEventoAosBotoesAdotar();
}

function adicionarPetNaCasinha(animalData) {
    const casinha = getCasinha();
    const existe = casinha.some(animal => String(animal.id) === String(animalData.id));
    if (existe) {
        alert(`${animalData.nome} já está na sua casinha!`);
    } else {
        casinha.push(animalData);
        saveCasinha(casinha);
        alert(`${animalData.nome} foi adicionado(a) à sua casinha!`);
    }
}

function adicionarEventoAosBotoesAdotar() {
    document.querySelectorAll('#animais-grid .animal-card .adopt-button').forEach(botao => {
        botao.addEventListener('click', (event) => {
            const card = event.target.closest('.animal-card');
            const animalData = {
                id: card.dataset.id,
                nome: card.dataset.nome,
                img: card.querySelector('img').src,
                porte: card.dataset.porte
            };
            adicionarPetNaCasinha(animalData);
        });
    });
}

function configurarFormularioAdoção() {
    const formSection = document.getElementById('adocao-form-section');
    const formAdocao = document.getElementById('adocao-form');
    if (formAdocao) {
        const cancelButton = formAdocao.querySelector('.cancel-button');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                formSection.style.display = 'none';
                formAdocao.reset();
                const gridContainer = document.getElementById('animais-disponiveis');
                if(gridContainer) gridContainer.style.display = 'block'; // Mostra a galeria de volta
            });
        }
        formAdocao.addEventListener('submit', async (event) => {
            event.preventDefault();
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
                const gridContainer = document.getElementById('animais-disponiveis');
                if(gridContainer) gridContainer.style.display = 'block';
            } catch (error) {
                alert(`Houve um erro: ${error.message}.`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar Pedido de Adoção';
            }
        });
    }
}