// js/perfil-script.js - VERSÃO 100% COMPLETA E CORRIGIDA

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('profile-page-content')) return;
    if (typeof supabaseClient === 'undefined') {
        alert("Erro de inicialização: supabaseClient não foi encontrado.");
        return;
    }

    // --- Seletores de Elementos ---
    const profilePageContent = document.getElementById('profile-page-content');
    const loginPrompt = document.getElementById('login-prompt');
    const loadingMessage = document.getElementById('loading-message');
    const profileCardView = document.getElementById('profile-card-view');
    const profileMainContent = document.getElementById('profile-main-content');
    const profileForm = document.getElementById('profile-form');

    const avatarImg = document.getElementById('avatar-img');
    const usernameDisplay = document.getElementById('username-display');
    const emailDisplay = document.getElementById('email-display');
    const bioDisplay = document.getElementById('bio-display');

    const usernameInput = document.getElementById('username-input');
    const bioInput = document.getElementById('bio-input');
    const avatarUrlInput = document.getElementById('avatar_url-input');

    const editProfileBtn = document.getElementById('edit-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const logoutButton = document.getElementById('logout-button');
    const mainProfileActions = document.getElementById('main-profile-actions');

    let currentUser = null;
    let userProfile = {};

    // --- Funções de UI ---
    const toggleEditMode = (isEditing) => {
        profileMainContent.classList.toggle('edit-mode', isEditing);
        mainProfileActions.style.display = isEditing ? 'none' : 'flex';
    };

    const populateProfileData = () => {
        avatarImg.src = userProfile.avatar_url || 'img/avatar_placeholder.png';
        usernameDisplay.textContent = userProfile.username || 'Adicione um nome de usuário';
        emailDisplay.textContent = currentUser.email;
        bioDisplay.textContent = userProfile.bio || 'Conte um pouco sobre você...';

        usernameInput.value = userProfile.username || '';
        bioInput.value = userProfile.bio || '';
        avatarUrlInput.value = userProfile.avatar_url || '';
    };

    const loadProfile = async (user) => {
        loadingMessage.style.display = 'block';
        profileCardView.style.display = 'none';
        try {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('username, avatar_url, bio')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            
            userProfile = data || {};
            populateProfileData();

        } catch (error) {
            alert('Erro ao carregar o perfil: ' + error.message);
        } finally {
            loadingMessage.style.display = 'none';
            profileCardView.style.display = 'flex';
        }
    };

    // --- Event Listeners ---
    editProfileBtn.addEventListener('click', () => toggleEditMode(true));
    cancelEditBtn.addEventListener('click', () => {
        populateProfileData();
        toggleEditMode(false);
    });

    logoutButton.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    profileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = profileForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        const updates = {
            id: currentUser.id,
            username: usernameInput.value.trim(),
            bio: bioInput.value.trim(),
            avatar_url: avatarUrlInput.value.trim(),
        };

        try {
            const { data, error } = await supabaseClient.from('profiles').upsert(updates).select().single();
            if (error) throw error;
            
            userProfile = data;
            populateProfileData();
            toggleEditMode(false);
            alert('Perfil atualizado com sucesso!');

        } catch (error) {
            alert('Erro ao atualizar o perfil: ' + error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    });

    // --- LÓGICA DE INICIALIZAÇÃO ---
    const checkUserSession = async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session && session.user) {
            currentUser = session.user;
            loginPrompt.style.display = 'none';
            profilePageContent.style.display = 'block';
            await loadProfile(currentUser);
        } else {
            currentUser = null;
            profilePageContent.style.display = 'none';
            loginPrompt.style.display = 'block';
            loadingMessage.style.display = 'none';
        }
    };

    // Roda a verificação assim que a página carrega
    checkUserSession();

    // Ouve por futuras mudanças (login/logout em outra aba, etc) e reverifica a sessão
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        // Simplesmente chama a função de verificação de novo
        // para garantir que a UI esteja sempre sincronizada
        checkUserSession();
    });
});