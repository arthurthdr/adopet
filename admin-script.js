// js/admin-script.js

// Esta função será chamada pelo script inline na admin.html após a verificação de login
// js/admin-script.js

async function inicializarAdmin(supabaseClient) { // Recebe o cliente Supabase
    console.log("Admin-script: inicializarAdmin() chamado.", supabaseClient);

    if (!supabaseClient) {
        console.error("Admin-script: Cliente Supabase não recebido!");
        document.getElementById('admin-content').innerHTML = "<p style='color:red;'>Erro crítico: Falha ao carregar o sistema de administração.</p>";
        return;
    }

    // --- SEÇÃO DE GERENCIAMENTO DE ANIMAIS (Seu código original) ---

    const animalForm = document.getElementById('animal-form');
    const animaisTableBody = document.getElementById('animais-table-body');
    // ... (demais constantes para animais)

    // (Toda a sua lógica de carregarAnimais, resetarFormulario, e os listeners do formulário e da tabela de animais permanecem aqui)
    async function carregarAnimais() {
        console.log("Admin-script: carregarAnimais() chamado.");
        animaisTableBody.innerHTML = '<tr><td colspan="5">Carregando animais...</td></tr>';
        const { data: animais, error } = await supabaseClient
            .from('animais')
            .select('*')
            .order('nome', { ascending: true });

        if (error) {
            console.error('Admin-script: Erro ao carregar animais:', error);
            animaisTableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Erro ao carregar animais: ${error.message}</td></tr>`;
            return;
        }

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
    }

    // ... (listeners e outras funções de animais aqui, exatamente como estavam)
    // ... (animalForm.addEventListener, animaisTableBody.addEventListener, etc.)
    
    // (Seu código de formulário e tabela de animais aqui...)


    // --- NOVA SEÇÃO DE GERENCIAMENTO DE PEDIDOS DE ADOÇÃO ---

    const pedidosContainer = document.getElementById('pedidos-container');

    async function carregarPedidosAdocao() {
        if (!pedidosContainer) return;
        pedidosContainer.innerHTML = '<p>Carregando pedidos...</p>';

        const { data: pedidos, error } = await supabaseClient
            .from('pedidos_adocao')
            .select(`*, animais ( nome )`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao carregar pedidos:', error);
            pedidosContainer.innerHTML = `<p style="color:red;">Erro ao carregar pedidos: ${error.message}</p>`;
            return;
        }

        if (pedidos.length === 0) {
            pedidosContainer.innerHTML = '<p>Nenhum pedido de adoção encontrado.</p>';
            return;
        }

        pedidosContainer.innerHTML = '';
        pedidos.forEach(pedido => {
            const card = document.createElement('div');
            card.className = 'pedido-card';
            card.setAttribute('data-status', pedido.status);
            card.innerHTML = `
                <h4>Pedido para: ${pedido.animais ? pedido.animais.nome : 'Animal removido'}</h4>
                <p><strong>Solicitante:</strong> ${pedido.nome_adotante}</p>
                <p><strong>Email:</strong> ${pedido.email_adotante}</p>
                <p><strong>Telefone:</strong> ${pedido.telefone_adotante}</p>
                <p><strong>Motivação:</strong> ${pedido.mensagem_motivacao}</p>
                <p><strong>Status:</strong> <span style="font-weight: bold;">${pedido.status.toUpperCase()}</span></p>
                <div class="actions">
                    ${pedido.status === 'pendente' ? `
                        <button class="btn-approve" data-id="${pedido.id}">Aprovar</button>
                        <button class="btn-reject" data-id="${pedido.id}">Rejeitar</button>
                    ` : ''}
                </div>
            `;
            pedidosContainer.appendChild(card);
        });
    }

    async function atualizarStatusPedido(pedidoId, novoStatus) {
        const { error } = await supabaseClient
            .from('pedidos_adocao')
            .update({ status: novoStatus })
            .eq('id', pedidoId);

        if (error) {
            alert(`Erro ao atualizar status: ${error.message}`);
        } else {
            alert(`Pedido ${novoStatus} com sucesso!`);
            await carregarPedidosAdocao(); // Recarrega a lista
        }
    }

    if (pedidosContainer) {
        pedidosContainer.addEventListener('click', async function(event) {
            const target = event.target;
            const pedidoId = target.dataset.id;
            if (!pedidoId) return;

            if (target.classList.contains('btn-approve')) {
                if (confirm('Tem certeza que deseja APROVAR este pedido?')) {
                    await atualizarStatusPedido(pedidoId, 'aprovado');
                }
            } else if (target.classList.contains('btn-reject')) {
                if (confirm('Tem certeza que deseja REJEITAR este pedido?')) {
                    await atualizarStatusPedido(pedidoId, 'rejeitado');
                }
            }
        });
    }

    // --- INICIALIZAÇÃO ---
    // Carrega os dados iniciais de ambas as seções
    await carregarAnimais();
    await carregarPedidosAdocao();
}