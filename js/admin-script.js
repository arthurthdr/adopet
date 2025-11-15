async function inicializarAdmin(supabaseClient) {
    if (!supabaseClient) {
        console.error("Admin-script: Cliente Supabase não recebido!");
        document.getElementById('admin-content').innerHTML = "<p style='color:red;'>Erro crítico.</p>";
        return;
    }
    const animalForm = document.getElementById('animal-form');
    const animaisTableBody = document.getElementById('animais-table-body');
    const animalIdInput = document.getElementById('animal-id');
    const formTitle = document.getElementById('form-title');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const confirmModal = document.getElementById('confirm-modal');

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

// DENTRO DE admin-script.js

async function carregarPedidosAdocao() {
    // ...
    pedidos.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'pedido-card';
        card.innerHTML = `
            <h4>Pedido para: ${pedido.animais ? pedido.animais.nome : 'Animal removido'}</h4>
            <p><strong>Solicitante:</strong> ${pedido.nome_adotante}</p>
            <p><strong>Status:</strong> <strong style="text-transform: uppercase;">${pedido.status}</strong></p>
            <div class="actions">
                ${pedido.status === 'pendente' ? `
                    <button class="btn-approve" data-id="${pedido.id}" data-animal-id="${pedido.animal_id}">Aprovar</button>
                    <button class="btn-reject" data-id="${pedido.id}">Rejeitar</button>
                ` : ''}
            </div>
        `;
        pedidosContainer.appendChild(card);
    });
}


if (pedidosContainer) {
    pedidosContainer.addEventListener('click', async function(event) {
        const target = event.target;
        const pedidoId = target.dataset.id;
        if (!pedidoId) return;

        if (target.classList.contains('btn-approve')) {
            const animalId = target.dataset.animalId; // Pega o ID do animal do botão
            if (confirm('Tem certeza que deseja APROVAR este pedido? O animal será removido da lista de adoção.')) {
                await atualizarStatusPedido(pedidoId, 'aprovado', animalId);
            }
        } else if (target.classList.contains('btn-reject')) {
            if (confirm('Tem certeza que deseja REJEITAR este pedido?')) {
                await atualizarStatusPedido(pedidoId, 'rejeitado', null); // Não precisa do animalId para rejeitar
            }
        }
    });
}

function showConfirmationModal(title, text) {
    console.log("1. showConfirmationModal foi chamada.");
    
    return new Promise((resolve) => {
        const modalEl = document.getElementById('confirm-modal');
        const modalTitleEl = document.getElementById('modal-title');
        const modalTextEl = document.getElementById('modal-text');
        const modalConfirmBtnEl = document.getElementById('modal-confirm-btn');
        const modalCancelBtnEl = document.getElementById('modal-cancel-btn');

        if (!modalEl || !modalTitleEl || !modalTextEl || !modalConfirmBtnEl || !modalCancelBtnEl) {
            console.error("ERRO FATAL: Um ou mais elementos do modal não foram encontrados no HTML. Verifique os IDs!");
            resolve(false); 
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

   
animaisTableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const animalId = button.dataset.id;
    if (!animalId) return;

    console.log("--------------------");
    console.log("Botão clicado!");
    console.log("ID do animal:", animalId);
    console.log("Classes do botão:", button.className);
    
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

    if (button.classList.contains('btn-delete')) {
        console.log("--> Ação detectada: EXCLUIR");
        
        const confirmed = await showConfirmationModal('Confirmar Exclusão', `Tem certeza que deseja excluir o animal com ID ${animalId}?`);
        
        console.log("Modal foi confirmado?", confirmed); 
        
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

    cancelEditButton.addEventListener('click', resetarFormulario);
   
    await carregarAnimais();
}