// js/script.js

// Adiciona um "ouvinte" que espera todo o conteúdo do HTML ser carregado
document.addEventListener('DOMContentLoaded', function() {

    const urlParams = new URLSearchParams(window.location.search);
    const animalIdParaAdotar = urlParams.get('animalId');

    if (animalIdParaAdotar) {
        console.log("ID do animal recebido da casinha:", animalIdParaAdotar);
        // Se um ID foi passado, busca os dados desse animal e abre o formulário
        abrirFormularioParaAnimalEspecifico(animalIdParaAdotar);
    }
    // --- LÓGICA DO CARROSSEL (PÁGINA INICIAL) ---
    const carouselTrack = document.getElementById('carousel-track');
    if (carouselTrack) {
        console.log("Página Inicial - Inicializando lógica do carousel.");
        const nextButton = document.getElementById('carousel-next');
        const prevButton = document.getElementById('carousel-prev');
        const slides = Array.from(carouselTrack.children);
        
        // Verifica se há slides antes de continuar
        if (slides.length === 0) return;

        // Tenta obter a largura do slide + margem
        const slideStyle = window.getComputedStyle(slides[0]);
        const slideMarginRight = parseFloat(slideStyle.marginRight);
        const slideWidth = slides[0].getBoundingClientRect().width + slideMarginRight;
        let currentIndex = 0;

        // Função para mover os slides
        const moveToSlide = (track, targetIndex) => {
            const amountToMove = slideWidth * targetIndex;
            track.style.transform = 'translateX(-' + amountToMove + 'px)';
            currentIndex = targetIndex;
        };
        
        // Evento de clique no botão "Próximo"
        nextButton.addEventListener('click', () => {
            // *** ALTERAÇÃO PARA O LOOP INFINITO ***
            // Em vez de parar, usamos o operador de módulo (%) para voltar ao início.
            const nextIndex = (currentIndex + 1) % slides.length;
            moveToSlide(carouselTrack, nextIndex);
        });
        
        // Evento de clique no botão "Anterior"
        prevButton.addEventListener('click', () => {
            // *** ALTERAÇÃO PARA O LOOP INFINITO ***
            // Se estiver no primeiro, vai para o último.
            const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
            moveToSlide(carouselTrack, prevIndex);
        });

        // Adiciona um evento de clique nos botões "Quero Adotar" do carrossel
        const carouselAdoptButtons = carouselTrack.querySelectorAll('.adopt-button');
        carouselAdoptButtons.forEach(button => {
            button.addEventListener('click', function() {
                window.location.href = 'adocao.html';
            });
        });
    }


    // --- LÓGICA DA PÁGINA DE ADOÇÃO ---
    const animaisGrid = document.getElementById('animais-grid');
    if (animaisGrid) {
        // Se estamos na página de adoção, busca os animais do Supabase
        buscarEExibirAnimais();

        // Configura os botões do formulário de adoção
        configurarFormularioAdoção();
    }

});


/**
 * Busca os animais do Supabase e chama a função para exibi-los na tela.
 */
async function buscarEExibirAnimais() {
    const grid = document.getElementById('animais-grid');
    grid.innerHTML = '<p>Buscando amiguinhos...</p>';

    // `supabaseGlobalClient` é definido no HTML, antes de chamar este script
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
            throw error; // Joga o erro para o bloco catch
        }

        exibirAnimaisNaGrid(animais);

    } catch (error) {
        console.error('Erro ao buscar animais do Supabase:', error);
        grid.innerHTML = `<p style="color:red;">Não foi possível carregar os animais. Tente novamente mais tarde.</p>`;
    }
}


/**
 * Recebe uma lista de animais e cria os cards no HTML.
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
        // ADICIONAMOS MAIS DATA ATTRIBUTES AQUI
        card.setAttribute('data-id', animal.id);
        card.setAttribute('data-nome', animal.nome);
        card.setAttribute('data-porte', animal.porte); // Exemplo de outro dado

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


/**
 * Encontra todos os botões "Quero Adotar!" e adiciona o evento de clique
 * para mostrar o formulário de adoção.
 */
// DENTRO DO script.js

function adicionarPetNaCasinha(animalData) {
    const casinha = getCasinha();

    // Verifica se o animal já está na casinha para não adicionar duplicado
    const existe = casinha.some(animal => animal.id === animalData.id);

    if (existe) {
        alert(`${animalData.nome} já está na sua casinha!`);
    } else {
        casinha.push(animalData);
        saveCasinha(casinha);
        alert(`${animalData.nome} foi adicionado(a) à sua casinha!`);
    }
}

// SUBSTITUA A FUNÇÃO ANTIGA POR ESTA
function adicionarEventoAosBotoesAdotar() {
    const botoesAdotar = document.querySelectorAll('.animal-card .adopt-button');
    
    botoesAdotar.forEach(botao => {
        botao.addEventListener('click', (event) => {
            const card = event.target.closest('.animal-card');
            
            // Precisamos recriar o objeto do animal a partir dos dados no card
            // Para isso, precisamos adicionar mais atributos data-* no HTML do card
            const animalData = {
                id: card.dataset.id,
                nome: card.dataset.nome,
                img: card.querySelector('img').src,
                porte: card.dataset.porte
                // Adicione outros 'data-*' se quiser mostrar mais infos na casinha
            };
            
            adicionarPetNaCasinha(animalData);
        });
    });
}


/**
 * Configura o funcionamento dos botões e do envio do formulário de adoção.
 */
function configurarFormularioAdoção() {
    const formSection = document.getElementById('adocao-form-section');
    const formAdocao = document.getElementById('adocao-form');
    const cancelButton = document.getElementById('cancel-button');

    // Botão de Cancelar
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            formSection.style.display = 'none'; // Esconde a seção do formulário
            formAdocao.reset(); // Limpa os campos preenchidos
        });
    }

    // Envio do formulário
    if (formAdocao) {
        formAdocao.addEventListener('submit', async (event) => { // Tornamos a função async
            event.preventDefault(); // Impede o recarregamento da página

            const submitButton = formAdocao.querySelector('button[type="submit"]');
            submitButton.disabled = true; // Desabilita o botão para evitar cliques duplos
            submitButton.textContent = 'Enviando...';

            try {
                // 1. Coletar os dados do formulário
                const dadosPedido = {
                    nome_adotante: document.getElementById('nome-adotante').value,
                    email_adotante: document.getElementById('email-adotante').value,
                    telefone_adotante: document.getElementById('telefone-adotante').value,
                    mensagem_motivacao: document.getElementById('mensagem-adotante').value,
                    animal_id: document.getElementById('animal-id-hidden-input').value,
                    // O status será 'pendente' por padrão, como definimos no Supabase
                };

                // 2. Enviar para o Supabase
                const { error } = await supabaseGlobalClient
                    .from('pedidos_adocao')
                    .insert([dadosPedido]);

                if (error) {
                    throw error; // Joga o erro para o bloco catch
                }

                // 3. Sucesso!
                alert('Pedido de adoção enviado com sucesso! Nossa equipe analisará e entrará em contato em breve.');
                formSection.style.display = 'none';
                formAdocao.reset();

            } catch (error) {
                console.error('Erro ao enviar pedido de adoção:', error);
                alert(`Houve um erro ao enviar seu pedido: ${error.message}. Por favor, tente novamente.`);
            } finally {
                // Reabilita o botão, independentemente do resultado
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar Pedido de Adoção';
            }
        });
    }
}