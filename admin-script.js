// js/admin-script.js

// A função `inicializarAdmin` é chamada uma única vez pelo admin.html
async function inicializarAdmin(supabaseClient) {
    if (!supabaseClient) {
        console.error("Admin-script: Cliente Supabase não recebido!");
        document.getElementById('admin-content').innerHTML = "<p style='color:red;'>Erro crítico.</p>";
        return;
    }

    // --- 1. REFERÊNCIAS AOS ELEMENTOS DO DOM ---
    const animalForm = document.getElementById('animal-form');
    const animaisTableBody = document.getElementById('animais-table-body');
    const animalIdInput = document.getElementById('animal-id');
    const formTitle = document.getElementById('form-title');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const confirmModal = document.getElementById('confirm-modal');

    // --- 2. DEFINIÇÕES DE FUNÇÕES ---

    function resetarFormulario() {
        animalForm.reset();
        animalIdInput.value = '';
        formTitle.textContent = 'Adicionar Novo Animal';
        cancelEditButton.style.display = 'none';
        animalForm.querySelector('button[type="submit"]').textContent = 'Salvar';
    }

    async function carregarAnimais() {
        animaisTableBody.innerHTML = '<tr><td colspan="5">Carregando animais...</td></tr>';
        try {
            const { data: animais, error } = await supabaseClient
                .from('animais')
                .select('*')
                .order('id', { descending: true });
            if (error) throw error;

            animaisTableBody.innerHTML = '';
            if (animais.length === 0) {
                animaisTableBody.innerHTML = '<tr><td colspan="5">Nenhum animal cadastrado.</td></tr>';
            } else {
                animais.forEach(animal => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${animal.id}</td>
                        <td>${animal.nome}</td>
                        <td>${animal.especie}</td>
                        <td>${animal.idade !== null ? animal.idade : 'N/A'}</td>
                        <td class="actions">
                            <button class="btn-edit" data-id="${animal.id}">Editar</button>
                            <button class="btn-delete" data-id="${animal.id}">Excluir</button>
                        </td>
                    `;
                    animaisTableBody.appendChild(tr);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar animais:', error);
            animaisTableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Falha ao carregar: ${error.message}</td></tr>`;
        }
    }

    // js/admin-script.js

function showConfirmationModal(title, text) {
    // Adicionamos logs em cada passo crítico
    console.log("1. showConfirmationModal foi chamada.");
    
    return new Promise((resolve) => {
        const modalEl = document.getElementById('confirm-modal');
        const modalTitleEl = document.getElementById('modal-title');
        const modalTextEl = document.getElementById('modal-text');
        const modalConfirmBtnEl = document.getElementById('modal-confirm-btn');
        const modalCancelBtnEl = document.getElementById('modal-cancel-btn');

        // Verificação crucial: Os elementos existem?
        if (!modalEl || !modalTitleEl || !modalTextEl || !modalConfirmBtnEl || !modalCancelBtnEl) {
            console.error("ERRO FATAL: Um ou mais elementos do modal não foram encontrados no HTML. Verifique os IDs!");
            resolve(false); // Resolve como falso para não travar a aplicação
            return;
        }
        console.log("2. Todos os elementos do modal foram encontrados.");

        modalTitleEl.textContent = title;
        modalTextEl.textContent = text;
        modalEl.classList.add('show');
        console.log("3. Classe 'show' adicionada. O modal deveria estar visível agora.");
        
        const close = (result) => {
            modalEl.classList.remove('show');
            modalConfirmBtnEl.onclick = null;
            modalCancelBtnEl.onclick = null;
            resolve(result);
        };

        modalConfirmBtnEl.onclick = () => close(true);
        modalCancelBtnEl.onclick = () => close(false);
    });
}

    // --- 3. EVENT LISTENERS ---
    // Ligados apenas UMA VEZ quando a página inicializa.

    // Listener para o ENVIO do formulário (Criar ou Atualizar)
    animalForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const dadosAnimal = {
            nome: document.getElementById('nome').value,
            especie: document.getElementById('especie').value,
            sexo: document.getElementById('sexo').value,
            porte: document.getElementById('porte').value,
            idade: document.getElementById('idade').value ? parseFloat(document.getElementById('idade').value) : null,
            estado: document.getElementById('estado').value,
            cidade: document.getElementById('cidade').value,
            img: document.getElementById('img').value,
            descricao: document.getElementById('descricao').value
        };
        const id = animalIdInput.value;
        let error;
        if (id) {
            const { error: updateError } = await supabaseClient.from('animais').update(dadosAnimal).eq('id', id);
            error = updateError;
        } else {
            const { error: insertError } = await supabaseClient.from('animais').insert([dadosAnimal]);
            error = insertError;
        }
        if (error) {
            alert('Erro ao salvar: ' + error.message);
        } else {
            alert('Animal salvo com sucesso!');
            resetarFormulario();
            await carregarAnimais();
        }
    });

    // Listener de DELEGAÇÃO para os CLICKS na tabela
    // js/admin-script.js

// Listener de DELEGAÇÃO para os CLICKS na tabela
animaisTableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const animalId = button.dataset.id;
    if (!animalId) return;

    // --- LOGS DE DIAGNÓSTICO ---
    console.log("--------------------");
    console.log("Botão clicado!");
    console.log("ID do animal:", animalId);
    console.log("Classes do botão:", button.className);
    
    // --- Lógica para o botão EDITAR ---
    if (button.classList.contains('btn-edit')) {
        console.log("--> Ação detectada: EDITAR");
        
        const { data: animal, error } = await supabaseClient.from('animais').select('*').eq('id', animalId).single();
        if (error) {
            alert("Erro ao carregar dados para edição: " + error.message);
            return;
        }
        animalIdInput.value = animal.id;
        document.getElementById('nome').value = animal.nome;
        document.getElementById('especie').value = animal.especie;
        document.getElementById('sexo').value = animal.sexo;
        document.getElementById('porte').value = animal.porte;
        document.getElementById('idade').value = animal.idade;
        document.getElementById('estado').value = animal.estado;
        document.getElementById('cidade').value = animal.cidade;
        document.getElementById('img').value = animal.img;
        document.getElementById('descricao').value = animal.descricao;
        formTitle.textContent = `Editando: ${animal.nome}`;
        animalForm.querySelector('button[type="submit"]').textContent = 'Atualizar';
        cancelEditButton.style.display = 'inline-block';
        animalForm.scrollIntoView({ behavior: 'smooth' });
    }

    // --- Lógica para o botão EXCLUIR ---
    if (button.classList.contains('btn-delete')) {
        console.log("--> Ação detectada: EXCLUIR");
        
        const confirmed = await showConfirmationModal('Confirmar Exclusão', `Tem certeza que deseja excluir o animal com ID ${animalId}?`);
        
        console.log("Modal foi confirmado?", confirmed); // Log para ver o resultado do modal
        
        if (confirmed) {
            const { error } = await supabaseClient.from('animais').delete().eq('id', animalId);
            if (error) {
                alert('Erro ao excluir: ' + error.message);
            } else {
                alert('Animal excluído com sucesso!');
                await carregarAnimais();
            }
        }
    }
});

    // Listener para o botão de CANCELAR edição
    cancelEditButton.addEventListener('click', resetarFormulario);
    
    // (A LÓGICA DE PEDIDOS DE ADOÇÃO PODE SER ADICIONADA AQUI SE NECESSÁRIO)

    // --- 4. INICIALIZAÇÃO ---
    // Chama a função para carregar os dados iniciais na tabela.
    await carregarAnimais();
}