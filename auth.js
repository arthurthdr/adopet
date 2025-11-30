// js/auth.js - Lógica de Login e Registro (CORRIGIDO)

document.addEventListener('DOMContentLoaded', () => {
    // Verifica se a conexão global existe
    if (!window.supabaseClient) {
        console.error("ERRO: supabaseClient não encontrado. Verifique se auth-ui.js foi carregado.");
        return;
    }

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const messageDiv = document.getElementById('message');

    // --- LÓGICA DE LOGIN ---
    if (loginForm) {
        console.log("Formulário de login detectado. Preparando...");

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // IMPEDE A PÁGINA DE RECARREGAR (Crucial!)
            console.log("Botão de login clicado.");

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const submitButton = loginForm.querySelector('button');

            // Feedback visual
            submitButton.disabled = true;
            submitButton.textContent = 'Entrando...';
            if (messageDiv) {
                messageDiv.textContent = '';
                messageDiv.className = '';
            }

            try {
                // Tenta fazer o login
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) {
                    console.error("Erro no login:", error);
                    // Traduz erros comuns
                    let msg = error.message;
                    if (msg.includes("Invalid login credentials")) msg = "Email ou senha incorretos.";
                    
                    if (messageDiv) {
                        messageDiv.textContent = msg;
                        messageDiv.className = 'error';
                    } else {
                        alert(msg);
                    }
                } else if (data.user) {
                    console.log("Login sucesso!", data.user);
                    if (messageDiv) {
                        messageDiv.textContent = 'Sucesso! Redirecionando...';
                        messageDiv.className = 'success';
                    }
                    // Redireciona para o perfil após 1 segundo
                    setTimeout(() => {
                        window.location.href = 'perfil.html';
                    }, 1000);
                }
            } catch (e) {
                console.error("Erro inesperado:", e);
                if (messageDiv) messageDiv.textContent = 'Erro inesperado. Veja o console.';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Entrar';
            }
        });
    }

    // --- LÓGICA DE REGISTRO (Para a página register.html) ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // IMPEDE RECARREGAMENTO

            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            const submitButton = registerForm.querySelector('button');
            
            if (messageDiv) messageDiv.textContent = '';

            if (password !== confirmPassword) {
                if(messageDiv) {
                    messageDiv.textContent = 'As senhas não coincidem!';
                    messageDiv.className = 'error';
                } else { alert('As senhas não coincidem!'); }
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Cadastrando...';

            try {
                // 1. Cria o usuário na autenticação (Auth)
                const { data, error } = await window.supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: { nome_usuario: username } // Salva no metadata
                    }
                });

                if (error) throw error;

                // 2. Tenta inserir na tabela 'usuarios' (Opcional, mas recomendado se você usa essa tabela)
                if (data.user) {
                    const { error: dbError } = await window.supabaseClient
                        .from('usuarios')
                        .insert([{ 
                            id: data.user.id, 
                            nome_usuario: username,
                            email: email 
                        }]);
                        
                    if(dbError) console.warn("Aviso: Erro ao salvar na tabela usuarios (pode ser duplicidade ou permissão):", dbError);

                    if(messageDiv) {
                        messageDiv.innerHTML = 'Cadastro realizado! <br> Verifique seu email para confirmar.';
                        messageDiv.className = 'success';
                    } else {
                        alert("Cadastro realizado! Verifique seu email.");
                    }
                    registerForm.reset();
                }

            } catch (e) {
                console.error(e);
                if(messageDiv) {
                    messageDiv.textContent = 'Erro: ' + e.message;
                    messageDiv.className = 'error';
                }
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Cadastrar';
            }
        });
    }
});