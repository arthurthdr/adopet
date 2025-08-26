// js/script.js

// Adiciona um "ouvinte" que espera todo o conteúdo do HTML ser carregado
document.addEventListener('DOMContentLoaded', function() {

    // --- LÓGICA DO CARROSSEL (PÁGINA INICIAL) ---
    const carouselTrack = document.getElementById('carousel-track');
    if (carouselTrack) {
        console.log("Página Inicial - Inicializando lógica do carousel.");
        const nextButton = document.getElementById('carousel-next');
        const prevButton = document.getElementById('carousel-prev');
        
        // Adiciona um evento de clique para levar para a página de adoção
        const carouselAdoptButtons = carouselTrack.querySelectorAll('.adopt-button');
        carouselAdoptButtons.forEach(button => {
            button.addEventListener('click', function() {
                window.location.href = 'adocao.html';
            });
        });

        // (A lógica de mover o carrossel que você já tinha pode ser mantida aqui se desejar)
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
function exibirAnimaisNaGrid(animais) {
    const grid = document.getElementById('animais-grid');
    grid.innerHTML = ''; // Limpa a mensagem "Carregando..."

    if (!animais || animais.length === 0) {
        grid.innerHTML = '<p>Nenhum animalzinho encontrado. Volte mais tarde!</p>';
        return;
    }

    animais.forEach(animal => {
        const card = document.createElement('div');
        card.className = 'animal-card';
        // Usamos atributos 'data-*' para guardar informações do animal no próprio HTML
        card.setAttribute('data-id', animal.id);
        card.setAttribute('data-nome', animal.nome);

        card.innerHTML = `
            <img src="${animal.img || 'img/placeholder_animal.png'}" alt="Foto de ${animal.nome}">
            <h3>${animal.nome}</h3>
            <p><i class="fas fa-venus-mars"></i> ${animal.sexo || 'Não informado'}</p>
            <p><i class="fas fa-paw"></i> Porte ${animal.porte || 'Não informado'}</p>
            <p><i class="fas fa-birthday-cake"></i> ${animal.idade !== null ? `${animal.idade} ano(s)` : 'Idade não informada'}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${animal.cidade || 'Cidade não informada'}, ${animal.estado || ''}</p>
            <button class="adopt-button page-link-button">Quero Adotar!</button>
        `;
        grid.appendChild(card);
    });

    // Depois que todos os cards estão na tela, adicionamos o evento de clique aos botões
    adicionarEventoAosBotoesAdotar();
}


/**
 * Encontra todos os botões "Quero Adotar!" e adiciona o evento de clique
 * para mostrar o formulário de adoção.
 */
function adicionarEventoAosBotoesAdotar() {
    const botoesAdotar = document.querySelectorAll('.animal-card .adopt-button');
    const formSection = document.getElementById('adocao-form-section');
    const formTitle = document.getElementById('adocao-form-title');

    botoesAdotar.forEach(botao => {
        botao.addEventListener('click', (event) => {
            const card = event.target.closest('.animal-card');
            const animalNome = card.dataset.nome; // Pega o nome do atributo data-nome

            // Atualiza o título do formulário
            formTitle.textContent = `Formulário de Adoção para ${animalNome}`;
            
            // Exibe o formulário e rola a tela até ele
            formSection.style.display = 'block';
            formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    botoesAdotar.forEach(botao => {
    botao.addEventListener('click', (event) => {
        const card = event.target.closest('.animal-card');
        const animalNome = card.dataset.nome;
        const animalId = card.dataset.id; // Pega o ID do animal

        // Atualiza o título do formulário
        formTitle.textContent = `Formulário de Adoção para ${animalNome}`;
        
        // NOVO: Coloca o ID do animal no campo escondido
        document.getElementById('animal-id-hidden-input').value = animalId;

        // Exibe o formulário e rola a tela até ele
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});




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
        formAdocao.addEventListener('submit', (event) => {
            event.preventDefault(); // Impede o comportamento padrão de recarregar a página
            
            const nomeAdotante = document.getElementById('nome-adotante').value;
            alert(`Obrigado, ${nomeAdotante}! Seu pedido de adoção foi enviado com sucesso. Entraremos em contato em breve.`);
            
            // Esconde e limpa o formulário após o envio
            formSection.style.display = 'none';
            formAdocao.reset();
        });
    }

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
        }}