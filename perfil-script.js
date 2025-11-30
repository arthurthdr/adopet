// js/perfil-script.js - VERSÃO FINAL COM UPLOAD DE FOTO

document.addEventListener('DOMContentLoaded', async () => {
    
    // Verifica conexão
    if (!window.supabaseClient) return;

    // Elementos da Tela
    const profilePageContent = document.getElementById('profile-page-content');
    const loginPrompt = document.getElementById('login-prompt');
    const loadingMessage = document.getElementById('loading-message');
    const profileCardView = document.getElementById('profile-card-view');
    
    // Elementos de Exibição
    const avatarImg = document.getElementById('avatar-img');
    const usernameDisplay = document.getElementById('username-display');
    const emailDisplay = document.getElementById('email-display');
    const bioDisplay = document.getElementById('bio-display');

    // Elementos do Formulário
    const profileForm = document.getElementById('profile-form');
    const usernameInput = document.getElementById('username-input');
    const bioInput = document.getElementById('bio-input');
    
    // NOVOS ELEMENTOS DE UPLOAD
    const fileInput = document.getElementById('avatar-upload');
    const hiddenUrlInput = document.getElementById('current-avatar-url');

    const profileDataDisplay = document.querySelector('.profile-data-display');
    const mainActions = document.getElementById('main-profile-actions');

    let currentUser = null;

    // --- 1. VERIFICAÇÃO DE SESSÃO ---
    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (session && session.user) {
        currentUser = session.user;
        if(loginPrompt) loginPrompt.style.display = 'none';
        if(profilePageContent) profilePageContent.style.display = 'block';
        
        await carregarPerfil(currentUser);
        // Tenta carregar notificações se a função existir (opcional para evitar erros)
        if (typeof carregarNotificacoes === 'function') await carregarNotificacoes(currentUser.id);

    } else {
        if(profilePageContent) profilePageContent.style.display = 'none';
        if(loginPrompt) loginPrompt.style.display = 'block';
    }

    // --- 2. CARREGAR PERFIL ---
    async function carregarPerfil(user) {
        if(loadingMessage) loadingMessage.style.display = 'block';
        if(profileCardView) profileCardView.style.display = 'none';
        
        try {
            const { data } = await window.supabaseClient
                .from('usuarios')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            const perfil = data || {};
            const nome = perfil.nome_usuario || user.user_metadata?.nome_usuario || 'Usuário';
            const avatar = perfil.avatar_url || 'img/avatar_placeholder.png'; // Imagem padrão
            const bio = perfil.bio || 'Conte um pouco sobre você...';

            // Atualiza Exibição
            if(avatarImg) avatarImg.src = avatar;
            if(usernameDisplay) usernameDisplay.textContent = nome;
            if(emailDisplay) emailDisplay.textContent = user.email;
            if(bioDisplay) bioDisplay.textContent = bio;

            // Atualiza Inputs do Formulário
            if(usernameInput) usernameInput.value = nome;
            if(bioInput) bioInput.value = bio;
            // Guarda a URL atual no input oculto
            if(hiddenUrlInput) hiddenUrlInput.value = perfil.avatar_url || '';

        } catch (error) {
            console.error(error);
        } finally {
            if(loadingMessage) loadingMessage.style.display = 'none';
            if(profileCardView) profileCardView.style.display = 'flex';
        }
    }

    // --- 3. BOTÕES DE EDIÇÃO ---
    const btnEdit = document.getElementById('edit-profile-btn');
    const btnCancel = document.getElementById('cancel-edit-btn');
    const btnLogout = document.getElementById('logout-button');

    if (btnEdit) {
        btnEdit.addEventListener('click', () => {
            profileForm.style.display = 'block';
            profileDataDisplay.style.display = 'none';
            mainActions.style.display = 'none';
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            profileForm.style.display = 'none';
            profileDataDisplay.style.display = 'block';
            mainActions.style.display = 'flex';
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await window.supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });
    }

    // --- 4. SALVAR COM UPLOAD DE FOTO ---
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = profileForm.querySelector('button[type="submit"]');
            btn.textContent = 'Enviando foto e salvando...';
            btn.disabled = true;

            let finalAvatarUrl = hiddenUrlInput.value; // Começa com a URL antiga

            try {
                // A. VERIFICA SE TEM ARQUIVO NOVO
                if (fileInput.files && fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    // Cria um nome único: id_do_user/timestamp_nomearquivo
                    const filePath = `${currentUser.id}/${Date.now()}_${file.name}`;
                    
                    // Faz o Upload
                    const { data: uploadData, error: uploadError } = await window.supabaseClient
                        .storage
                        .from('avatars')
                        .upload(filePath, file);

                    if (uploadError) throw new Error("Erro no upload: " + uploadError.message);

                    // Pega a URL pública
                    const { data: urlData } = window.supabaseClient
                        .storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    finalAvatarUrl = urlData.publicUrl;
                }

                // B. SALVA NO BANCO DE DADOS
                const dados = {
                    id: currentUser.id,
                    nome_usuario: usernameInput.value,
                    bio: bioInput.value,
                    avatar_url: finalAvatarUrl // Salva a URL nova (ou mantém a velha)
                };

                const { error } = await window.supabaseClient.from('usuarios').upsert(dados);
                if (error) throw error;

                alert("Perfil atualizado com sucesso!");
                window.location.reload();

            } catch (err) {
                alert("Erro: " + err.message);
                btn.disabled = false;
                btn.textContent = 'Salvar Alterações';
            }
        });
    }

    // Função de Notificações (Recuperada)
    async function carregarNotificacoes(userId) {
        const lista = document.getElementById('lista-notificacoes');
        if (!lista) return;
        lista.innerHTML = '<p>Buscando mensagens...</p>';
        try {
            const { data } = await window.supabaseClient
                .from('notificacoes')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            lista.innerHTML = '';
            if (!data || data.length === 0) {
                lista.innerHTML = '<p style="color:#777">Sem notificações novas.</p>';
            } else {
                data.forEach(n => {
                    const div = document.createElement('div');
                    div.style.cssText = "background:#e8f5e9; padding:10px; margin-bottom:5px; border-left:4px solid #20A79D; border-radius:4px;";
                    div.innerHTML = `<p style="margin:0">${n.mensagem}</p>`;
                    lista.appendChild(div);
                });
            }
        } catch (e) { console.error(e); }
    }
});