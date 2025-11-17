// js/admin-script.js - VERSÃO FINAL E COMPLETA

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabaseClient === 'undefined') {
        return console.error("Supabase client não encontrado. auth-ui.js precisa ser carregado antes.");
    }
    if (!document.getElementById('admin-content')) return;

    const adminContent = document.getElementById('admin-content');
    const accessDeniedMessage = document.getElementById('admin-access-denied');
    const logoutButton = document.getElementById('logout-button');

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session || !session.user) throw new Error('Usuário não logado.');

        const { data: userData, error } = await supabaseClient.from('usuarios').select('is_admin').eq('id', session.user.id).single();
        if (error || !userData || !userData.is_admin) throw new Error('Acesso negado. Você não é um administrador.');

        adminContent.style.display = 'block';
        accessDeniedMessage.style.display = 'none';
        inicializarPainelAdmin();
    } catch (err) {
        adminContent.style.display = 'none';
        accessDeniedMessage.style.display = 'block';
        accessDeniedMessage.textContent = err.message;
    }
    
    logoutButton.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });
});

function inicializarPainelAdmin() {
    // --- LÓGICA DE NAVEGAÇÃO POR ABAS ---
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

    // --- SEÇÃO DE GERENCIAMENTO DE ANIMAIS ---
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
        try {
            const { data, error } = await supabaseClient.from('animais').select('*').order('id', { descending: true });
            if (error) throw error;
            animaisTableBody.innerHTML = '';
            if (data.length === 0) {
                animaisTableBody.innerHTML = '<tr><td colspan="5">Nenhum animal cadastrado.</td></tr>';
            } else {
                data.forEach(a => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${a.id}</td><td>${a.nome}</td><td>${a.especie}</td><td>${a.idade != null ? a.idade : 'N/A'}</td><td class="actions"><button class="btn-edit" data-id="${a.id}">Editar</button><button class="btn-delete" data-id="${a.id}">Excluir</button></td>`;
                    animaisTableBody.appendChild(tr);
                });
            }
        } catch (e) {
            animaisTableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Erro: ${e.message}</td></tr>`;
        }
    };

    animalForm.addEventListener('submit', async e => {
        e.preventDefault();
        const submitButton = animalForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        let imageUrl = '';
        const animalId = animalIdInput.value;
        const file = imgUploadInput.files[0];

        if (file) {
            const fileName = `${Date.now()}-${file.name}`;
            const { data: uploadData, error: uploadError } = await supabaseClient.storage.from('imagens_animais').upload(fileName, file);
            if (uploadError) {
                alert('Erro ao fazer upload da imagem: ' + uploadError.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Salvar';
                return;
            }
            const { data: urlData } = supabaseClient.storage.from('imagens_animais').getPublicUrl(uploadData.path);
            imageUrl = urlData.publicUrl;
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
        if (imageUrl) {
            dadosAnimal.img = imageUrl;
        }

        try {
            const { error } = animalId
                ? await supabaseClient.from('animais').update(dadosAnimal).eq('id', animalId)
                : await supabaseClient.from('animais').insert([dadosAnimal]);
            if (error) throw error;
            alert('Animal salvo com sucesso!');
            resetarFormulario();
            carregarAnimais();
        } catch (error) {
            alert('Erro ao salvar os dados do animal: ' + error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    });

    cancelEditButton.addEventListener('click', resetarFormulario);

    animaisTableBody.addEventListener('click', async e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;

        if (btn.classList.contains('btn-edit')) {
            const { data, error } = await supabaseClient.from('animais').select('*').eq('id', id).single();
            if (error) return alert('Erro ao carregar dados do animal.');
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
        if (btn.classList.contains('btn-delete')) {
            const ok = await showConfirmationModal('Confirmar Exclusão', `Tem certeza que deseja excluir o animal com ID ${id}? Esta ação não pode ser desfeita.`);
            if (ok) {
                const { error } = await supabaseClient.from('animais').delete().eq('id', id);
                if (error) alert('Erro: ' + error.message);
                else { alert('Excluído com sucesso!'); carregarAnimais(); }
            }
        }
    });
    
    // --- SEÇÃO DE PEDIDOS DE ADOÇÃO ---
    const pedidosContainer = document.getElementById('pedidos-container');

    const carregarPedidosAdocao = async () => {
        if (!pedidosContainer) return;
        pedidosContainer.innerHTML = '<p>Carregando pedidos...</p>';
        try {
            const { data, error } = await supabaseClient
                .from('pedidos_adocao')
                .select('*, animais(nome, id)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            pedidosContainer.innerHTML = '';
            
            const pedidosPendentes = data.filter(p => p.status === 'pendente');
            const outrosPedidos = data.filter(p => p.status !== 'pendente');

            if (data.length === 0) {
                pedidosContainer.innerHTML = '<p>Nenhum pedido de adoção encontrado.</p>';
                return;
            }

            if(pedidosPendentes.length > 0) {
                pedidosPendentes.forEach(p => pedidosContainer.appendChild(criarCardPedido(p)));
            }
            if(outrosPedidos.length > 0) {
                 outrosPedidos.forEach(p => pedidosContainer.appendChild(criarCardPedido(p)));
            }
        } catch (e) {
            pedidosContainer.innerHTML = `<p style="color:red;">Erro ao carregar pedidos: ${e.message}</p>`;
        }
    };
    
    const criarCardPedido = (pedido) => {
        const card = document.createElement('div');
        card.className = `pedido-card status-${pedido.status}`;
        const animalInfo = pedido.animais ? `<strong>${pedido.animais.nome}</strong> (ID: ${pedido.animais.id})` : '<em>Animal não mais disponível</em>';
        const acoesHtml = pedido.status === 'pendente' && pedido.animais
            ? `<button class="btn-approve" data-id="${pedido.id}" data-animal-id="${pedido.animais.id}">Aprovar</button>
               <button class="btn-reject" data-id="${pedido.id}">Rejeitar</button>`
            : '';
        card.innerHTML = `<h4>Pedido para: ${animalInfo}</h4><div class="pedido-details"><p><strong>Solicitante:</strong> ${pedido.nome_adotante}</p><p><strong>Email:</strong> ${pedido.email_adotante}</p><p><strong>Telefone:</strong> ${pedido.telefone_adotante}</p><p><strong>Status:</strong> <span class="status-text">${pedido.status.toUpperCase()}</span></p></div><div class="actions">${acoesHtml}</div>`;
        return card;
    };

    const atualizarStatusPedido = async (pedidoId, novoStatus, animalId) => {
        const { error: updateError } = await supabaseClient.from('pedidos_adocao').update({ status: novoStatus }).eq('id', pedidoId);
        if (updateError) {
            alert(`Erro ao atualizar status do pedido: ${updateError.message}`);
            return;
        }

        if (novoStatus === 'aprovado' && animalId) {
            await supabaseClient.from('pedidos_adocao').update({ status: 'rejeitado' }).eq('animal_id', animalId).eq('status', 'pendente');
            const { error: deleteError } = await supabaseClient.from('animais').delete().eq('id', animalId);
            if (deleteError) {
                alert(`Status atualizado, mas erro ao remover animal: ${deleteError.message}`);
            }
        }
        
        alert(`Pedido #${pedidoId} foi marcado como "${novoStatus}"!`);
        await carregarPedidosAdocao();
        await carregarAnimais();
    };
    
    if (pedidosContainer) {
        pedidosContainer.addEventListener('click', async e => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const pedidoId = btn.dataset.id;
            const animalId = btn.dataset.animalId;
            if (btn.classList.contains('btn-approve')) {
                const ok = await showConfirmationModal('Aprovar Adoção?', `Isso removerá o animal da lista pública e rejeitará outros pedidos para ele. Deseja continuar?`);
                if (ok) await atualizarStatusPedido(pedidoId, 'aprovado', animalId);
            } else if (btn.classList.contains('btn-reject')) {
                const ok = await showConfirmationModal('Rejeitar Pedido?', `Tem certeza que deseja rejeitar este pedido de adoção?`);
                if (ok) await atualizarStatusPedido(pedidoId, 'rejeitado', null);
            }
        });
    }

    // --- SEÇÃO DE MENSAGENS DE CONTATO ---
    const mensagensContainer = document.getElementById('mensagens-container');

    const carregarMensagens = async () => {
        if (!mensagensContainer) return;
        mensagensContainer.innerHTML = '<p>Carregando mensagens...</p>';
        try {
            const { data, error } = await supabaseClient.from('mensagens_contato').select('*').order('created_at', { descending: true });
            if (error) throw error;
            mensagensContainer.innerHTML = '';
            if (data.length === 0) {
                mensagensContainer.innerHTML = '<p>Nenhuma mensagem de contato recebida.</p>';
            } else {
                data.forEach(msg => mensagensContainer.appendChild(criarCardMensagem(msg)));
            }
        } catch (e) {
            mensagensContainer.innerHTML = `<p style="color:red;">Erro ao carregar mensagens: ${e.message}</p>`;
        }
    };
    
    const criarCardMensagem = (msg) => {
        const card = document.createElement('div');
        card.className = `mensagem-card ${!msg.lida ? 'nao-lida' : ''}`;
        const dataFormatada = new Date(msg.created_at).toLocaleString('pt-BR');
        card.innerHTML = `<h4>${msg.assunto}</h4><div class="msg-meta">De: ${msg.nome} (${msg.email}) em ${dataFormatada}</div><div class="msg-body">${msg.mensagem}</div><div class="actions">${!msg.lida ? `<button class="btn-approve" data-id="${msg.id}">Marcar como Lida</button>` : ''}<button class="btn-delete" data-id="${msg.id}">Excluir</button></div>`;
        return card;
    };

    if (mensagensContainer) {
        mensagensContainer.addEventListener('click', async e => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const msgId = btn.dataset.id;
            if (btn.classList.contains('btn-approve')) { // Usando a classe 'btn-approve' para "Marcar como Lida"
                const { error } = await supabaseClient.from('mensagens_contato').update({ lida: true }).eq('id', msgId);
                if (error) alert('Erro ao marcar como lida: ' + error.message);
                else carregarMensagens();
            }
            if (btn.classList.contains('btn-delete')) {
                const ok = await showConfirmationModal('Excluir Mensagem?', 'Esta ação não pode ser desfeita.');
                if (ok) {
                    const { error } = await supabaseClient.from('mensagens_contato').delete().eq('id', msgId);
                    if (error) alert('Erro ao excluir: ' + error.message);
                    else carregarMensagens();
                }
            }
        });
    }

    // --- FUNÇÃO DO MODAL DE CONFIRMAÇÃO ---
    const showConfirmationModal = (title, text) => {
        return new Promise(resolve => {
            const modal = document.getElementById('confirm-modal');
            modal.querySelector('#modal-title').textContent = title;
            modal.querySelector('#modal-text').textContent = text;
            modal.classList.add('show');
            
            const confirmBtn = modal.querySelector('#modal-confirm-btn');
            const cancelBtn = modal.querySelector('#modal-cancel-btn');

            const close = (result) => {
                modal.classList.remove('show');
                // Clonar e substituir os botões para remover listeners antigos
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                const newCancelBtn = cancelBtn.cloneNode(true);
                cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
                
                resolve(result);
            };

            modal.querySelector('#modal-confirm-btn').onclick = () => close(true);
            modal.querySelector('#modal-cancel-btn').onclick = () => close(false);
        });
    };

    // --- CARREGAMENTO INICIAL DE DADOS ---
    carregarAnimais();
    carregarPedidosAdocao();
    carregarMensagens();
}