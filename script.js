// CREDENCIAIS DO SUPABASE (Substitua pelas tuas credenciais do Supabase)
const SUPABASE_URL = "https://tizlcjmcpfoqgfmjcgwc.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_A6_ekITLKdsOuG2hv9Up7w_Dam76gTE";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let usuarioLogado = null;
let perfilCasal = null;
let viagens = [];
let modoCadastro = false;

window.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        usuarioLogado = session.user;
        await carregarPerfilEColecoes();
    }
});

function toggleMenu() {
    document.getElementById('menuLinks').classList.toggle('ativo');
}

async function carregarPerfilEColecoes() {
    if (!usuarioLogado) return;

    const { data: perfil } = await supabase.from('casais').select('*').eq('id', usuarioLogado.id).single();
    
    if (!perfil) {
        abrirModal('modalConfigCasal');
        return;
    }

    perfilCasal = perfil;
    atualizarInterfacePerfil();
    await carregarViagens();
}

function atualizarInterfacePerfil() {
    document.getElementById('btnAuth').style.display = 'none';
    document.getElementById('btnAdmin').style.display = 'inline-block';
    document.getElementById('btnSair').style.display = 'inline-block';
    document.getElementById('nomeCasalHeader').innerText = `❤️ ${perfilCasal.nome_casal}`;
    document.getElementById('tituloHero').innerText = perfilCasal.nome_casal;

    // Garagem e Rótulos
    document.getElementById('garagemMoto1Nome').innerText = perfilCasal.moto1_nome;
    document.getElementById('garagemMoto1Dono').innerText = perfilCasal.moto1_dono;
    document.getElementById('lblMoto1').innerText = `KM ${perfilCasal.moto1_nome}`;

    document.getElementById('garagemMoto2Nome').innerText = perfilCasal.moto2_nome;
    document.getElementById('garagemMoto2Dono').innerText = perfilCasal.moto2_dono;
    document.getElementById('lblMoto2').innerText = `KM ${perfilCasal.moto2_nome}`;

    const selectMoto = document.getElementById('motoViagem');
    selectMoto.innerHTML = `
        <option value="${perfilCasal.moto1_nome}">${perfilCasal.moto1_nome}</option>
        <option value="${perfilCasal.moto2_nome}">${perfilCasal.moto2_nome}</option>
    `;

    // Calcular Dias Juntos
    const inicio = new Date(perfilCasal.data_inicio);
    const hoje = new Date();
    const dias = Math.ceil(Math.abs(hoje - inicio) / (1000 * 60 * 60 * 24));
    document.getElementById('diasJuntos').innerText = dias;
}

async function carregarViagens() {
    const { data } = await supabase.from('viagens').select('*').order('data', { ascending: false });
    viagens = data || [];
    
    let kmM1 = 0, kmM2 = 0;
    const container = document.getElementById('listaViagens');
    container.innerHTML = '';

    viagens.forEach(v => {
        const kmNum = Number(v.km) || 0;
        if (v.moto === perfilCasal.moto1_nome) kmM1 += kmNum;
        else kmM2 += kmNum;

        container.innerHTML += `
            <div class="viagem-card">
                <img src="${v.capa}" class="viagem-capa">
                <h3>${v.destino}</h3>
                <p style="color:#f4ad4e; font-size:13px; margin:5px 0;">📍 ${v.km} KM • ${v.moto}</p>
                <p style="font-size:12px; color:#aaa;">${v.relato || ''}</p>
            </div>
        `;
    });

    const totalKm = kmM1 + kmM2;
    document.getElementById('kmMoto1').innerText = `${kmM1} km`;
    document.getElementById('kmMoto2').innerText = `${kmM2} km`;
    document.getElementById('garagemMoto1Km').innerText = `${kmM1} km`;
    document.getElementById('garagemMoto2Km').innerText = `${kmM2} km`;
    document.getElementById('kmTotal').innerText = `${totalKm} km`;
    document.getElementById('totalViagens').innerText = viagens.length;

    const meta = 2000;
    const pct = Math.min(Math.round((totalKm / meta) * 100), 100);
    document.getElementById('metaAtual').innerText = `${pct}%`;
    document.getElementById('progresso').style.width = `${pct}%`;
    document.getElementById('textoMeta').innerText = `${totalKm} / ${meta} km`;
}

async function autenticarUsuario(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authSenha').value;

    if (modoCadastro) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return alert(error.message);
        usuarioLogado = data.user;
        fecharModal('modalAuth');
        abrirModal('modalConfigCasal');
    } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return alert(error.message);
        usuarioLogado = data.user;
        fecharModal('modalAuth');
        await carregarPerfilEColecoes();
    }
}

async function salvarPerfilCasal(e) {
    e.preventDefault();
    const payload = {
        id: usuarioLogado.id,
        nome_casal: document.getElementById('cfgNomeCasal').value,
        data_inicio: document.getElementById('cfgDataInicio').value,
        moto1_nome: document.getElementById('cfgMoto1Nome').value,
        moto1_dono: document.getElementById('cfgMoto1Dono').value,
        moto2_nome: document.getElementById('cfgMoto2Nome').value,
        moto2_dono: document.getElementById('cfgMoto2Dono').value,
    };

    const { error } = await supabase.from('casais').upsert([payload]);
    if (error) return alert(error.message);
    fecharModal('modalConfigCasal');
    await carregarPerfilEColecoes();
}

async function salvarViagem(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSalvarViagem');
    btn.innerText = 'Enviando...';

    try {
        const file = document.getElementById('capaFile').files[0];
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        await supabase.storage.from('fotos-viagens').upload(fileName, file);
        const { data: pUrl } = supabase.storage.from('fotos-viagens').getPublicUrl(fileName);

        await supabase.from('viagens').insert([{
            user_id: usuarioLogado.id,
            destino: document.getElementById('destino').value,
            data: document.getElementById('dataViagem').value,
            km: document.getElementById('kmViagem').value,
            moto: document.getElementById('motoViagem').value,
            relato: document.getElementById('relato').value,
            capa: pUrl.publicUrl
        }]);

        alert('Viagem cadastrada!');
        fecharModal('modalAdmin');
        await carregarViagens();
    } catch(err) {
        alert('Erro ao salvar: ' + err.message);
    } finally {
        btn.innerText = 'Salvar Viagem';
    }
}

function alternarModoAuth() {
    modoCadastro = !modoCadastro;
    document.getElementById('authTitulo').innerText = modoCadastro ? 'Cadastrar Novo Casal' : 'Entrar na Conta';
    document.getElementById('btnAuthSubmit').innerText = modoCadastro ? 'Criar Conta' : 'Entrar';
}

async function deslogar() {
    await supabase.auth.signOut();
    location.reload();
}

function abrirModal(id) { document.getElementById(id).classList.add('ativo'); }
function fecharModal(id) { document.getElementById(id).classList.remove('ativo'); }