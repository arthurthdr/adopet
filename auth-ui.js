// js/auth-ui.js

document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabaseClient === 'undefined') {
        console.error("auth-ui.js: supabaseClient não foi encontrado. Verifique a ordem de carregamento dos scripts no HTML.");
        return;
    }

    const profileIcon = document.getElementById('user-profile-icon');
    const loginButton = document.getElementById('login-link-button');
    const adminLinkLi = document.getElementById('admin-link-li');

    async function checkIsAdmin(user) {
        if (!user) return false;
        try {
            const { data, error } = await supabaseClient
                .from('usuarios')
                .select('is_admin')
                .eq('id', user.id)
                .single();
            // Se der erro ou não encontrar, simplesmente retorna falso
            if (error) return false;
            return data ? data.is_admin : false;
        } catch (error) {
            return false;
        }
    }

    async function updateUserUI(user) {
        // Garante que os elementos existem antes de manipulá-los
        if (!profileIcon || !loginButton || !adminLinkLi) return;

        if (user) {
            // Usuário logado
            profileIcon.style.display = 'block';
            loginButton.style.display = 'none';
            const isAdmin = await checkIsAdmin(user);
            adminLinkLi.style.display = isAdmin ? 'list-item' : 'none';
        } else {
            // Usuário deslogado
            profileIcon.style.display = 'none';
            loginButton.style.display = 'block';
            adminLinkLi.style.display = 'none';
        }
    }

    // O "vigia" do Supabase que reage a mudanças de estado de login
    supabaseClient.auth.onAuthStateChange((event, session) => {
        const user = session ? session.user : null;
        updateUserUI(user);
    });
});