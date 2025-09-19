// js/auth-ui.js

document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = 'https://fcozxgnwoubuqiynmwwr.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb3p4Z253b3VidXFpeW5td3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODQyNDMsImV4cCI6MjA2NjM2MDI0M30.bg-bRTkMPVq78MTdbJc-zCTqRTDsla7m7pc4sH3PFn0';
    const { createClient } = supabase;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const profileIcon = document.getElementById('user-profile-icon');
    const loginButton = document.getElementById('login-link-button');
    const adminLinkLi = document.getElementById('admin-link-li'); // Pegamos o novo elemento

    // Função para verificar se o usuário é admin
    async function checkIsAdmin(user) {
        if (!user) return false; // Se não há usuário, não é admin

        try {
            const { data, error } = await supabaseClient
                .from('usuarios')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (error) {
                // Se der erro (ex: perfil não criado ainda), assume que não é admin
                console.warn("Aviso: Não foi possível verificar o status de admin. ", error.message);
                return false;
            }
            
            return data ? data.is_admin : false;

        } catch (error) {
            console.error("Erro na verificação de admin: ", error);
            return false;
        }
    }

    // Função principal para atualizar toda a UI
    async function updateUserUI(user) {
        // Garante que os elementos básicos existem
        if (!profileIcon || !loginButton) {
            return;
        }

        if (user) {
            // Usuário está logado: mostra ícone de perfil, esconde botão de login
            profileIcon.style.display = 'block';
            loginButton.style.display = 'none';

            // Agora, verifica se é admin para mostrar o link
            const isAdmin = await checkIsAdmin(user);
            if (isAdmin && adminLinkLi) {
                adminLinkLi.style.display = 'list-item'; // 'list-item' é o display correto para <li>
            } else if (adminLinkLi) {
                adminLinkLi.style.display = 'none';
            }

        } else {
            // Usuário não está logado: esconde tudo
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