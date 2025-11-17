// js/auth.js - Lógica de Login e Registro

document.addEventListener('DOMContentLoaded', () => {
    // Valida se o cliente Supabase global, criado pelo auth-ui.js, existe.
    if (typeof supabaseClient === 'undefined') {
        console.error("Supabase client não encontrado. auth-ui.js deve ser carregado primeiro.");
        return;
    }

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const messageDiv = document.getElementById('message');

    // --- LÓGICA DE LOGIN ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Impede o recarregamento da página

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const submitButton = loginForm.querySelector('button');

            // Desabilita o botão para evitar múltiplos envios
            submitButton.disabled = true;
            submitButton.textContent = 'Entrando...';
            messageDiv.textContent = ''; // Limpa mensagens anteriores

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) {
                    // Transforma o erro técnico em uma mensagem amigável
                    if (error.message.includes("Invalid login credentials")) {
                        messageDiv.textContent = 'Email ou senha inválidos. Por favor, tente novamente.';
                    } else {
                        messageDiv.textContent = 'Erro ao fazer login: ' + error.message;
                    }
                    messageDiv.className = 'error';
                } else if (data.user) {
                    // Sucesso! Redireciona para a página de perfil.
                    messageDiv.textContent = 'Login bem-sucedido! Redirecionando...';
                    messageDiv.className = 'success';
                    window.location.href = 'perfil.html';
                }
            } catch (e) {
                messageDiv.textContent = 'Ocorreu um erro inesperado. Tente novamente.';
                messageDiv.className = 'error';
            } finally {
                // Reabilita o botão
                submitButton.disabled = false;
                submitButton.textContent = 'Entrar';
            }
        });
    }

    // --- LÓGICA DE REGISTRO ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            const submitButton = registerForm.querySelector('button');
            
            messageDiv.textContent = ''; // Limpa mensagens

            // Validação de senha no front-end
            if (password !== confirmPassword) {
                messageDiv.textContent = 'As senhas não coincidem!';
                messageDiv.className = 'error';
                return;
            }
            if (password.length < 6) {
                messageDiv.textContent = 'A senha deve ter no mínimo 6 caracteres.';
                messageDiv.className = 'error';
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Cadastrando...';

            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        // Guarda o nome de usuário nos metadados do usuário
                        data: {
                            nome_usuario: username
                        }
                    }
                });

                if (error) {
                    messageDiv.textContent = 'Erro no cadastro: ' + error.message;
                    messageDiv.className = 'error';
                } else if (data.user) {
                    // IMPORTANTE: Supabase envia um email de confirmação por padrão.
                    messageDiv.innerHTML = 'Cadastro realizado com sucesso! <br> Verifique seu e-mail para confirmar a conta antes de fazer o login.';
                    messageDiv.className = 'success';
                    registerForm.reset(); // Limpa o formulário
                }
            } catch (e) {
                messageDiv.textContent = 'Ocorreu um erro inesperado. Tente novamente.';
                messageDiv.className = 'error';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Cadastrar';
            }
        });
    }
});