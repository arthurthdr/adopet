document.addEventListener('DOMContentLoaded', async function() { // Tornamos o listener principal async

    // --- Lógica para a página de Adoção (adocao.html) ---
    const animaisGrid = document.getElementById('animais-grid');
    const adocaoFormSection = document.getElementById('adocao-form-section');
    const cancelButton = document.getElementById('cancel-button'); // Botão de cancelar do formulário

    // Variável para armazenar o cliente Supabase (será inicializado no HTML de adocao.html)
    // E passada para as funções que precisam dele.
    // Vamos assumir que uma variável global `supabaseGlobalClient` é criada no HTML da página de adoção.
    // Exemplo:
    // <script>
    //   const SUPABASE_URL = 'SUA_URL'; const SUPABASE_ANON_KEY = 'SUA_CHAVE';
    //   const supabaseGlobalClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // </script>
    // <script src="js/script.js"></script>

    let todosOsAnimaisDoSupabase = []; // Array para guardar os animais após carregar do Supabase

    // Função para buscar os animais do Supabase (NOVA)
    async function buscarAnimaisDoSupabase(supabaseClient) {
        if (!supabaseClient) {
            console.error("Cliente Supabase não está disponível para buscarAnimaisDoSupabase.");
            if (animaisGrid) animaisGrid.innerHTML = '<p style="color:red;">Erro de configuração.</p>';
            return [];
        }
        if (animaisGrid) animaisGrid.innerHTML = '<p>Buscando amiguinhos...</p>';

        const { data: animais, error } = await supabaseClient
            .from('animais')
            .select('*')
            .order('nome', { ascending: true });

        if (error) {
            console.error('Erro ao buscar animais do Supabase:', error);
            if (animaisGrid) animaisGrid.innerHTML = `<p style="color:red;">Não foi possível carregar os animais. (${error.message})</p>`;
            return [];
        }
        return animais || [];
    }

    // Função para criar o card do animal (SUA FUNÇÃO EXISTENTE)
    function criarCardAnimal(animal) { // Esta é a sua função original, verifique os campos
        const card = document.createElement('div');
        card.className = 'animal-card';
        // Ajuste os ícones e a estrutura se necessário, para bater com os dados do Supabase
        card.innerHTML = `
            <img src="${animal.img || 'img/placeholder_animal.png'}" alt="${animal.nome}">
            <h3>${animal.nome}</h3>
            <p><i class="fas fa-venus-mars"></i> ${animal.sexo || 'N/I'}</p> <!-- Ícone para sexo era fas fa-venus -->
            <p><i class="fas fa-paw"></i> ${animal.porte || 'N/I'}</p>
            <p><i class="fas fa-birthday-cake"></i> ${animal.idade !== null ? animal.idade : 'N/I'} ano(s)</p>
            <p><i class="fas fa-map-marker-alt"></i> ${animal.cidade || 'N/I'}, ${animal.estado || 'N/I'}</p>
            <button class="adopt-button page-link-button" data-id="${animal.id}" data-nome="${animal.nome}">Quero Adotar</button>
        `;
        // Adicionando listener ao botão "Quero Adotar" dentro do card
        const adoptButton = card.querySelector('.adopt-button');
        if (adoptButton) {
            adoptButton.addEventListener('click', function() {
                const animalId = this.dataset.id;
                const animalNome = this.dataset.nome;
                console.log(`Botão "Quero Adotar" clicado para o animal ID: ${animalId}, Nome: ${animalNome} (Grade na Adoção)`);
                if (adocaoFormSection) {
                    adocaoFormSection.style.display = 'block';
                    adocaoFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Poderia preencher um campo hidden com o ID do animal no formulário de adoção aqui
                } else {
                    console.error("Elemento #adocao-form-section NÃO encontrado para exibir.");
                }
            });
        }
        return card;
    }

    // Função para exibir os animais na grade (SUA FUNÇÃO EXISTENTE)
    function exibirAnimais(animaisParaExibir) {
        if (!animaisGrid) return; // Segurança
        animaisGrid.innerHTML = ''; // Limpa os resultados anteriores
        if (animaisParaExibir.length === 0) {
            animaisGrid.innerHTML = '<p>Nenhum animal encontrado com os critérios selecionados.</p>';
            return;
        }
        animaisParaExibir.forEach(animal => {
            const card = criarCardAnimal(animal);
            animaisGrid.appendChild(card);
        });
        // A lógica de adicionar listeners aos botões foi movida para dentro de criarCardAnimal
    }


    // --- Lógica para a página de Adoção (adocao.html) ---
    if (animaisGrid) { // Verifica se a grade existe, indicando que é a página adocao.html
        console.log("Página de Adoção - Inicializando lógica da grade e formulário.");
        const estadoSelect = document.getElementById('estado');
        const cidadeSelect = document.getElementById('cidade');
        const especieSelect = document.getElementById('especie');
        const btnFiltrar = document.getElementById('btnFiltrar');

        if (adocaoFormSection) console.log("Elemento #adocao-form-section encontrado.");
        else console.error("Elemento #adocao-form-section NÃO encontrado!");

        if (cancelButton) console.log("Elemento #cancel-button encontrado.");
        else console.error("Elemento #cancel-button NÃO encontrado!");


        // Adiciona listener ao botão Filtrar na página de Adoção
        if (btnFiltrar) {
             btnFiltrar.addEventListener('click', function() {
                 console.log("Botão Filtrar clicado.");
                 const estadoSelecionado = estadoSelect ? estadoSelect.value : "";
                 const cidadeSelecionada = cidadeSelect ? cidadeSelect.value : "";
                 const especieSelecionada = especieSelect ? especieSelect.value : "";

                 // Filtra a lista `todosOsAnimaisDoSupabase` que já foi carregada
                 const animaisFiltrados = todosOsAnimaisDoSupabase.filter(animal => {
                     let match = true;
                     if (estadoSelecionado && (!animal.estado || animal.estado.toUpperCase() !== estadoSelecionado.toUpperCase())) {
                         match = false;
                     }
                     if (cidadeSelecionada && (!animal.cidade || animal.cidade.toLowerCase() !== cidadeSelecionada.toLowerCase())) {
                         match = false;
                     }
                     if (especieSelecionada && animal.especie !== especieSelecionada) {
                         match = false;
                     }
                     return match;
                 });
                 exibirAnimais(animaisFiltrados);
                 console.log(`Filtro aplicado. Exibindo ${animaisFiltrados.length} animais.`);
             });
        }

        // Adiciona listener ao botão Cancelar do formulário
        if (cancelButton && adocaoFormSection) {
             cancelButton.addEventListener('click', function() {
                  console.log("Botão Cancelar formulário clicado. Ocultando formulário.");
                  adocaoFormSection.style.display = 'none';
                  const form = document.getElementById('adocao-form');
                  if (form) form.reset();
             });
        }

        // Lógica para o formulário de adoção (envio)
        const formAdocao = document.getElementById('adocao-form');
        if (formAdocao) {
            formAdocao.addEventListener('submit', function(event) {
                event.preventDefault();
                const nomeAdotante = document.getElementById('nome').value; // Supondo ID 'nome' no form
                alert(`Obrigado, ${nomeAdotante}! Sua solicitação de adoção foi enviada (simulação). Entraremos em contato.`);
                if(adocaoFormSection) adocaoFormSection.style.display = 'none';
                formAdocao.reset();
            });
        }


        // CARREGAR OS DADOS DO SUPABASE E EXIBIR INICIALMENTE
        // Esta chamada espera que `supabaseGlobalClient` seja definido no HTML da página `adocao.html`
        if (typeof supabaseGlobalClient !== 'undefined') {
            todosOsAnimaisDoSupabase = await buscarAnimaisDoSupabase(supabaseGlobalClient);
            exibirAnimais(todosOsAnimaisDoSupabase); // Exibe todos inicialmente
            console.log(`Carregados ${todosOsAnimaisDoSupabase.length} animais do Supabase.`);
        } else {
            console.error("supabaseGlobalClient não está definido. Não foi possível carregar animais da página de adoção.");
            if(animaisGrid) animaisGrid.innerHTML = "<p style='color:red;'>Erro de configuração: Falha ao carregar dados dos animais.</p>";
        }
    }


    // --- Lógica para a página Inicial (index.html) - Contém o Carousel ---
    const carouselTrack = document.getElementById('carousel-track');
    if (carouselTrack) {
        console.log("Página Inicial - Inicializando lógica do carousel.");
        const slides = Array.from(carouselTrack.children);
        const nextButton = document.getElementById('carousel-next');
        const prevButton = document.getElementById('carousel-prev');
        let currentSlideIndex = 0;
        let slideWidth = 0;

        function setupCarousel() {
            if (slides.length > 0) {
                const slideStyle = getComputedStyle(slides[0]);
                const marginHorizontal = parseFloat(slideStyle.marginLeft) + parseFloat(slideStyle.marginRight);
                slideWidth = slides[0].getBoundingClientRect().width + marginHorizontal;
                slides.forEach((slide, index) => {
                    slide.style.left = slideWidth * index + 'px';
                });
                moveSlide(carouselTrack, currentSlideIndex);
            }
        }

        function moveSlide(track, targetSlideIndex) {
            if (slides.length > 0 && track) {
                const targetPosition = slides[targetSlideIndex].style.left;
                track.style.transform = 'translateX(-' + targetPosition + ')';
                currentSlideIndex = targetSlideIndex;
            }
        }

        if (nextButton && prevButton && carouselTrack) {
            nextButton.addEventListener('click', () => {
                if (slides.length > 0) {
                    currentSlideIndex = (currentSlideIndex + 1) % slides.length;
                    moveSlide(carouselTrack, currentSlideIndex);
                }
            });
            prevButton.addEventListener('click', () => {
                if (slides.length > 0) {
                    currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
                    moveSlide(carouselTrack, currentSlideIndex);
                }
            });

            const carouselAdoptButtons = carouselTrack.querySelectorAll('.adopt-button');
            carouselAdoptButtons.forEach(button => {
                button.addEventListener('click', function() {
                    window.location.href = 'adocao.html';
                });
            });
        }
        
        if (slides.length > 0) { // Só configura se houver slides
            setupCarousel();
            window.addEventListener('resize', setupCarousel);
        } else {
            console.warn("Carousel track encontrado, mas sem slides dentro dele.");
        }
    }
});