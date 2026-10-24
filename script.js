/* Asfalto a Dois — Supabase Mantém os IDs e o visual do HTML existente. Leituras públicas; alterações exigem sessão Supabase e vínculo ao casal. */

const SUPABASE_URL = "https://tizlcjmcpfoqgfmjcgwc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_A6_ekITLKdsOuG2hv9Up7w_Dam76gTE";
const COUPLE_ID = "f83f68b4-1470-476b-a26c-6378cd4729ba";
const BUCKET_FOTOS = "asfalto-fotos";
const META_PADRAO_KM = 2000;
const CAPA_PADRAO =
  "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80";

if (!window.supabase)
  throw new Error(
    "Biblioteca Supabase não carregada. Confira o script no index.html."
  );
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let viagens = [];
let senhaAdmin = ""; // Senhas não são armazenadas no localStorage.
let tempCapaBase64 = "";
let tempAlbumBase64 = [];
let viagemAtivaModal = null;
let fotoIndexAtiva = 0;
let metaKm = META_PADRAO_KM;
let sessaoAdmin = false;
let carregando = false;

function calcularDiasJuntos() {
  // Mantida a data que já era usada pelo site.
  const inicioRelacionamento = new Date("2026-02-22T00:00:00");
  const hoje = new Date();
  inicioRelacionamento.setHours(0, 0, 0, 0);
  hoje.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.floor((hoje.getTime() - inicioRelacionamento.getTime()) / 86400000)
  );
}

function mostrarToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.innerText = msg;
  t.classList.add("visivel");
  clearTimeout(mostrarToast.timer);
  mostrarToast.timer = setTimeout(() => t.classList.remove("visivel"), 3500);
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>\"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}

function toggleMenu() {
  const links = document.getElementById("menuLinks");
  if (links) links.classList.toggle("ativo");
}

function abrirModalAdmin() {
  const links = document.getElementById("menuLinks");
  if (links?.classList.contains("ativo")) links.classList.remove("ativo");
  document.getElementById("modalAdmin").classList.remove("escondido");
  atualizarEstadoLogin();
}

function fecharModalAdmin() {
  document.getElementById("modalAdmin").classList.add("escondido");
}

function atualizarEstadoLogin() {
  document.getElementById("admin-login").style.display = sessaoAdmin
    ? "none"
    : "block";
  document.getElementById("admin-conteudo").style.display = sessaoAdmin
    ? "block"
    : "none";
}

async function autenticarAdmin() {
  const email = document.getElementById("emailInput")?.value.trim();
  const senha = document.getElementById("senhaInput")?.value;
  if (!email || !senha)
    return mostrarToast("Informe seu e-mail e sua senha do Supabase.");
  const botao = document.getElementById("btnEntrarAdmin");
  if (botao) {
    botao.disabled = true;
    botao.textContent = "Entrando…";
  }
  try {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) throw error;
    const { data: membro, error: erroMembro } = await db
      .from("couple_members")
      .select("role")
      .eq("couple_id", COUPLE_ID)
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (erroMembro) throw erroMembro;
    if (!membro) {
      await db.auth.signOut();
      throw new Error(
        "Esta conta não está autorizada a administrar o Asfalto a Dois."
      );
    }
    sessaoAdmin = true;
    atualizarEstadoLogin();
    document.getElementById("senhaInput").value = "";
    mostrarToast("Acesso autorizado!");
    renderizarAdminLista();
  } catch (err) {
    mostrarToast(
      err.message || "Não foi possível entrar. Confira e-mail e senha."
    );
  } finally {
    if (botao) {
      botao.disabled = false;
      botao.textContent = "Entrar no Painel";
    }
  }
}

async function sairAdmin() {
  const { error } = await db.auth.signOut();
  if (error) return mostrarToast("Erro ao sair: " + error.message);
  sessaoAdmin = false;
  atualizarEstadoLogin();
  resetForm();
  mostrarToast("Você saiu do painel.");
}

async function alterarSenhaAdmin() {
  const nova = prompt(
    "Digite a nova senha da sua conta Supabase (mínimo conforme as regras da conta):"
  );
  if (!nova || !nova.trim()) return;
  const { error } = await db.auth.updateUser({ password: nova.trim() });
  if (error) mostrarToast("Não foi possível alterar a senha: " + error.message);
  else mostrarToast("Senha da conta atualizada!");
}

async function comprimirImagem( file, maxWidth = 1200, maxHeight = 1200, quality = 0.7 ) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width,
          height = img.height;
        if (width > height && width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else if (height >= width && height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlParaBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(",");
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "image/jpeg";
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function enviarFoto(dataUrl, prefixo = "foto") {
  const blob = dataUrlParaBlob(dataUrl);
  const caminho = `${COUPLE_ID}/${Date.now()}-${crypto.randomUUID()}-${prefixo}.jpg`;
  const { error } = await db.storage
    .from(BUCKET_FOTOS)
    .upload(caminho, blob, {
      contentType: "image/jpeg",
      upsert: false,
      cacheControl: "3600",
    });
  if (error) throw error;
  const { data } = db.storage.from(BUCKET_FOTOS).getPublicUrl(caminho);
  return { path: caminho, url: data.publicUrl };
}

function urlFoto(caminho) {
  if (!caminho) return "";
  if (/^https?:\/\//i.test(caminho) || caminho.startsWith("data:"))
    return caminho;
  return db.storage.from(BUCKET_FOTOS).getPublicUrl(caminho).data.publicUrl;
}

async function carregarDados() {
  if (carregando) return;
  carregando = true;
  try {
    const [tripsRes, albumsRes, photosRes, goalsRes] = await Promise.all([
      db
        .from("trips")
        .select(
          "id,couple_id,destination,start_date,end_date,description,km_total,cover_path,moto,created_at"
        )
        .eq("couple_id", COUPLE_ID)
        .order("start_date", { ascending: false, nullsFirst: false }),
      db
        .from("albums")
        .select("id,couple_id,trip_id,title,description,cover_path,created_at")
        .eq("couple_id", COUPLE_ID),
      db
        .from("photos")
        .select(
          "id,couple_id,album_id,storage_path,caption,taken_at,sort_order,created_at"
        )
        .eq("couple_id", COUPLE_ID)
        .order("sort_order", { ascending: true }),
      db
        .from("couple_goals")
        .select("target_km")
        .eq("couple_id", COUPLE_ID)
        .maybeSingle(),
    ]);
    for (const result of [tripsRes, albumsRes, photosRes, goalsRes])
      if (result.error) throw result.error;
    const albums = albumsRes.data || [];
    const photos = photosRes.data || [];
    viagens = (tripsRes.data || []).map((t) => {
      const album = albums.find((a) => a.trip_id === t.id);
      const fotos = album
        ? photos
            .filter((p) => p.album_id === album.id)
            .map((p) => urlFoto(p.storage_path))
        : [];
      const capa =
        urlFoto(t.cover_path || album?.cover_path || "") ||
        fotos[0] ||
        CAPA_PADRAO;
      return {
        id: t.id,
        destino: t.destination,
        data: t.start_date || "",
        km: Number(t.km_total) || 0,
        moto: t.moto || "Ambas",
        relato: t.description || "",
        capa,
        capaPath: t.cover_path || album?.cover_path || null,
        albumId: album?.id || null,
        album: fotos.length ? fotos : t.cover_path ? [capa] : [],
      };
    });
    metaKm = Number(goalsRes.data?.target_km) || META_PADRAO_KM;
    atualizarEstatisticas();
    renderizarViagens();
    if (sessaoAdmin) renderizarAdminLista();
  } catch (err) {
    console.error("Falha ao carregar dados do Supabase:", err);
    mostrarToast(
      "Não foi possível carregar os dados do Supabase. Confira a configuração e as políticas."
    );
  } finally {
    carregando = false;
  }
}

function atualizarEstatisticas() {
  let totalKm = 0,
    kmTitan = 0,
    kmFan = 0;
  viagens.forEach((v) => {
    const km = Number(v.km) || 0;
    totalKm += km;
    if (v.moto === "Titan 150") kmTitan += km;
    else if (v.moto === "Fan 150") kmFan += km;
    else if (v.moto === "Ambas") {
      kmTitan += km;
      kmFan += km;
    }
  });
  document.getElementById("diasJuntos").innerText = calcularDiasJuntos();
  document.getElementById("totalViagens").innerText = viagens.length;
  document.getElementById("kmTitan").innerText = `${kmTitan.toLocaleString( "pt-BR" )} km`;
  document.getElementById("kmFan").innerText = `${kmFan.toLocaleString( "pt-BR" )} km`;
  document.getElementById("kmTotal").innerText = `${totalKm.toLocaleString( "pt-BR" )} km`;
  document.getElementById(
    "kmTitanGaragem"
  ).innerText = `${kmTitan.toLocaleString("pt-BR")} km`;
  document.getElementById("kmFanGaragem").innerText = `${kmFan.toLocaleString( "pt-BR" )} km`;
  const pct = Math.min(
    Math.round((totalKm / (metaKm || META_PADRAO_KM)) * 100),
    100
  );
  document.getElementById("metaAtual").innerText = `${pct}%`;
  document.getElementById("progresso").style.width = `${pct}%`;
  document.getElementById("textoMeta").innerText = `${totalKm.toLocaleString( "pt-BR" )} / ${metaKm} km`;
}

function renderizarViagens() {
  const lista = document.getElementById("listaViagens");
  if (!viagens.length) {
    lista.innerHTML = `<p style="text-align:center;color:#888;grid-column:1/-1;">Nenhuma viagem cadastrada ainda.</p>`;
    return;
  }
  lista.innerHTML = viagens
    .map((v) => {
      const numFotos = v.album?.length || (v.capa ? 1 : 0);
      const dataFormatada = v.data
        ? new Date(v.data + "T00:00:00").toLocaleDateString("pt-BR")
        : "Data não informada";
      const capaImg = v.capa || v.album?.[0] || CAPA_PADRAO;
      return `<div class="viagem-card" onclick="abrirAlbumModal('${escapeHtml( v.id )}')"> <img class="viagem-capa" src="${escapeHtml( capaImg )}" alt="${escapeHtml( v.destino )}" onerror="this.src='${CAPA_PADRAO}'"> <div class="viagem-topo"><span class="viagem-etiqueta">🏍️ ${escapeHtml( v.moto )}</span><span class="viagem-data">${escapeHtml( dataFormatada )}</span></div> <h3 class="viagem-cidade">${escapeHtml( v.destino )}</h3><p class="viagem-descricao">${escapeHtml( v.relato || "Clique para ver as fotos e relato." )}</p> <div class="viagem-distancia"><span class="viagem-icone">🛣️</span><div class="viagem-texto-distancia"><span class="viagem-km">${ Number(v.km) || 0 } KM</span><span class="viagem-legenda">Distância Rodada</span></div></div> <button type="button" class="btn-abrir-album">🖼️ Ver Álbum (${numFotos} fotos)</button></div>`;
    })
    .join("");
}

async function previewCapa(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    tempCapaBase64 = await comprimirImagem(file);
    document.getElementById("capaPreviewImg").src = tempCapaBase64;
    document.getElementById("previewCapaContainer").style.display = "block";
  } catch {
    mostrarToast("Erro ao processar imagem da capa.");
  }
}

async function previewAlbum(event) {
  const files = Array.from(event.target.files || []);
  tempAlbumBase64 = [];
  const container = document.getElementById("previewAlbumContainer");
  container.innerHTML = "";
  for (const file of files) {
    try {
      const imgData = await comprimirImagem(file);
      tempAlbumBase64.push(imgData);
      const img = document.createElement("img");
      img.src = imgData;
      img.className = "mini-preview";
      container.appendChild(img);
    } catch (err) {
      console.error("Erro ao processar foto:", err);
    }
  }
}

async function salvarViagem(e) {
  e.preventDefault();
  if (!sessaoAdmin)
    return mostrarToast("Entre no painel antes de salvar uma viagem.");
  const editId = document.getElementById("editId").value;
  const destino = document.getElementById("destinoInput").value.trim();
  const data = document.getElementById("dataInput").value;
  const km = Number(document.getElementById("kmInput").value);
  const moto = document.getElementById("motoInput").value;
  const relato = document.getElementById("relatoInput").value.trim();
  if (!destino || !data || !Number.isFinite(km) || km < 0)
    return mostrarToast("Confira destino, data e quilometragem.");
  const submit = document.querySelector("#formViagem button[type='submit']");
  if (submit) {
    submit.disabled = true;
    submit.textContent = "Salvando…";
  }
  try {
    let tripId = editId;
    let albumId = editId ? viagens.find((v) => v.id === editId)?.albumId : null;
    let coverPath = editId
      ? viagens.find((v) => v.id === editId)?.capaPath || null
      : null;
    const payload = {
      couple_id: COUPLE_ID,
      destination: destino,
      start_date: data,
      description: relato || null,
      km_total: km,
      moto,
    };
    if (editId) {
      const { error } = await db
        .from("trips")
        .update(payload)
        .eq("id", editId)
        .eq("couple_id", COUPLE_ID);
      if (error) throw error;
    } else {
      const { data: created, error } = await db
        .from("trips")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      tripId = created.id;
    }
    let uploadedCover = null;
    if (tempCapaBase64) {
      uploadedCover = await enviarFoto(tempCapaBase64, "capa");
      coverPath = uploadedCover.path;
    }
    const uploadedAlbum = [];
    for (const [i, imageData] of tempAlbumBase64.entries())
      uploadedAlbum.push(await enviarFoto(imageData, `album-${i + 1}`));
    if (uploadedAlbum.length && !uploadedCover) {
      uploadedCover = uploadedAlbum[0];
      coverPath = uploadedCover.path;
    }
    if (coverPath !== null || uploadedCover) {
      const { error } = await db
        .from("trips")
        .update({ cover_path: coverPath })
        .eq("id", tripId)
        .eq("couple_id", COUPLE_ID);
      if (error) throw error;
    }
    if (!albumId && (uploadedAlbum.length || uploadedCover)) {
      const { data: newAlbum, error } = await db
        .from("albums")
        .insert({
          couple_id: COUPLE_ID,
          trip_id: tripId,
          title: destino,
          description: relato || null,
          cover_path: coverPath,
        })
        .select("id")
        .single();
      if (error) throw error;
      albumId = newAlbum.id;
    } else if (albumId) {
      const { error } = await db
        .from("albums")
        .update({
          title: destino,
          description: relato || null,
          cover_path: coverPath,
        })
        .eq("id", albumId)
        .eq("couple_id", COUPLE_ID);
      if (error) throw error;
    }
    if (albumId && uploadedAlbum.length) {
      const { data: oldPhotos, error: oldError } = await db
        .from("photos")
        .select("id,storage_path")
        .eq("album_id", albumId)
        .eq("couple_id", COUPLE_ID);
      if (oldError) throw oldError;
      if (oldPhotos?.length) {
        const { error } = await db
          .from("photos")
          .delete()
          .eq("album_id", albumId)
          .eq("couple_id", COUPLE_ID);
        if (error) throw error;
        const oldPaths = oldPhotos.map((p) => p.storage_path).filter(Boolean);
        if (oldPaths.length) {
          const { error: storageError } = await db.storage
            .from(BUCKET_FOTOS)
            .remove(oldPaths);
          if (storageError)
            console.warn(
              "Fotos antigas não removidas do Storage:",
              storageError
            );
        }
      }
    }
    if (albumId) {
      const newPhotoRows = uploadedAlbum.map((f, i) => ({
        couple_id: COUPLE_ID,
        album_id: albumId,
        storage_path: f.path,
        caption: null,
        taken_at: data || null,
        sort_order: i,
      }));
      if (uploadedCover && !uploadedAlbum.length)
        newPhotoRows.push({
          couple_id: COUPLE_ID,
          album_id: albumId,
          storage_path: uploadedCover.path,
          caption: "Capa",
          taken_at: data || null,
          sort_order: 0,
        });
      if (newPhotoRows.length) {
        const { error } = await db.from("photos").insert(newPhotoRows);
        if (error) throw error;
      }
    }
    await carregarDados();
    resetForm();
    renderizarAdminLista();
    mostrarToast(
      editId ? "Viagem atualizada no Supabase!" : "Viagem salva no Supabase!"
    );
  } catch (err) {
    console.error("Erro ao salvar viagem:", err);
    mostrarToast(
      "Não foi possível salvar: " +
        (err.message || "verifique a conexão e as permissões.")
    );
  } finally {
    if (submit) {
      submit.disabled = false;
      submit.textContent = "Salvar viagem";
    }
  }
}

function resetForm() {
  document.getElementById("formViagem").reset();
  document.getElementById("editId").value = "";
  tempCapaBase64 = "";
  tempAlbumBase64 = [];
  document.getElementById("previewCapaContainer").style.display = "none";
  document.getElementById("previewAlbumContainer").innerHTML = "";
  document.getElementById("formTitulo").innerText = "Cadastrar Nova Viagem";
  document.getElementById("btnCancelarEdit").style.display = "none";
}

function editarViagemAdmin(id) {
  if (!sessaoAdmin) return mostrarToast("Entre no painel para editar viagens.");
  const v = viagens.find((item) => item.id === id);
  if (!v) return;
  document.getElementById("editId").value = v.id;
  document.getElementById("destinoInput").value = v.destino;
  document.getElementById("dataInput").value = v.data;
  document.getElementById("kmInput").value = v.km;
  document.getElementById("motoInput").value = v.moto;
  document.getElementById("relatoInput").value = v.relato || "";
  tempCapaBase64 = "";
  tempAlbumBase64 = [];
  if (v.capa) {
    document.getElementById("capaPreviewImg").src = v.capa;
    document.getElementById("previewCapaContainer").style.display = "block";
  }
  document.getElementById("formTitulo").innerText = "Editar Viagem";
  document.getElementById("btnCancelarEdit").style.display = "block";
  document
    .getElementById("formViagem")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

async function excluirViagemAdmin(id) {
  if (!sessaoAdmin)
    return mostrarToast("Entre no painel para excluir viagens.");
  if (
    !confirm(
      "Excluir esta viagem permanentemente? Essa ação não pode ser desfeita."
    )
  )
    return;
  try {
    const v = viagens.find((item) => item.id === id);
    if (v?.albumId) {
      const { data: fotos, error: fotoErr } = await db
        .from("photos")
        .select("storage_path")
        .eq("album_id", v.albumId)
        .eq("couple_id", COUPLE_ID);
      if (fotoErr) throw fotoErr;
      const { error: deletePhotosErr } = await db
        .from("photos")
        .delete()
        .eq("album_id", v.albumId)
        .eq("couple_id", COUPLE_ID);
      if (deletePhotosErr) throw deletePhotosErr;
      const { error: deleteAlbumErr } = await db
        .from("albums")
        .delete()
        .eq("id", v.albumId)
        .eq("couple_id", COUPLE_ID);
      if (deleteAlbumErr) throw deleteAlbumErr;
      const paths = (fotos || []).map((p) => p.storage_path).filter(Boolean);
      if (v.capaPath && !paths.includes(v.capaPath)) paths.push(v.capaPath);
      if (paths.length) {
        const { error } = await db.storage.from(BUCKET_FOTOS).remove(paths);
        if (error) console.warn("Algumas imagens não foram removidas:", error);
      }
    } else if (v?.capaPath) {
      const { error } = await db.storage
        .from(BUCKET_FOTOS)
        .remove([v.capaPath]);
      if (error) console.warn(error);
    }
    const { error } = await db
      .from("trips")
      .delete()
      .eq("id", id)
      .eq("couple_id", COUPLE_ID);
    if (error) throw error;
    await carregarDados();
    renderizarAdminLista();
    mostrarToast("Viagem removida do Supabase.");
  } catch (err) {
    console.error(err);
    mostrarToast(
      "Erro ao excluir: " + (err.message || "verifique as permissões.")
    );
  }
}

function renderizarAdminLista() {
  const cont = document.getElementById("adminListaViagens");
  if (!cont) return;
  if (!sessaoAdmin) {
    cont.innerHTML = "";
    return;
  }
  if (!viagens.length) {
    cont.innerHTML =
      "<p style='color:#777;font-size:.85rem;'>Nenhuma viagem salva.</p>";
    return;
  }
  cont.innerHTML = viagens
    .map(
      (v) =>
        `<div class="admin-viagem-item"><div><strong class="admin-destino">${escapeHtml( v.destino )}</strong><span class="admin-km">${ Number(v.km) || 0 } KM</span></div><div><button class="btn-secundario" onclick="editarViagemAdmin('${escapeHtml( v.id )}')">✏️ Editar</button> <button class="btn-secundario btn-excluir" onclick="excluirViagemAdmin('${escapeHtml( v.id )}')">🗑️</button></div></div>`
    )
    .join("");
}

function abrirAlbumModal(id) {
  viagemAtivaModal = viagens.find((v) => v.id === id);
  if (!viagemAtivaModal) return;
  fotoIndexAtiva = 0;
  document.getElementById("modalTitulo").innerText = viagemAtivaModal.destino;
  const dataFmt = viagemAtivaModal.data
    ? new Date(viagemAtivaModal.data + "T00:00:00").toLocaleDateString("pt-BR")
    : "Data não informada";
  document.getElementById(
    "modalSubtitulo"
  ).innerText = `${dataFmt} • ${viagemAtivaModal.km} KM • Moto: ${viagemAtivaModal.moto}`;
  document.getElementById("modalRelato").innerText =
    viagemAtivaModal.relato || "Sem história/relato cadastrado.";
  renderizarCarrossel();
  document.getElementById("modalAlbum").classList.remove("escondido");
}
function fecharModalAlbum() {
  document.getElementById("modalAlbum").classList.add("escondido");
  viagemAtivaModal = null;
}
function renderizarCarrossel() {
  if (!viagemAtivaModal) return;
  const fotos = viagemAtivaModal.album?.length
    ? viagemAtivaModal.album
    : [viagemAtivaModal.capa || CAPA_PADRAO];
  fotoIndexAtiva =
    ((fotoIndexAtiva % fotos.length) + fotos.length) % fotos.length;
  document.getElementById("carrosselImg").src = fotos[fotoIndexAtiva];
  document.getElementById("carrosselAtual").innerText = fotoIndexAtiva + 1;
  document.getElementById("carrosselTotal").innerText = fotos.length;
  document.getElementById("modalThumbs").innerHTML = fotos
    .map(
      (f, idx) =>
        `<img src="${escapeHtml(f)}" alt="Miniatura ${idx + 1}" class="thumb ${ idx === fotoIndexAtiva ? "ativa" : "" }" onclick="selecionarFoto(${idx})">`
    )
    .join("");
}
function mudarFoto(dir) {
  if (!viagemAtivaModal) return;
  const fotos = viagemAtivaModal.album?.length
    ? viagemAtivaModal.album
    : [viagemAtivaModal.capa || CAPA_PADRAO];
  fotoIndexAtiva = (fotoIndexAtiva + dir + fotos.length) % fotos.length;
  renderizarCarrossel();
}
function selecionarFoto(idx) {
  fotoIndexAtiva = idx;
  renderizarCarrossel();
}

async function inicializar() {
  const { data, error } = await db.auth.getSession();
  if (error) console.warn("Não foi possível verificar a sessão:", error);
  if (data?.session?.user) {
    const { data: membro, error: memberError } = await db
      .from("couple_members")
      .select("role")
      .eq("couple_id", COUPLE_ID)
      .eq("user_id", data.session.user.id)
      .maybeSingle();
    sessaoAdmin = !memberError && !!membro;
    if (!sessaoAdmin) await db.auth.signOut();
  }
  atualizarEstadoLogin();
  await carregarDados();
}

document.addEventListener("DOMContentLoaded", inicializar);