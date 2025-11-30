// js/admin-script.js - VERSÃO FINAL COM NOTIFICAÇÕES

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificações Iniciais
    if (!window.supabaseClient) {
        console.error("Supabase client não encontrado. auth-ui.js precisa ser carregado antes.");
        return;
    }
    if (!document.getElementById('admin-content')) return;

    const adminContent = document.getElementById('admin-content');
    const accessDeniedMessage = document.getElementById('admin-access-denied');
    const logoutButton = document.getElementById('logout-button');

    // 2. Verificação de Segurança (Admin)
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session || !session.user) throw new Error('Usuário não logado.');

        // Verifica na tabela usuarios se é admin
        const { data: userData, error } = await window.supabaseClient
            .from('usuarios')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        if (error || !userData || !userData.is_admin) throw new Error('Acesso negado.');

        adminContent.style.display = 'block';
        accessDeniedMessage.style.display = 'none';
        inicializarPainelAdmin(); // Inicia a lógica

    } catch (err) {
        adminContent.style.display = 'none';
        accessDeniedMessage.style.display = 'block';
        console.error(err);
    }
    
    // Logout do Admin
    if(logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await window.supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });
    }
});

function inicializarPainelAdmin() {
    // --- NAVEGAÇÃO POR ABAS ---
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.dataset.tab;
            tabLinks.forEach(item => item.classList.remove('active'));
            tabContents.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(tabId + '-content').classList.add('active');
        });
    });

    // ============================================================
    // === 1. GERENCIAMENTO DE ANIMAIS (CRUD) ===
    // ============================================================
    const animalForm = document.getElementById('animal-form');
    const animaisTableBody = document.getElementById('animais-table-body');
    const animalIdInput = document.getElementById('animal-id');
    const formTitle = document.getElementById('form-title');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const imgUploadInput = document.getElementById('img-upload');

    const resetarFormulario = () => {
        animalForm.reset();
        animalIdInput.value = '';
        formTitle.textContent = 'Adicionar Animal';
        cancelEditButton.style.display = 'none';
        animalForm.querySelector('button[type="submit"]').textContent = 'Salvar';
    };

    const carregarAnimais = async () => {
        animaisTableBody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
        const { data, error } = await window.supabaseClient.from('animais').select('*').order('id', { descending: true });
        
        animaisTableBody.innerHTML = '';
        if (error || !data || data.length === 0) {
            animaisTableBody.innerHTML = '<tr><td colspan="5">Nenhum animal cadastrado.</td></tr>';
        } else {
            data.forEach(a => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${a.id}</td><td>${a.nome}</td><td>${a.especie}</td><td>${a.idade || '-'}</td><td class="actions"><button class="btn-edit" data-id="${a.id}">Editar</button><button class="btn-delete" data-id="${a.id}">Excluir</button></td>`;
                animaisTableBody.appendChild(tr);
            });
        }
    };

    if (animalForm) {
        animalForm.addEventListener('submit', async e => {
            e.preventDefault();
            const submitButton = animalForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            let imageUrl = '';
            const animalId = animalIdInput.value;
            const file = imgUploadInput.files[0];

            // Upload de Imagem
            if (file) {
                const fileName = `${Date.now()}-${file.name}`;
                const { data: uploadData, error: uploadError } = await window.supabaseClient.storage.from('imagens_animais').upload(fileName, file);
                if (!uploadError) {
                    const { data: urlData } = window.supabaseClient.storage.from('imagens_animais').getPublicUrl(uploadData.path);
                    imageUrl = urlData.publicUrl;
                }
            }

            const dadosAnimal = {
                nome: document.getElementById('nome').value,
                especie: document.getElementById('especie').value,
                sexo: document.getElementById('sexo').value,
                porte: document.getElementById('porte').value,
                idade: document.getElementById('idade').value ? parseFloat(document.getElementById('idade').value) : null,
                estado: document.getElementById('estado').value,
                cidade: document.getElementById('cidade').value,
                descricao: document.getElementById('descricao').value,
            };
            if (imageUrl) dadosAnimal.img = imageUrl;

            const { error } = animalId
                ? await window.supabaseClient.from('animais').update(dadosAnimal).eq('id', animalId)
                : await window.supabaseClient.from('animais').insert([dadosAnimal]);

            if (!error) {
                alert('Salvo com sucesso!');
                resetarFormulario();
                carregarAnimais();
            } else {
                alert('Erro: ' + error.message);
            }
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        });

        cancelEditButton.addEventListener('click', resetarFormulario);

        // Ações da Tabela (Editar/Excluir)
        animaisTableBody.addEventListener('click', async e => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.dataset.id;

            if (btn.classList.contains('btn-edit')) {
                const { data } = await window.supabaseClient.from('animais').select('*').eq('id', id).single();
                if (data) {
                    animalIdInput.value = data.id;
                    document.getElementById('nome').value = data.nome || '';
                    document.getElementById('especie').value = data.especie || '';
                    document.getElementById('sexo').value = data.sexo || '';
                    document.getElementById('porte').value = data.porte || '';
                    document.getElementById('idade').value = data.idade || '';
                    document.getElementById('estado').value = data.estado || '';
                    document.getElementById('cidade').value = data.cidade || '';
                    document.getElementById('descricao').value = data.descricao || '';
                    formTitle.textContent = `Editando: ${data.nome}`;
                    animalForm.querySelector('button[type="submit"]').textContent = 'Atualizar';
                    cancelEditButton.style.display = 'inline-block';
                    animalForm.scrollIntoView({ behavior: 'smooth' });
                }
            }
            if (btn.classList.contains('btn-delete')) {
                if (confirm('Tem certeza que deseja excluir?')) {
                    await window.supabaseClient.from('animais').delete().eq('id', id);
                    carregarAnimais();
                }
            }
        });
    }

    // ============================================================
    // === 2. PEDIDOS DE ADOÇÃO (COM NOTIFICAÇÕES) ===
    // ============================================================
    const pedidosContainer = document.getElementById('pedidos-container');

    const carregarPedidosAdocao = async () => {
        if (!pedidosContainer) return;
        pedidosContainer.innerHTML = '<p>Carregando pedidos...</p>';
        
        // Busca pedidos e traz junto o nome do animal
        const { data, error } = await window.supabaseClient
            .from('pedidos_adocao')
            .select('*, animais(nome, id)')
            .order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
            pedidosContainer.innerHTML = '<p>Nenhum pedido de adoção no momento.</p>';
            return;
        }

        pedidosContainer.innerHTML = '';
        data.forEach(p => {
            const nomePet = p.animais ? p.animais.nome : 'Animal não encontrado (Removido)';
            const card = document.createElement('div');
            card.className = `pedido-card status-${p.status}`;
            
            // Botões só aparecem se estiver Pendente
            let botoesHtml = '';
            if (p.status === 'pendente') {
                botoesHtml = `
                    <div class="actions">
                        <button class="btn-approve" 
                            data-id="${p.id}" 
                            data-animal-id="${p.animal_id}" 
                            data-user-id="${p.user_id}"
                            data-nome-pet="${nomePet}">Aprovar Adoção</button>
                        <button class="btn-reject" 
                            data-id="${p.id}"
                            data-user-id="${p.user_id}"
                            data-nome-pet="${nomePet}">Rejeitar</button>
                    </div>
                `;
            }

            card.innerHTML = `
                <h4>Pedido para: <strong>${nomePet}</strong></h4>
                <div class="pedido-info">
                    <p><strong>Solicitante:</strong> ${p.nome_adotante}</p>
                    <p><strong>CPF:</strong> ${p.cpf || '-'} | <strong>Cidade:</strong> ${p.cidade || '-'}</p>
                    <p><strong>Telefone:</strong> ${p.telefone_adotante}</p>
                    <p><strong>Motivo:</strong> ${p.mensagem_motivacao}</p>
                    <p><strong>Status:</strong> <span class="status-badge">${p.status.toUpperCase()}</span></p>
                </div>
                ${botoesHtml}
            `;
            pedidosContainer.appendChild(card);
        });
    };

    // Lógica de Decisão (Aprovar/Rejeitar)
    const processarDecisaoAdocao = async (pedidoId, decisao, animalId, userId, nomeAnimal) => {
        const loadingMsg = decisao === 'aprovado' ? 'Processando Aprovação...' : 'Rejeitando...';
        console.log(loadingMsg);

        try {
            if (decisao === 'aprovado') {
                // 1. Notificar Usuário
                await window.supabaseClient.from('notificacoes').insert([{
                    user_id: userId,
                    mensagem: `PARABÉNS! Seu pedido de adoção para ${nomeAnimal} foi APROVADO! Nossa equipe entrará em contato pelo telefone informado para combinar a busca.`
                }]);

                // 2. Apagar o Animal (Adotado!)
                const { error: errAnimal } = await window.supabaseClient.from('animais').delete().eq('id', animalId);
                if (errAnimal) throw new Error('Erro ao remover animal: ' + errAnimal.message);

                // 3. Apagar o Pedido
                await window.supabaseClient.from('pedidos_adocao').delete().eq('id', pedidoId);

                alert(`Sucesso! ${nomeAnimal} foi adotado e removido do site. O usuário foi notificado.`);
            } else {
                // REJEITADO
                // 1. Notificar Usuário
                await window.supabaseClient.from('notificacoes').insert([{
                    user_id: userId,
                    mensagem: `Olá. Agradecemos seu interesse em adotar ${nomeAnimal}, mas infelizmente seu pedido não pôde ser aceito neste momento.`
                }]);

                // 2. Apagar o Pedido
                await window.supabaseClient.from('pedidos_adocao').delete().eq('id', pedidoId);

                alert('Pedido rejeitado. O usuário foi notificado.');
            }

            // Recarregar listas
            carregarPedidosAdocao();
            carregarAnimais();

        } catch (error) {
            alert('Erro ao processar: ' + error.message);
            console.error(error);
        }
    };

    // Event Listener dos Botões de Pedido
    if (pedidosContainer) {
        pedidosContainer.addEventListener('click', async e => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const id = btn.dataset.id;
            const animalId = btn.dataset.animalId;
            const userId = btn.dataset.userId;
            const nomePet = btn.dataset.nomePet;

            if (btn.classList.contains('btn-approve')) {
                if (confirm(`Confirmar adoção de ${nomePet}? O animal será removido da lista pública.`)) {
                    await processarDecisaoAdocao(id, 'aprovado', animalId, userId, nomePet);
                }
            } else if (btn.classList.contains('btn-reject')) {
                if (confirm(`Rejeitar pedido para ${nomePet}?`)) {
                    await processarDecisaoAdocao(id, 'rejeitado', null, userId, nomePet);
                }
            }
        });
    }

    // ============================================================
    // === 3. MENSAGENS DE CONTATO ===
    // ============================================================
    const mensagensContainer = document.getElementById('mensagens-container');

    const carregarMensagens = async () => {
        if (!mensagensContainer) return;
        mensagensContainer.innerHTML = '<p>Carregando...</p>';
        const { data, error } = await window.supabaseClient.from('mensagens_contato').select('*').order('created_at', { descending: true });
        
        mensagensContainer.innerHTML = '';
        if (error || !data || data.length === 0) {
            mensagensContainer.innerHTML = '<p>Nenhuma mensagem.</p>';
        } else {
            data.forEach(msg => {
                const card = document.createElement('div');
                card.className = `mensagem-card ${msg.lida ? '' : 'nao-lida'}`;
                card.innerHTML = `
                    <h4>${msg.assunto}</h4>
                    <p><small>${msg.email} - ${new Date(msg.created_at).toLocaleString()}</small></p>
                    <p>${msg.mensagem}</p>
                    <div class="actions">
                        ${!msg.lida ? `<button class="btn-approve" data-id="${msg.id}">Marcar como Lida</button>` : '<span>(Lida)</span>'}
                        <button class="btn-delete" data-id="${msg.id}">Excluir</button>
                    </div>
                `;
                mensagensContainer.appendChild(card);
            });
        }
    };

    if (mensagensContainer) {
        mensagensContainer.addEventListener('click', async e => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.dataset.id;

            if (btn.classList.contains('btn-approve')) {
                await window.supabaseClient.from('mensagens_contato').update({ lida: true }).eq('id', id);
                carregarMensagens();
            }
            if (btn.classList.contains('btn-delete')) {
                if (confirm('Excluir mensagem?')) {
                    await window.supabaseClient.from('mensagens_contato').delete().eq('id', id);
                    carregarMensagens();
                }
            }
        });
    }

    // --- CARREGAMENTO INICIAL DE DADOS ---
    carregarAnimais();
    carregarPedidosAdocao();
    carregarMensagens();
}