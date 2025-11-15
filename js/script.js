document.addEventListener('DOMContentLoaded', function() {

    const urlParams = new URLSearchParams(window.location.search);
    const animalIdParaAdotar = urlParams.get('animalId');

    if (animalIdParaAdotar) {
        console.log("ID do animal recebido da casinha:", animalIdParaAdotar);
        abrirFormularioParaAnimalEspecifico(animalIdParaAdotar);
    }
    const carouselTrack = document.getElementById('carousel-track');
    if (carouselTrack) {
        console.log("Página Inicial - Inicializando lógica do carousel.");
        const nextButton = document.getElementById('carousel-next');
        const prevButton = document.getElementById('carousel-prev');
        const slides = Array.from(carouselTrack.children);
        
        if (slides.length === 0) return;

        const slideStyle = window.getComputedStyle(slides[0]);
        const slideMarginRight = parseFloat(slideStyle.marginRight);
        const slideWidth = slides[0].getBoundingClientRect().width + slideMarginRight;
        let currentIndex = 0;

        const moveToSlide = (track, targetIndex) => {
            const amountToMove = slideWidth * targetIndex;
            track.style.transform = 'translateX(-' + amountToMove + 'px)';
            currentIndex = targetIndex;
        };
        
        nextButton.addEventListener('click', () => {
            const nextIndex = (currentIndex + 1) % slides.length;
            moveToSlide(carouselTrack, nextIndex);
        });
        
        prevButton.addEventListener('click', () => {
            const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
            moveToSlide(carouselTrack, prevIndex);
        });

        const carouselAdoptButtons = carouselTrack.querySelectorAll('.adopt-button');
        carouselAdoptButtons.forEach(button => {
            button.addEventListener('click', function() {
                window.location.href = 'adocao.html';
            });
        });
    }


    const animaisGrid = document.getElementById('animais-grid');
    if (animaisGrid) {
        buscarEExibirAnimais();
        configurarFormularioAdoção();
    }

});



async function buscarEExibirAnimais() {
    const grid = document.getElementById('animais-grid');
    grid.innerHTML = '<p>Buscando amiguinhos...</p>';
    if (typeof supabaseGlobalClient === 'undefined') {
        console.error("Cliente Supabase não encontrado. Verifique o script no HTML.");
        grid.innerHTML = '<p style="color:red;">Erro de configuração. Não foi possível conectar ao banco de dados.</p>';
        return;
    }

    try {
        const { data: animais, error } = await supabaseGlobalClient
            .from('animais')
            .select('*')
            .order('nome', { ascending: true });

        if (error) {
            throw error; 
        }

        exibirAnimaisNaGrid(animais);

    } catch (error) {
        console.error('Erro ao buscar animais do Supabase:', error);
        grid.innerHTML = `<p style="color:red;">Não foi possível carregar os animais. Tente novamente mais tarde.</p>`;
    }
}


/**
 * @param {Array} animais - A lista de objetos de animais.
 */
// DENTRO DO script.js -> exibirAnimaisNaGrid

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
            <!-- MUDAMOS O BOTÃO -->
            <button class="adopt-button page-link-button">Adicionar à Casinha <i class="fas fa-plus-circle"></i></button>
        `;
        grid.appendChild(card);
    });

    adicionarEventoAosBotoesAdotar();
}

function adicionarPetNaCasinha(animalData) {
    const casinha = getCasinha();

    const existe = casinha.some(animal => animal.id === animalData.id);

    if (existe) {
        alert(`${animalData.nome} já está na sua casinha!`);
    } else {
        casinha.push(animalData);
        saveCasinha(casinha);
        alert(`${animalData.nome} foi adicionado(a) à sua casinha!`);
    }
}
function adicionarEventoAosBotoesAdotar() {
    const botoesAdotar = document.querySelectorAll('.animal-card .adopt-button');
    
    botoesAdotar.forEach(botao => {
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
    const cancelButton = document.getElementById('cancel-button');

    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            formSection.style.display = 'none'; 
            formAdocao.reset(); 
        });
    }
    if (formAdocao) {
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

                const { error } = await supabaseGlobalClient
                    .from('pedidos_adocao')
                    .insert([dadosPedido]);
                if (error) {
                    throw error;
                }
                alert('Pedido de adoção enviado com sucesso! Nossa equipe analisará e entrará em contato em breve.');
                formSection.style.display = 'none';
                formAdocao.reset();

            } catch (error) {
                console.error('Erro ao enviar pedido de adoção:', error);
                alert(`Houve um erro ao enviar seu pedido: ${error.message}. Por favor, tente novamente.`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar Pedido de Adoção';
            }
        });
    }
}