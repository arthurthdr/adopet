// js/perfil-script.js - VERSÃO REESTRUTURADA

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('profile-page-content')) return;
    if (typeof supabaseClient === 'undefined') { return alert("Erro de inicialização."); }

    // Seletores de Elementos
    const profilePageContent = document.getElementById('profile-page-content');
    const loginPrompt = document.getElementById('login-prompt');
    const loadingMessage = document.getElementById('loading-message');
    const profileCardView = document.getElementById('profile-card-view');
    const profileMainContent = document.getElementById('profile-main-content');
    const profileForm = document.getElementById('profile-form');

    // Elementos de Visualização
    const avatarImg = document.getElementById('avatar-img');
    const usernameDisplay = document.getElementById('username-display');
    const emailDisplay = document.getElementById('email-display');
    const bioDisplay = document.getElementById('bio-display');

    // Elementos do Formulário
    const usernameInput = document.getElementById('username-input');
    const bioInput = document.getElementById('bio-input');
    const avatarUrlInput = document.getElementById('avatar_url-input');

    // Botões
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const logoutButton = document.getElementById('logout-button');
    const mainProfileActions = document.getElementById('main-profile-actions');

    let currentUser = null;
    let userProfile = {};

    // Função para entrar/sair do modo de edição
    const toggleEditMode = (isEditing) => {
        profileMainContent.classList.toggle('edit-mode', isEditing);
        mainProfileActions.style.display = isEditing ? 'none' : 'flex';
    };

    // Preenche os campos de visualização com os dados do perfil
    const populateProfileData = () => {
        avatarImg.src = userProfile.avatar_url || 'img/avatar_placeholder.png';
        usernameDisplay.textContent = userProfile.username || 'Adicione um nome de usuário';
        emailDisplay.textContent = currentUser.email;
        bioDisplay.textContent = userProfile.bio || 'Conte um pouco sobre você...';

        // Preenche o formulário com os mesmos dados para edição
        usernameInput.value = userProfile.username || '';
        bioInput.value = userProfile.bio || '';
        avatarUrlInput.value = userProfile.avatar_url || '';
    };

    async function loadProfile(user) {
        loadingMessage.style.display = 'block';
        profileCardView.style.display = 'none';
        try {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('username, avatar_url, bio')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) userProfile = data;

            populateProfileData();

        } catch (error) {
            alert('Erro ao carregar o perfil: ' + error.message);
        } finally {
            loadingMessage.style.display = 'none';
            profileCardView.style.display = 'flex';
        }
    }

    // --- Event Listeners ---

    editProfileBtn.addEventListener('click', () => toggleEditMode(true));
    cancelEditBtn.addEventListener('click', () => {
        populateProfileData(); // Restaura os dados originais no form
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
        submitButton.textContent = .'Salvando...';

        const updates = {
            id: currentUser.id,
            username: usernameInput.value.trim(),
            bio: bioInput.value.trim(),
            avatar_url: avatarUrlInput.value.trim(),
            updated_at: new Date()
        };

        try {
            const { error } = await supabaseClient.from('profiles').upsert(updates);
            if (error) throw error;
            
            // Atualiza os dados locais e a visualização
            userProfile = { ...userProfile, ...updates };
            populateProfileData();
            toggleEditMode(false); // Sai do modo de edição
            alert('Perfil atualizado com sucesso!');

        } catch (error) {
            alert('Erro ao atualizar o perfil: ' + error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    });

    // --- Lógica de Inicialização ---

    supabaseClient.auth.onAuthStateChange((event, session) => {
        currentUser = session ? session.user : null;
        if (currentUser) {
            loginPrompt.style.display = 'none';
            profilePageContent.style.display = 'block';
            loadProfile(currentUser);
        } else {
            profilePageContent.style.display = 'none';
            loginPrompt.style.display = 'block';
        }
    });
});