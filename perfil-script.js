
const SUPABASE_URL = 'https://fcozxgnwoubuqiynmwwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb3p4Z253b3VidXFpeW5td3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODQyNDMsImV4cCI6MjA2NjM2MDI0M30.bg-bRTDsla7m7pc4sH3PFn0';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const profilePageContent = document.getElementById('profile-page-content');
const loginPrompt = document.getElementById('login-prompt');
const loadingMessage = document.getElementById('loading-message');
const profileForm = document.getElementById('profile-form');
const logoutButton = document.getElementById('logout-button');

let currentUser = null;

async function loadProfile(user) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('username, avatar_url, bio')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { 
            throw error;
        }

        if (data) {
            document.getElementById('username').value = data.username || '';
            document.getElementById('bio').value = data.bio || '';
            document.getElementById('avatar_url').value = data.avatar_url || '';
            document.getElementById('avatar-img').src = data.avatar_url || 'img/avatar_placeholder.png';
        }

        document.getElementById('email').value = user.email;

    } catch (error) {
        alert('Erro ao carregar o perfil: ' + error.message);
    } finally {
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
        username: document.getElementById('username').value,
        bio: document.getElementById('bio').value,
        avatar_url: document.getElementById('avatar_url').value,
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
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session && session.user) {
        currentUser = session.user;
        loginPrompt.style.display = 'none';
        profilePageContent.style.display = 'block';
        loadProfile(currentUser);
    } else {
        currentUser = null;
        profilePageContent.style.display = 'none';
        loginPrompt.style.display = 'block';
    }
});

logoutButton.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
});