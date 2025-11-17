// js/auth-ui.js - VERSÃO OTIMIZADA

// 1. CRIA O CLIENTE SUPABASE E O TORNA ACESSÍVEL GLOBALMENTE
// Garantimos que a inicialização aconteça apenas uma vez.
if (typeof window.supabaseClient === 'undefined') {
    if (typeof supabase === 'undefined') {
        alert("ERRO GRAVE: A biblioteca principal do Supabase não foi carregada. Verifique o link do CDN no HTML.");
    } else {
        const SUPABASE_URL = 'https://fcozxgnwoubuqiynmwwr.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb3p4Z253b3VidXFpeW5td3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODQyNDMsImV4cCI6MjA2NjM2MDI0M30.bg-bRTkMPVq78MTdbJc-zCTqRTDsla7m7pc4sH3PFn0';
        const { createClient } = supabase;
        // Anexamos o cliente ao objeto window para que ele seja global
        window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
}

// 2. LÓGICA DE UI PARA ELEMENTOS GLOBAIS (HEADER)
document.addEventListener('DOMContentLoaded', () => {
    // Verificação de segurança
    if (typeof window.supabaseClient === 'undefined') return;

    const profileIcon = document.getElementById('user-profile-icon');
    const loginButton = document.getElementById('login-link-button');
    const adminLinkLi = document.getElementById('admin-link-li');

    async function checkIsAdmin(user) {
        if (!user) return false;
        try {
            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .select('is_admin')
                .eq('id', user.id)
                .single();
            if (error) {
                // Se o erro for "0 rows", não é um erro crítico, apenas o usuário não está na tabela 'usuarios' ainda.
                if (error.code !== 'PGRST116') console.error("Erro ao verificar admin:", error);
                return false;
            }
            return data ? data.is_admin : false;
        } catch (error) {
            console.error("Exceção ao verificar admin:", error);
            return false;
        }
    }

    async function updateUserUI(user) {
        if (!profileIcon || !loginButton || !adminLinkLi) return;

        const isAdmin = await checkIsAdmin(user);

        if (user) {
            profileIcon.style.display = 'block';
            loginButton.style.display = 'none';
            adminLinkLi.style.display = isAdmin ? 'list-item' : 'none';
        } else {
            profileIcon.style.display = 'none';
            loginButton.style.display = 'block';
            adminLinkLi.style.display = 'none';
        }
    }
    
    // Ouve as mudanças de autenticação e atualiza a UI do header
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
        updateUserUI(session ? session.user : null);
    });

    // Força uma verificação inicial para o caso da sessão já existir
    // (útil para quando o usuário recarrega a página)
    async function initializeSessionUI() {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        updateUserUI(session ? session.user : null);
    }
    initializeSessionUI();
});