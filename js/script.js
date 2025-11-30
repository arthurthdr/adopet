// =================================================================================
// SCRIPT ÚNICO E COMPLETO - ADOPET
// =================================================================================

// --- 1. INICIALIZAÇÃO GERAL DO SUPABASE (ÚNICO LUGAR) ---
const SUPABASE_URL = 'https://fcozxgnwoubuqiynmwwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb3p4Z253b3VidXFpeW5td3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODQyNDMsImV4cCI6MjA2NjM2MDI0M30.bg-bRTkMPVq78MTdbJc-zCTqRTDsla7m7pc4sH3PFn0';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 2. FUNÇÕES GLOBAIS (CASINHA) ---
function getCasinha() { return JSON.parse(localStorage.getItem('casinhaAdopet')) || []; }
function saveCasinha(casinha) { localStorage.setItem('casinhaAdopet', JSON.stringify(casinha)); updateCasinhaContador(); }
function updateCasinhaContador() {
    const contador = document.getElementById('casinha-contador');
    if (contador) {
        const casinha = getCasinha();
        contador.textContent = casinha.length;
        contador.style.display = casinha.length > 0 ? 'block' : 'none';
    }
}
window.removerDaCasinha = function(id) {
    let casinha = getCasinha();
    casinha = casinha.filter(animal => String(animal.id) !== String(id));
    saveCasinha(casinha);
    // Recarrega a visualização da casinha se estiver na página correta
    if (document.getElementById('casinha-grid')) {
        setupCasinhaPage();
    }
}
window.iniciarAdocao = function(id) { window.location.href = `adocao.html?animalId=${id}`; }

// --- 3. GATILHO PRINCIPAL (QUANDO A PÁGINA CARREGA) ---
document.addEventListener('DOMContentLoaded', () => {
    setupHeaderLogic();
    if (document.getElementById('animais-grid')) setupAdocaoPage();
    if (document.getElementById('admin-content')) setupAdminPage();
    if (document.getElementById('casinha-grid')) setupCasinhaPage();
});

// --- 4. FUNÇÕES DE CONFIGURAÇÃO DE CADA PÁGINA ---

function setupHeaderLogic() {
    const profileIcon = document.getElementById('user-profile-icon');
    const loginButton = document.getElementById('login-link-button');
    const adminLinkLi = document.getElementById('admin-link-li');
    
    supabaseClient.auth.onAuthStateChange(async (_, session) => {
        const user = session?.user;
        if (profileIcon && loginButton && adminLinkLi) {
            if (user) {
                profileIcon.style.display = 'block';
                loginButton.style.display = 'none';
                try {
                    const { data } = await supabaseClient.from('usuarios').select('is_admin').eq('id', user.id).single();
                    adminLinkLi.style.display = data?.is_admin ? 'list-item' : 'none';
                } catch {
                    adminLinkLi.style.display = 'none';
                }
            } else {
                profileIcon.style.display = 'none';
                loginButton.style.display = 'block';
                adminLinkLi.style.display = 'none';
            }
        }
    });
    updateCasinhaContador();
}

function setupAdocaoPage() {
    const params = new URLSearchParams(window.location.search).get('animalId');
    if (params) {
        abrirFormularioParaAnimalEspecifico(params);
    } else {
        buscarEExibirAnimais();
    }
    configurarFormularioAdoção();
}

async function setupAdminPage() {
    const adminContent = document.getElementById('admin-content');
    const accessDenied = document.getElementById('admin-access-denied');
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session?.user) {
        accessDenied.textContent = 'Acesso negado. Faça login como administrador.';
        accessDenied.style.display = 'block';
        return;
    }
    try {
        const { data: user } = await supabaseClient.from('usuarios').select('is_admin').eq('id', session.user.id).single();
        if (user?.is_admin) {
            adminContent.style.display = 'block';
            accessDenied.style.display = 'none';
            inicializarAdmin(supabaseClient);
        } else {
            accessDenied.textContent = 'Acesso negado. Você não é um administrador.';
            accessDenied.style.display = 'block';
        }
    } catch {
        accessDenied.textContent = 'Erro ao verificar permissões de administrador.';
        accessDenied.style.display = 'block';
    }
}

function setupCasinhaPage() {
    const loginPrompt = document.getElementById('login-prompt-casinha');
    const content = document.getElementById('casinha-content');
    const vaziaMsg = document.getElementById('casinha-vazia-msg');
    
    supabaseClient.auth.onAuthStateChange((_, session) => {
        if (session?.user) {
            loginPrompt.style.display = 'none';
            displayPetsNaCasinha();
        } else {
            content.style.display = 'none';
            vaziaMsg.style.display = 'none';
            loginPrompt.style.display = 'block';
        }
    });
    // Força uma verificação inicial caso a sessão já exista
    const session = supabaseClient.auth.getSession();
    if(session?.user) {
        loginPrompt.style.display = 'none';
        displayPetsNaCasinha();
    } else {
        content.style.display = 'none';
        vaziaMsg.style.display = 'none';
        loginPrompt.style.display = 'block';
    }
}

// --- 5. FUNÇÕES DAS PÁGINAS ESPECÍFICAS ---

// Funções da Página da Casinha
function displayPetsNaCasinha() {
    const grid = document.getElementById('casinha-grid');
    const content = document.getElementById('casinha-content');
    const vaziaMsg = document.getElementById('casinha-vazia-msg');
    const casinha = getCasinha();
    
    grid.innerHTML = '';
    
    if (casinha.length === 0) {
        content.style.display = 'none';
        vaziaMsg.style.display = 'block';
        return;
    }
    
    content.style.display = 'block';
    vaziaMsg.style.display = 'none';

    casinha.forEach(animal => {
        const card = document.createElement('div');
        card.className = 'animal-card';
        card.innerHTML = `
            <img src="${animal.img || 'img/placeholder_animal.png'}" alt="Foto de ${animal.nome}">
            <h3>${animal.nome}</h3>
            <p><i class="fas fa-paw"></i> Porte ${animal.porte || 'N/A'}</p>
            <button class="adopt-button page-link-button" onclick="iniciarAdocao('${animal.id}')">Adotar</button>
            <button class="cancel-button" style="background-color:#d9534f; color:white; padding:10px 15px; border:none; border-radius:5px; cursor:pointer; margin-top:5px;" onclick="removerDaCasinha('${animal.id}')">Remover</button>
        `;
        grid.appendChild(card);
    });
}

// Funções da Página de Adoção
async function abrirFormularioParaAnimalEspecifico(animalId) {
    try {
        const { data: animal, error } = await supabaseClient.from('animais').select('id, nome').eq('id', animalId).single();
        if (error || !animal) throw new Error("Animal não encontrado.");
        document.getElementById('animais-disponiveis').style.display = 'none';
        const formSection = document.getElementById('adocao-form-section');
        document.getElementById('adocao-form-title').textContent = `Formulário de Adoção para ${animal.nome}`;
        document.getElementById('animal-id-hidden-input').value = animal.id;
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        alert("Erro: " + error.message);
    }
}

async function buscarEExibirAnimais() {
    const grid = document.getElementById('animais-grid');
    grid.innerHTML = '<p>Buscando amiguinhos...</p>';
    try {
        const { data: animais, error } = await supabaseClient.from('animais').select('*').order('nome', { ascending: true });
        if (error) throw error;
        exibirAnimaisNaGrid(animais);
    } catch (error) {
        grid.innerHTML = `<p style="color:red;">Não foi possível carregar os animais.</p>`;
    }
}

function exibirAnimaisNaGrid(animais) {
    const grid = document.getElementById('animais-grid');
    grid.innerHTML = '';
    if (!animais || animais.length === 0) {
        grid.innerHTML = '<p>Nenhum animalzinho encontrado.</p>';
        return;
    }
    animais.forEach(animal => {
        const card = document.createElement('div');
        card.className = 'animal-card';
        card.dataset.id = animal.id;
        card.dataset.nome = animal.nome;
        card.dataset.porte = animal.porte;
        card.innerHTML = `<img src="${animal.img||'img/placeholder_animal.png'}" alt="Foto de ${animal.nome}"><h3>${animal.nome}</h3><p><i class="fas fa-paw"></i> Porte ${animal.porte||'N/A'}</p><p><i class="fas fa-birthday-cake"></i> ${animal.idade!=null?`${animal.idade} ano(s)`:'N/A'}</p><button class="adopt-button page-link-button">Adicionar à Casinha <i class="fas fa-plus-circle"></i></button>`;
        grid.appendChild(card);
    });
    adicionarEventoAosBotoesAdotar();
}

function adicionarPetNaCasinha(animalData) {
    const casinha = getCasinha();
    if (casinha.some(animal => String(animal.id) === String(animalData.id))) {
        alert(`${animalData.nome} já está na sua casinha!`);
    } else {
        casinha.push(animalData);
        saveCasinha(casinha);
        alert(`${animalData.nome} foi adicionado(a) à sua casinha!`);
    }
}

function adicionarEventoAosBotoesAdotar() {
    document.querySelectorAll('#animais-grid .adopt-button').forEach(botao => {
        botao.addEventListener('click', e => {
            const card = e.target.closest('.animal-card');
            adicionarPetNaCasinha({id: card.dataset.id, nome: card.dataset.nome, img: card.querySelector('img').src, porte: card.dataset.porte});
        });
    });
}

function configurarFormularioAdoção() {
    const formSection = document.getElementById('adocao-form-section');
    const formAdocao = document.getElementById('adocao-form');
    if (formAdocao) {
        formAdocao.querySelector('.cancel-button')?.addEventListener('click', () => {
            formSection.style.display = 'none';
            formAdocao.reset();
            document.getElementById('animais-disponiveis').style.display = 'block';
        });
        formAdocao.addEventListener('submit', async e => {
            e.preventDefault();
            const btn = formAdocao.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Enviando...';
            try {
                const dados = {
                    nome_adotante: document.getElementById('nome-adotante').value,
                    email_adotante: document.getElementById('email-adotante').value,
                    telefone_adotante: document.getElementById('telefone-adotante').value,
                    mensagem_motivacao: document.getElementById('mensagem-adotante').value,
                    animal_id: document.getElementById('animal-id-hidden-input').value,
                };
                const { error } = await supabaseClient.from('pedidos_adocao').insert([dados]);
                if (error) throw error;
                alert('Pedido enviado com sucesso!');
                formSection.style.display = 'none';
                formAdocao.reset();
                document.getElementById('animais-disponiveis').style.display = 'block';
            } catch (error) {
                alert(`Erro: ${error.message}.`);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Enviar Pedido de Adoção';
            }
        });
    }
}

// --- FUNÇÕES DA PÁGINA DE ADMIN ---
function inicializarAdmin(client) {
    const form=document.getElementById('animal-form'), tableBody=document.getElementById('animais-table-body'), idInput=document.getElementById('animal-id'),
          pedidosContainer=document.getElementById('pedidos-container'), formTitle=document.getElementById('form-title'),
          cancelBtn=document.getElementById('cancel-edit-button'), modal=document.getElementById('confirm-modal');
    
    function resetarFormulario(){
        form.reset(); idInput.value=''; formTitle.textContent='Adicionar Novo Animal';
        cancelBtn.style.display='none'; form.querySelector('button[type="submit"]').textContent='Salvar';
    }

    async function carregarAnimais(){
        tableBody.innerHTML='<tr><td colspan="5">Carregando...</td></tr>';
        try{
            const {data, error} = await client.from('animais').select('*').order('id',{descending:true});
            if(error) throw error;
            tableBody.innerHTML='';
            if(data.length===0){ tableBody.innerHTML='<tr><td colspan="5">Nenhum animal.</td></tr>'; }
            else{ data.forEach(a=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${a.id}</td><td>${a.nome}</td><td>${a.especie}</td><td>${a.idade!=null?a.idade:'N/A'}</td><td class="actions"><button class="btn-edit" data-id="${a.id}">Editar</button><button class="btn-delete" data-id="${a.id}">Excluir</button></td>`; tableBody.appendChild(tr); }); }
        } catch(e) { tableBody.innerHTML=`<tr><td colspan="5" style="color:red;">Erro: ${e.message}</td></tr>`; }
    }

    function showConfirmationModal(t,x){
        return new Promise(r=>{
            const mT=document.getElementById('modal-title'), mX=document.getElementById('modal-text'),
                  mC=document.getElementById('modal-confirm-btn'), mN=document.getElementById('modal-cancel-btn');
            mT.textContent=t; mX.textContent=x; modal.classList.add('show');
            const cl=res=>{ modal.classList.remove('show'); mC.onclick=null; mN.onclick=null; r(res); };
            mC.onclick=()=>cl(true); mN.onclick=()=>cl(false);
        });
    }

    async function carregarPedidosAdocao(){
        if(!pedidosContainer) return;
        pedidosContainer.innerHTML='<p>Carregando...</p>';
        try{
            const {data, error} = await client.from('pedidos_adocao').select('*, animais(nome)').order('created_at',{ascending:false});
            if(error) throw error;
            if(!data||data.length===0){ pedidosContainer.innerHTML='<p>Nenhum pedido.</p>'; return; }
            pedidosContainer.innerHTML='';
            data.forEach(p=>{ const c=document.createElement('div'); c.className='pedido-card'; c.innerHTML=`<h4>Pedido para: ${p.animais?p.animais.nome:'Removido'}</h4><p><strong>Solicitante:</strong> ${p.nome_adotante}</p><p><strong>Status:</strong> <strong style="text-transform:uppercase;">${p.status}</strong></p><div class="actions">${p.status==='pendente'?`<button class="btn-approve" data-id="${p.id}" data-animal-id="${p.animal_id}">Aprovar</button><button class="btn-reject" data-id="${p.id}">Rejeitar</button>`:''}</div>`; pedidosContainer.appendChild(c); });
        } catch(e) { pedidosContainer.innerHTML=`<p style="color:red;">Erro: ${e.message}</p>`; }
    }

    async function atualizarStatusPedido(pId,nS,aId){
        const {error} = await client.from('pedidos_adocao').update({status:nS}).eq('id',pId);
        if(error) return alert(`Erro: ${error.message}`);
        if(nS==='aprovado' && aId){
            const {error:delError} = await client.from('animais').delete().eq('id',aId);
            if(delError) alert(`Status ok, erro ao remover animal: ${delError.message}`);
        }
        alert(`Pedido ${nS} com sucesso!`);
        await carregarPedidosAdocao();
        await carregarAnimais();
    }

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const d={nome:document.getElementById('nome').value, especie:document.getElementById('especie').value, sexo:document.getElementById('sexo').value, porte:document.getElementById('porte').value, idade:document.getElementById('idade').value?parseFloat(document.getElementById('idade').value):null, estado:document.getElementById('estado').value, cidade:document.getElementById('cidade').value, img:document.getElementById('img').value, descricao:document.getElementById('descricao').value};
        const id=idInput.value;
        const {error} = id ? await client.from('animais').update(d).eq('id',id) : await client.from('animais').insert([d]);
        if(error) alert('Erro: '+error.message);
        else{ alert('Salvo!'); resetarFormulario(); carregarAnimais(); }
    });

    cancelBtn.addEventListener('click', resetarFormulario);

    tableBody.addEventListener('click', async e => {
        const b=e.target.closest('button');
        if(!b) return;
        const id=b.dataset.id;
        if(b.classList.contains('btn-edit')){
            const {data, error} = await client.from('animais').select('*').eq('id',id).single();
            if(error) return alert('Erro ao carregar dados.');
            idInput.value=data.id; document.getElementById('nome').value=data.nome; document.getElementById('especie').value=data.especie; document.getElementById('sexo').value=data.sexo; document.getElementById('porte').value=data.porte; document.getElementById('idade').value=data.idade; document.getElementById('estado').value=data.estado; document.getElementById('cidade').value=data.cidade; document.getElementById('img').value=data.img; document.getElementById('descricao').value=data.descricao;
            formTitle.textContent=`Editando: ${data.nome}`; form.querySelector('button[type="submit"]').textContent='Atualizar';
            cancelBtn.style.display='inline-block'; form.scrollIntoView({behavior:'smooth'});
        }
        if(b.classList.contains('btn-delete')){
            const ok = await showConfirmationModal('Excluir',`Tem certeza que deseja excluir o animal com ID ${id}?`);
            if(ok){
                const {error} = await client.from('animais').delete().eq('id',id);
                if(error) alert('Erro: ' + error.message);
                else { alert('Excluído com sucesso!'); carregarAnimais(); }
            }
        }
    });

    if(pedidosContainer){
        pedidosContainer.addEventListener('click', async e => {
            const b=e.target.closest('button');
            if(!b) return;
            const id=b.dataset.id;
            if(b.classList.contains('btn-approve')){
                const aId=b.dataset.animalId;
                const ok = await showConfirmationModal('Aprovar Pedido',`Aprovar este pedido? O animal será removido da lista.`);
                if(ok) await atualizarStatusPedido(id,'aprovado',aId);
            } else if(b.classList.contains('btn-reject')){
                const ok = await showConfirmationModal('Rejeitar Pedido',`Tem certeza que deseja rejeitar este pedido?`);
                if(ok) await atualizarStatusPedido(id,'rejeitado',null);
            }
        });
    }

    carregarAnimais();
    carregarPedidosAdocao();
}