// =================================================================================
// SCRIPT ÚNICO DE EMERGÊNCIA - ADOPET - VERSÃO FINALÍSSIMA COMPLETA
// =================================================================================

const SUPABASE_URL = 'https://fcozxgnwoubuqiynmwwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb3p4Z253b3VidXFpeW5td3dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODQyNDMsImV4cCI6MjA2NjM2MDI0M30.bg-bRTkMPVq78MTdbJc-zCTqRTDsla7m7pc4sH3PFn0';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- FUNÇÕES GLOBAIS (CASINHA) ---
function getCasinha() { return JSON.parse(localStorage.getItem('casinhaAdopet')) || []; }
function saveCasinha(c) { localStorage.setItem('casinhaAdopet', JSON.stringify(c)); updateCasinhaContador(); }
function updateCasinhaContador() {
    const cont = document.getElementById('casinha-contador');
    if (cont) { const c = getCasinha(); cont.textContent = c.length; cont.style.display = c.length > 0 ? 'block' : 'none'; }
}

// --- GATILHO PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    // Lógica do Header (Roda em todas as páginas)
    const pI = document.getElementById('user-profile-icon'), lB = document.getElementById('login-link-button'), aL = document.getElementById('admin-link-li');
    supabaseClient.auth.onAuthStateChange(async (_, session) => {
        const user = session?.user;
        if (pI && lB && aL) {
            if (user) {
                pI.style.display = 'block'; lB.style.display = 'none';
                try {
                    const { data } = await supabaseClient.from('usuarios').select('is_admin').eq('id', user.id).single();
                    aL.style.display = data?.is_admin ? 'list-item' : 'none';
                } catch { aL.style.display = 'none'; }
            } else { pI.style.display = 'none'; lB.style.display = 'block'; aL.style.display = 'none'; }
        }
    });
    updateCasinhaContador();

    // Lógica da Página de Adoção
    if (document.getElementById('animais-grid')) {
        const p = new URLSearchParams(window.location.search).get('animalId');
        if (p) abrirFormularioParaAnimalEspecifico(p); else buscarEExibirAnimais();
        configurarFormularioAdoção();
    }
    // Lógica da Página de Admin
    if (document.getElementById('admin-content')) {
        inicializarAdmin(supabaseClient);
    }
    // Lógica da Casinha
    if (document.getElementById('casinha-grid')) {
        setupCasinhaPage();
    }
});

// --- FUNÇÕES DA PÁGINA DE ADOÇÃO ---
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
        card.dataset.id = animal.id; card.dataset.nome = animal.nome; card.dataset.porte = animal.porte;
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
    const formSection = document.getElementById('adocao-form-section'), formAdocao = document.getElementById('adocao-form');
    if (formAdocao) {
        formAdocao.querySelector('.cancel-button')?.addEventListener('click', () => {
            formSection.style.display = 'none'; formAdocao.reset();
            document.getElementById('animais-disponiveis').style.display = 'block';
        });
        formAdocao.addEventListener('submit', async e => {
            e.preventDefault();
            const btn = formAdocao.querySelector('button[type="submit"]');
            btn.disabled = true; btn.textContent = 'Enviando...';
            try {
                const dados = {
                    nome_adotante: document.getElementById('nome-adotante').value, email_adotante: document.getElementById('email-adotante').value,
                    telefone_adotante: document.getElementById('telefone-adotante').value, mensagem_motivacao: document.getElementById('mensagem-adotante').value,
                    animal_id: document.getElementById('animal-id-hidden-input').value,
                };
                const { error } = await supabaseClient.from('pedidos_adocao').insert([dados]);
                if (error) throw error;
                alert('Pedido enviado com sucesso!');
                formSection.style.display = 'none'; formAdocao.reset();
                document.getElementById('animais-disponiveis').style.display = 'block';
            } catch (error) {
                alert(`Erro: ${error.message}.`);
            } finally {
                btn.disabled = false; btn.textContent = 'Enviar Pedido';
            }
        });
    }
}

// --- FUNÇÕES DA PÁGINA DE ADMIN ---
async function inicializarAdmin(client) {
    const form=document.getElementById('animal-form'),tableBody=document.getElementById('animais-table-body'),idInput=document.getElementById('animal-id'),pedidosContainer=document.getElementById('pedidos-container'),formTitle=document.getElementById('form-title'),cancelBtn=document.getElementById('cancel-edit-button'),modal=document.getElementById('confirm-modal');
    function resetarFormulario(){form.reset();idInput.value='';formTitle.textContent='Adicionar Novo Animal';cancelBtn.style.display='none';form.querySelector('button[type="submit"]').textContent='Salvar';}
    async function carregarAnimais(){tableBody.innerHTML='<tr><td colspan="5">Carregando...</td></tr>';try{const{data,error}=await client.from('animais').select('*').order('id',{descending:true});if(error)throw error;tableBody.innerHTML='';if(data.length===0){tableBody.innerHTML='<tr><td colspan="5">Nenhum animal.</td></tr>';}else{data.forEach(a=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${a.id}</td><td>${a.nome}</td><td>${a.especie}</td><td>${a.idade!=null?a.idade:'N/A'}</td><td class="actions"><button class="btn-edit" data-id="${a.id}">Editar</button><button class="btn-delete" data-id="${a.id}">Excluir</button></td>`;tableBody.appendChild(tr);});}}catch(e){tableBody.innerHTML=`<tr><td colspan="5" style="color:red;">Erro: ${e.message}</td></tr>`;}}
    function showConfirmationModal(t,x){return new Promise(r=>{const mT=document.getElementById('modal-title'),mX=document.getElementById('modal-text'),mC=document.getElementById('modal-confirm-btn'),mN=document.getElementById('modal-cancel-btn');mT.textContent=t;mX.textContent=x;modal.classList.add('show');const cl=res=>{modal.classList.remove('show');mC.onclick=null;mN.onclick=null;r(res);};mC.onclick=()=>cl(true);mN.onclick=()=>cl(false);});}
    async function carregarPedidosAdocao(){if(!pedidosContainer)return;pedidosContainer.innerHTML='<p>Carregando...</p>';try{const{data,error}=await client.from('pedidos_adocao').select('*, animais(nome)').order('created_at',{ascending:false});if(error)throw error;if(!data||data.length===0){pedidosContainer.innerHTML='<p>Nenhum pedido.</p>';return;}pedidosContainer.innerHTML='';data.forEach(p=>{const c=document.createElement('div');c.className='pedido-card';c.innerHTML=`<h4>Pedido para: ${p.animais?p.animais.nome:'Removido'}</h4><p><strong>Solicitante:</strong> ${p.nome_adotante}</p><p><strong>Status:</strong> <strong style="text-transform:uppercase;">${p.status}</strong></p><div class="actions">${p.status==='pendente'?`<button class="btn-approve" data-id="${p.id}" data-animal-id="${p.animal_id}">Aprovar</button><button class="btn-reject" data-id="${p.id}">Rejeitar</button>`:''}</div>`;pedidosContainer.appendChild(c);});}catch(e){pedidosContainer.innerHTML=`<p style="color:red;">Erro: ${e.message}</p>`;}}
    async function atualizarStatusPedido(pId,nS,aId){const{error}=await client.from('pedidos_adocao').update({status:nS}).eq('id',pId);if(error)return alert(`Erro: ${error.message}`);if(nS==='aprovado'&&aId){const{error:delError}=await client.from('animais').delete().eq('id',aId);if(delError)alert(`Status ok, erro ao remover: ${delError.message}`);}alert(`Pedido ${nS} com sucesso!`);await carregarPedidosAdocao();await carregarAnimais();}
    form.addEventListener('submit',async e=>{e.preventDefault();const d={nome:nome.value,especie:especie.value,sexo:sexo.value,porte:porte.value,idade:idade.value?parseFloat(idade.value):null,estado:estado.value,cidade:cidade.value,img:img.value,descricao:descricao.value};const id=idInput.value;const{error}=id?await client.from('animais').update(d).eq('id',id):await client.from('animais').insert([d]);if(error)alert('Erro: '+error.message);else{alert('Salvo!');resetarFormulario();carregarAnimais();}});
    cancelBtn.addEventListener('click',resetarFormulario);
    tableBody.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.id;if(b.classList.contains('btn-edit')){const{data,error}=await client.from('animais').select('*').eq('id',id).single();if(error)return alert('Erro.');idInput.value=data.id;nome.value=data.nome;especie.value=data.especie;sexo.value=data.sexo;porte.value=data.porte;idade.value=data.idade;estado.value=data.estado;cidade.value=data.cidade;img.value=data.img;descricao.value=data.descricao;formTitle.textContent=`Editando: ${data.nome}`;form.querySelector('button[type="submit"]').textContent='Atualizar';cancelBtn.style.display='inline-block';form.scrollIntoView({behavior:'smooth'});}if(b.classList.contains('btn-delete')){const ok=await showConfirmationModal('Excluir',`ID ${id}?`);if(ok){const{error}=await client.from('animais').delete().eq('id',id);if(error)alert('Erro: '+error.message);else{alert('Excluído!');carregarAnimais();}}}});
    if(pedidosContainer){pedidosContainer.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.id;if(b.classList.contains('btn-approve')){const aId=b.dataset.animalId;const ok=await showConfirmationModal('Aprovar',`Aprovar? Animal será removido.`);if(ok)await atualizarStatusPedido(id,'aprovado',aId);}else if(b.classList.contains('btn-reject')){const ok=await showConfirmationModal('Rejeitar',`Rejeitar pedido?`);if(ok)await atualizarStatusPedido(id,'rejeitado',null);}});}
    carregarAnimais();carregarPedidosAdocao();
}

// --- FUNÇÕES DA PÁGINA DA CASINHA ---
function setupCasinhaPage() {
    const lP=document.getElementById('login-prompt-casinha'),c=document.getElementById('casinha-content'),vM=document.getElementById('casinha-vazia-msg'),g=document.getElementById('casinha-grid');
    supabaseClient.auth.onAuthStateChange((_,s)=>{if(s?.user){lP.style.display='none';displayPetsNaCasinha();}else{c.style.display='none';vM.style.display='none';lP.style.display='block';}});
    function displayPetsNaCasinha(){const ca=getCasinha();g.innerHTML='';if(ca.length===0){c.style.display='none';vM.style.display='block';return;}c.style.display='block';vM.style.display='none';ca.forEach(a=>{const card=document.createElement('div');card.className='animal-card';card.innerHTML=`<img src="${a.img||'img/placeholder_animal.png'}" alt="${a.nome}"><h3>${a.nome}</h3><p><i class="fas fa-paw"></i> Porte ${a.porte||'N/A'}</p><button class="adopt-button page-link-button" onclick="iniciarAdocao('${a.id}')">Adotar</button><button class="cancel-button" style="background-color:#d9534f;color:white;padding:10px 15px;border:none;border-radius:5px;cursor:pointer;margin-top:5px;" onclick="removerDaCasinha('${a.id}')">Remover</button>`;g.appendChild(card);});}
}
window.removerDaCasinha = function(id) { let c = getCasinha(); saveCasinha(c.filter(a => String(a.id) !== id)); setupCasinhaPage(); }
window.iniciarAdocao = function(id) { window.location.href = `adocao.html?animalId=${id}`; }