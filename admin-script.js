document.addEventListener('DOMContentLoaded', async () => {
    // Garante que o script só roda na página de admin
    if (!document.getElementById('admin-content')) return;

    // A verificação de acesso vem aqui
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.user) {
        document.getElementById('admin-access-denied').textContent = 'Acesso negado. Faça login.';
        return;
    }
    const { data: userData } = await supabaseClient.from('usuarios').select('is_admin').eq('id', session.user.id).single();

    if (userData && userData.is_admin) {
        document.getElementById('admin-content').style.display = 'block';
        document.getElementById('admin-access-denied').style.display = 'none';
        // Chama a função principal que contém toda a lógica do admin
        inicializarFuncionalidadesAdmin();
    } else {
        document.getElementById('admin-access-denied').textContent = 'Acesso negado. Você não é admin.';
    }
});

async function inicializarAdmin(supabaseClient) {
    if (!supabaseClient) {
        console.error("Admin-script: Cliente Supabase não recebido!");
        return;
    }

    const animalForm = document.getElementById('animal-form');
    const animaisTableBody = document.getElementById('animais-table-body');
    const animalIdInput = document.getElementById('animal-id');
    const formTitle = document.getElementById('form-title');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const confirmModal = document.getElementById('confirm-modal');
    const pedidosContainer = document.getElementById('pedidos-container');

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
        // Renomeamos 'data' para 'animais' na desestruturação
        const { data: animais, error } = await supabaseClient
            .from('animais')
            .select('*')
            .order('id', { descending: true });

        if (error) throw error;

        animaisTableBody.innerHTML = '';
        
        // Verificamos se 'animais' é um array e tem conteúdo
        if (!animais || animais.length === 0) {
            animaisTableBody.innerHTML = '<tr><td colspan="5">Nenhum animal cadastrado.</td></tr>';
        } else {
            // Agora 'animais' é garantidamente um array
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
        animaisTableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Erro: ${error.message}</td></tr>`;
    }
}

    function showConfirmationModal(title, text) {
        return new Promise(resolve => {
            const mTitle = document.getElementById('modal-title'), mText = document.getElementById('modal-text'),
                  mConfirm = document.getElementById('modal-confirm-btn'), mCancel = document.getElementById('modal-cancel-btn');
            mTitle.textContent = title;
            mText.textContent = text;
            confirmModal.classList.add('show');
            const close = r => {
                confirmModal.classList.remove('show');
                mConfirm.onclick = null;
                mCancel.onclick = null;
                resolve(r);
            };
            mConfirm.onclick = () => close(true);
            mCancel.onclick = () => close(false);
        });
    }

    async function carregarPedidosAdocao() {
        if (!pedidosContainer) return;
        pedidosContainer.innerHTML = '<p>Carregando...</p>';
        try {
            const { data, error } = await supabaseClient.from('pedidos_adocao').select('*, animais(nome)').order('created_at', { ascending: false });
            if (error) throw error;
            if (!data || data.length === 0) {
                pedidosContainer.innerHTML = '<p>Nenhum pedido encontrado.</p>';
                return;
            }
            pedidosContainer.innerHTML = '';
            data.forEach(p => {
                const card = document.createElement('div');
                card.className = 'pedido-card';
                card.innerHTML = `<h4>Pedido para: ${p.animais?p.animais.nome:'Removido'}</h4><p><strong>Solicitante:</strong> ${p.nome_adotante}</p><p><strong>Status:</strong> <strong style="text-transform:uppercase;">${p.status}</strong></p><div class="actions">${p.status==='pendente'?`<button class="btn-approve" data-id="${p.id}" data-animal-id="${p.animal_id}">Aprovar</button><button class="btn-reject" data-id="${p.id}">Rejeitar</button>`:''}</div>`;
                pedidosContainer.appendChild(card);
            });
        } catch (e) {
            pedidosContainer.innerHTML = `<p style="color:red;">Erro: ${e.message}</p>`;
        }
    }

    async function atualizarStatusPedido(pedidoId, novoStatus, animalId) {
        const { error } = await supabaseClient.from('pedidos_adocao').update({ status: novoStatus }).eq('id', pedidoId);
        if (error) return alert(`Erro: ${error.message}`);
        if (novoStatus === 'aprovado' && animalId) {
            const { error: delError } = await supabaseClient.from('animais').delete().eq('id', animalId);
            if (delError) alert(`Status atualizado, mas erro ao remover animal: ${delError.message}`);
        }
        alert(`Pedido ${novoStatus} com sucesso!`);
        await carregarPedidosAdocao();
        await carregarAnimais();
    }

    animalForm.addEventListener('submit', async e => { e.preventDefault(); /* ...código do submit... */ });
    cancelEditButton.addEventListener('click', resetarFormulario);
    animaisTableBody.addEventListener('click', async e => { /* ...código dos cliques na tabela... */ });
    if (pedidosContainer) { pedidosContainer.addEventListener('click', async e => { /* ...código dos cliques nos pedidos... */ }); }

    await carregarAnimais();
    await carregarPedidosAdocao();
}