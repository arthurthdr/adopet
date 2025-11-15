// js/admin-script.js

async function inicializarAdmin(supabaseClient) {
    if (!supabaseClient) {
        console.error("Admin-script: Cliente Supabase não recebido!");
        document.getElementById('admin-content').innerHTML = "<p style='color:red;'>Erro crítico: Falha ao carregar o sistema.</p>";
        return;
    }

    // --- 1. REFERÊNCIAS AOS ELEMENTOS DO DOM ---
    const animalForm = document.getElementById('animal-form');
    const animaisTableBody = document.getElementById('animais-table-body');
    const animalIdInput = document.getElementById('animal-id');
    const formTitle = document.getElementById('form-title');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const confirmModal = document.getElementById('confirm-modal');
    const pedidosContainer = document.getElementById('pedidos-container');

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
                .from('animais').select('*').order('id', { descending: true });
            if (error) throw error;

            animaisTableBody.innerHTML = '';
            if (animais.length === 0) {
                animaisTableBody.innerHTML = '<tr><td colspan="5">Nenhum animal cadastrado.</td></tr>';
            } else {
                animais.forEach(animal => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${animal.id}</td><td>${animal.nome}</td><td>${animal.especie}</td>
                        <td>${animal.idade !== null ? animal.idade : 'N/A'}</td>
                        <td class="actions">
                            <button class="btn-edit" data-id="${animal.id}">Editar</button>
                            <button class="btn-delete" data-id="${animal.id}">Excluir</button>
                        </td>`;
                    animaisTableBody.appendChild(tr);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar animais:', error);
            animaisTableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Falha ao carregar: ${error.message}</td></tr>`;
        }
    }

    function showConfirmationModal(title, text) {
        return new Promise((resolve) => {
            const modalTitle = document.getElementById('modal-title');
            const modalText = document.getElementById('modal-text');
            const modalConfirmBtn = document.getElementById('modal-confirm-btn');
            const modalCancelBtn = document.getElementById('modal-cancel-btn');
            modalTitle.textContent = title;
            modalText.textContent = text;
            confirmModal.classList.add('show');
            
            const close = (result) => {
                confirmModal.classList.remove('show');
                modalConfirmBtn.onclick = null;
                modalCancelBtn.onclick = null;
                resolve(result);
            };
            modalConfirmBtn.onclick = () => close(true);
            modalCancelBtn.onclick = () => close(false);
        });
    }

    async function carregarPedidosAdocao() {
        if (!pedidosContainer) return;
        pedidosContainer.innerHTML = '<p>Carregando pedidos...</p>';
        try {
            const { data: pedidos, error } = await supabaseClient
                .from('pedidos_adocao').select(`*, animais ( nome )`).order('created_at', { ascending: false });
            if (error) throw error;
            
            if (!pedidos || pedidos.length === 0) {
                pedidosContainer.innerHTML = '<p>Nenhum pedido de adoção encontrado.</p>';
                return;
            }
            pedidosContainer.innerHTML = '';
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
                    </div>`;
                pedidosContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            pedidosContainer.innerHTML = `<p style="color:red;">Erro: ${error.message}</p>`;
        }
    }

    async function atualizarStatusPedido(pedidoId, novoStatus, animalId) {
        const { error: updateError } = await supabaseClient.from('pedidos_adocao').update({ status: novoStatus }).eq('id', pedidoId);
        if (updateError) {
            alert(`Erro ao atualizar status: ${updateError.message}`);
            return;
        }
        if (novoStatus === 'aprovado' && animalId) {
            const { error: deleteError } = await supabaseClient.from('animais').delete().eq('id', animalId);
            if (deleteError) {
                alert(`Status atualizado, mas erro ao remover animal: ${deleteError.message}`);
            }
        }
        alert(`Pedido ${novoStatus} com sucesso!`);
        await carregarPedidosAdocao();
        await carregarAnimais();
    }

    // --- 3. EVENT LISTENERS ---

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

        if (button.classList.contains('btn-edit')) {
            const { data: animal, error } = await supabaseClient.from('animais').select('*').eq('id', animalId).single();
            if (error) { alert("Erro ao carregar dados: " + error.message); return; }
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
            const confirmed = await showConfirmationModal('Confirmar Exclusão', `Tem certeza que deseja excluir o animal com ID ${animalId}?`);
            if (confirmed) {
                const { error } = await supabaseClient.from('animais').delete().eq('id', animalId);
                if (error) { alert('Erro ao excluir: ' + error.message); } 
                else {
                    alert('Animal excluído com sucesso!');
                    await carregarAnimais();
                }
            }
        }
    });

    cancelEditButton.addEventListener('click', resetarFormulario);

    if (pedidosContainer) {
        pedidosContainer.addEventListener('click', async (event) => {
            const button = event.target.closest('button');
            if (!button) return;
            const pedidoId = button.dataset.id;
            if (!pedidoId) return;
            if (button.classList.contains('btn-approve')) {
                const animalId = button.dataset.animalId;
                const confirmed = await showConfirmationModal('Aprovar Pedido', 'Aprovar este pedido? O animal será removido da lista.');
                if (confirmed) await atualizarStatusPedido(pedidoId, 'aprovado', animalId);
            } else if (button.classList.contains('btn-reject')) {
                const confirmed = await showConfirmationModal('Rejeitar Pedido', 'Tem certeza que deseja rejeitar este pedido?');
                if (confirmed) await atualizarStatusPedido(pedidoId, 'rejeitado', null);
            }
        });
    }

    // --- 4. INICIALIZAÇÃO ---
    await carregarAnimais();
    await carregarPedidosAdocao();
}