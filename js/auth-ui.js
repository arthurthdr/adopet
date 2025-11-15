// js/auth-ui.js

document.addEventListener('DOMContentLoaded', () => {
   
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

            if (error) {
                console.warn("Aviso: Não foi possível verificar o status de admin. ", error.message);
                return false;
            }
            
            return data ? data.is_admin : false;

        } catch (error) {
            console.error("Erro na verificação de admin: ", error);
            return false;
        }
    }

    async function updateUserUI(user) {
        if (!profileIcon || !loginButton) {
            return;
        }

        if (user) {
            profileIcon.style.display = 'block';
            loginButton.style.display = 'none';

            const isAdmin = await checkIsAdmin(user);
            if (isAdmin && adminLinkLi) {
                adminLinkLi.style.display = 'list-item'; 
            } else if (adminLinkLi) {
                adminLinkLi.style.display = 'none';
            }

        } else {
            profileIcon.style.display = 'none';
            loginButton.style.display = 'block';
            if (adminLinkLi) {
                adminLinkLi.style.display = 'none';
            }
        }
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        const user = session ? session.user : null;
        updateUserUI(user);
    });
});