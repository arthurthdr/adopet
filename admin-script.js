// js/admin-script.js

// Esta função será chamada pelo script inline na admin.html após a verificação de login
async function inicializarAdmin(supabaseClient) { // Recebe o cliente Supabase
    console.log("Admin-script: inicializarAdmin() chamado.", supabaseClient);

    if (!supabaseClient) {
        console.error("Admin-script: Cliente Supabase não recebido!");
        document.getElementById('admin-content').innerHTML = "<p style='color:red;'>Erro crítico: Falha ao carregar o sistema de administração de animais.</p>";
        return;
    }

    const animalForm = document.getElementById('animal-form');
    const animaisTableBody = document.getElementById('animais-table-body');
    const formTitle = document.getElementById('form-title');
    const animalIdInput = document.getElementById('animal-id');
    const saveButton = document.getElementById('save-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');

    if (!animalForm || !animaisTableBody || !formTitle || !animalIdInput || !saveButton || !cancelEditButton) {
        console.error("Admin-script: Um ou mais elementos do formulário/tabela não foram encontrados.");
        return; // Impede a continuação se elementos cruciais não existem
    }

    async function carregarAnimais() {
        console.log("Admin-script: carregarAnimais() chamado.");
        animaisTableBody.innerHTML = '<tr><td colspan="5">Carregando animais...</td></tr>';
        const { data: animais, error } = await supabaseClient
            .from('animais')
            .select('*')
            .order('nome', { ascending: true });

        if (error) {
            console.error('Admin-script: Erro ao carregar animais:', error);
            animaisTableBody.innerHTML = `<tr><td colspan="5" style="color:red;">Erro ao carregar animais: ${error.message}</td></tr>`;
            return;
        }

        animaisTableBody.innerHTML = '';
        if (animais.length === 0) {
            animaisTableBody.innerHTML = '<tr><td colspan="5">Nenhum animal cadastrado.</td></tr>';
            return;
        }
        animais.forEach(animal => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${animal.id}</td>
                <td>${animal.nome}</td>
                <td>${animal.especie}</td>
                <td>${animal.idade !== null ? animal.idade : 'N/A'}</td>
                <td class="actions">
                    <button class="btn-edit" data-id="${animal.id}">Editar</button>
                    <button class="btn-delete" data-id="${animal.id}">Excluir</button>
                </td>
            `;
            animaisTableBody.appendChild(tr);
        });
        console.log("Admin-script: Animais carregados na tabela.");
    }

    function resetarFormulario() {
        animalForm.reset();
        formTitle.textContent = 'Adicionar Novo Animal';
        animalIdInput.value = '';
        saveButton.textContent = 'Salvar';
        cancelEditButton.style.display = 'none';
    }

    animalForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        console.log("Admin-script: Formulário de animal enviado.");

        const id = animalIdInput.value ? parseInt(animalIdInput.value) : null;
        const animalData = {
            nome: document.getElementById('nome').value,
            especie: document.getElementById('especie').value,
            sexo: document.getElementById('sexo').value,
            porte: document.getElementById('porte').value,
            idade: document.getElementById('idade').value ? parseInt(document.getElementById('idade').value) : null,
            estado: document.getElementById('estado').value,
            cidade: document.getElementById('cidade').value,
            img: document.getElementById('img').value,
            descricao: document.getElementById('descricao').value,
        };

        if (!animalData.nome || !animalData.especie) {
            alert("Nome e Espécie são obrigatórios!");
            return;
        }

        // Obter o user_id do usuário logado para associar ao animal (opcional)
        // const { data: { user } } = await supabaseClient.auth.getUser();
        // if (user) {
        //     animalData.user_id = user.id; // Certifique-se que sua tabela 'animais' tem uma coluna user_id (uuid)
        // }


        let result, error;
        if (id) {
            console.log("Admin-script: Atualizando animal ID:", id, animalData);
            ({ data: result, error } = await supabaseClient
                .from('animais')
                .update(animalData)
                .eq('id', id)
                .select());
        } else {
            console.log("Admin-script: Inserindo novo animal:", animalData);
            ({ data: result, error } = await supabaseClient
                .from('animais')
                .insert([animalData]) // insert espera um array de objetos
                .select());
        }

        if (error) {
            console.error('Admin-script: Erro ao salvar animal:', error);
            alert(`Erro ao salvar animal: ${error.message}`);
        } else {
            console.log('Admin-script: Animal salvo com sucesso:', result);
            alert(id ? 'Animal atualizado com sucesso!' : 'Animal adicionado com sucesso!');
            await carregarAnimais(); // Recarrega a lista
            resetarFormulario();
        }
    });

    animaisTableBody.addEventListener('click', async function(event) {
        const target = event.target;
        const idStr = target.dataset.id;
        
        if (!idStr) return; // Não faz nada se não houver data-id
        const id = parseInt(idStr);

        if (target.classList.contains('btn-edit')) {
            console.log("Admin-script: Botão editar clicado para ID:", id);
            const { data: animal, error } = await supabaseClient
                .from('animais')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                alert(`Erro ao buscar animal para edição: ${error.message}`);
                console.error("Admin-script: Erro ao buscar animal para editar:", error);
                return;
            }
            if (animal) {
                formTitle.textContent = 'Editar Animal';
                animalIdInput.value = animal.id;
                document.getElementById('nome').value = animal.nome;
                document.getElementById('especie').value = animal.especie;
                document.getElementById('sexo').value = animal.sexo;
                document.getElementById('porte').value = animal.porte;
                document.getElementById('idade').value = animal.idade !== null ? animal.idade : '';
                document.getElementById('estado').value = animal.estado || '';
                document.getElementById('cidade').value = animal.cidade || '';
                document.getElementById('img').value = animal.img || '';
                document.getElementById('descricao').value = animal.descricao || '';
                saveButton.textContent = 'Atualizar';
                cancelEditButton.style.display = 'inline-block';
                window.scrollTo(0, 0);
            }
        } else if (target.classList.contains('btn-delete')) {
            if (confirm('Tem certeza que deseja excluir este animal?')) {
                console.log("Admin-script: Botão excluir clicado para ID:", id);
                const { error } = await supabaseClient
                    .from('animais')
                    .delete()
                    .eq('id', id);

                if (error) {
                    alert(`Erro ao excluir animal: ${error.message}`);
                    console.error("Admin-script: Erro ao excluir animal:", error);
                } else {
                    alert('Animal excluído com sucesso!');
                    await carregarAnimais(); // Recarrega a lista
                }
            }
        }
    });

    if (cancelEditButton) {
        cancelEditButton.addEventListener('click', function() {
            resetarFormulario();
        });
    }

    // Carrega os animais inicialmente quando o admin é inicializado
    await carregarAnimais();
}