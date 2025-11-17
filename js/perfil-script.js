// js/perfil-script.js - VERSÃO CORRIGIDA E OTIMIZADA

document.addEventListener('DOMContentLoaded', () => {
    // Confirma que estamos na página de perfil antes de executar
    if (!document.getElementById('profile-page-content')) return;
    
    // Valida se o cliente Supabase foi carregado pelo auth-ui.js
    if (typeof supabaseClient === 'undefined') {
        alert("Erro de inicialização. O script auth-ui.js deve ser carregado primeiro.");
        return;
    }

    const profilePageContent = document.getElementById('profile-page-content');
    const loginPrompt = document.getElementById('login-prompt');
    const loadingMessage = document.getElementById('loading-message');
    const profileForm = document.getElementById('profile-form');
    const logoutButton = document.getElementById('logout-button');

    let currentUser = null;

    async function loadProfile(user) {
        if (!user) return; // Segurança extra

        try {
            // Mostra a mensagem de carregamento e o formulário
            loadingMessage.style.display = 'block';
            profileForm.style.display = 'none';

            const { data, error } = await supabaseClient
                .from('profiles')
                .select('username, avatar_url, bio')
                .eq('id', user.id)
                .single();

            // O erro PGRST116 significa "0 rows found", o que é normal para um perfil novo.
            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            // Preenche os dados existentes ou deixa em branco
            if (data) {
                document.getElementById('username').value = data.username || '';
                document.getElementById('bio').value = data.bio || '';
                document.getElementById('avatar_url').value = data.avatar_url || '';
                document.getElementById('avatar-img').src = data.avatar_url || 'img/avatar_placeholder.png';
            }
            
            // Preenche o e-mail, que é imutável
            document.getElementById('email').value = user.email;

        } catch (error) {
            alert('Erro ao carregar o perfil: ' + error.message);
        } finally {
            // Esconde o carregamento e mostra o formulário ao final
            loadingMessage.style.display = 'none';
            profileForm.style.display = 'block';
        }
    }

    profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = profileForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        const updates = {
            id: currentUser.id,
            username: document.getElementById('username').value.trim(),
            bio: document.getElementById('bio').value.trim(),
            avatar_url: document.getElementById('avatar_url').value.trim(),
            updated_at: new Date()
        };

        try {
            const { error } = await supabaseClient.from('profiles').upsert(updates);
            if (error) throw error;
            alert('Perfil atualizado com sucesso!');
            document.getElementById('avatar-img').src = updates.avatar_url || 'img/avatar_placeholder.png';
        } catch (error) {
            alert('Erro ao atualizar o perfil: ' + error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Atualizar Perfil';
        }
    });

    logoutButton.addEventListener('click', async () => {
        logoutButton.disabled = true;
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    // Função principal que reage ao estado de autenticação
    function handleAuthState(user) {
        if (user) {
            currentUser = user;
            loginPrompt.style.display = 'none';
            profilePageContent.style.display = 'block';
            loadProfile(currentUser);
        } else {
            currentUser = null;
            profilePageContent.style.display = 'none';
            loginPrompt.style.display = 'block';
        }
    }
    
    // Ouve as mudanças de autenticação e direciona para nossa função
    supabaseClient.auth.onAuthStateChange((event, session) => {
        handleAuthState(session ? session.user : null);
    });

    // Verificação inicial da sessão
    async function initializeProfilePage() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        handleAuthState(session ? session.user : null);
    }
    initializeProfilePage();
});