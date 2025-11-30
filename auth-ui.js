// js/auth-ui.js
console.log("Iniciando auth-ui.js...");

// 1. Definição das credenciais (Centralizado)
const SUPABASE_URL = 'https://fcozxgnwoubuqiynmwwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb3p4Z253b3VidXFpeW5td3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODQyNDMsImV4cCI6MjA2NjM2MDI0M30.bg-bRTkMPVq78MTdbJc-zCTqRTDsla7m7pc4sH3PFn0';

// 2. Validação se a biblioteca carregou
if (typeof supabase === 'undefined') {
    console.error("ERRO CRÍTICO: A biblioteca do Supabase não foi carregada no HTML (CDN).");
    alert("Erro de sistema: Biblioteca não carregada.");
} else {
    // 3. Criação do Cliente Global
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase Client criado com sucesso.");
}

// 4. Lógica de Interface do Usuário (Header)
document.addEventListener('DOMContentLoaded', () => {
    const profileIcon = document.getElementById('user-profile-icon');
    const loginButton = document.getElementById('login-link-button');
    const adminLinkLi = document.getElementById('admin-link-li');
    const casinhaIcon = document.getElementById('casinha-icon');

    // Dentro de js/auth-ui.js

    async function updateUserUI(user) {
        if (!profileIcon || !loginButton || !adminLinkLi) return;

        if (user) {
            // Usuário logado
            profileIcon.style.display = 'inline-block';
            loginButton.style.display = 'none';
            
            // --- TENTATIVA SEGURA DE VERIFICAR ADMIN ---
            try {
                // Tenta buscar o perfil
                const { data, error } = await window.supabaseClient
                    .from('usuarios')
                    .select('is_admin')
                    .eq('id', user.id)
                    .maybeSingle(); // <--- USA maybeSingle EM VEZ DE single PARA EVITAR ERRO 406

                // Se houver erro ou não houver dados, assumimos FALSE
                if (error || !data) {
                    console.log("Usuário sem perfil de admin ou perfil inexistente.");
                    adminLinkLi.style.display = 'none';
                } else if (data.is_admin) {
                    adminLinkLi.style.display = 'inline-block'; // É admin!
                } else {
                    adminLinkLi.style.display = 'none'; // Existe, mas não é admin
                }
            } catch (err) {
                console.warn("Falha na verificação de admin (Ignorado):", err);
                adminLinkLi.style.display = 'none';
            }
        } else {
            // Usuário deslogado
            profileIcon.style.display = 'none';
            loginButton.style.display = 'inline-block';
            adminLinkLi.style.display = 'none';
        }
    }

    // Ouvinte de estado de autenticação
    if (window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            updateUserUI(session ? session.user : null);
        });
        
        // Verificação inicial
        window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
            updateUserUI(session ? session.user : null);
        });
    }
});