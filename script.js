// DATA DE INÍCIO DO NAMORO
      const DATA_INICIO_NAMORO = new Date(2026, 2, 21);
      const META_PADRAO_KM = 2000;
      const SENHA_PADRAO = "1234";

      // Dados Exemplo Iniciais
      const VIAGENS_INICIAIS = [
        {
          id: "1",
              destino: "Caraguatatuba - SP",
              data: "2026-03-13",
              km: 180,
              moto: "Ambas",
              relato: "Passeio pelas montanhas com vista incrível e parada obrigatória para chocolate quente!",
              capa: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
              album: [
                  "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
                  "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80"
              ]
          }
      ];
// Estado Global
      let viagens = JSON.parse(localStorage.getItem("asfalto_viagens")) || VIAGENS_INICIAIS;
      let senhaAdmin = localStorage.getItem("asfalto_senha") || SENHA_PADRAO;

      // Variáveis Temporárias para Imagens Base64
      let tempCapaBase64 = "";
      let tempAlbumBase64 = [];

      // Estado do Modal Álbum
      let viagemAtivaModal = null;
      let fotoIndexAtiva = 0;

      window.onload = function() {
          calcularDiasJuntos();
          atualizarEstatisticas();
          renderizarViagens();
      };

      function salvarDados() {
          try {
              localStorage.setItem("asfalto_viagens", JSON.stringify(viagens));
              localStorage.setItem("asfalto_senha", senhaAdmin);
          } catch (e) {
              if (e.name === 'QuotaExceededError' || e.code === 22) {
                  mostrarToast("⚠️ Limite de memória do navegador atingido! Tente enviar fotos menores.");
              } else {
                  mostrarToast("Erro ao salvar dados.");
              }
          }
      }

      // Função para otimizar e comprimir imagens da galeria via Canvas
      function comprimirImagem(file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) {
          return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = function(e) {
                  const img = new Image();
                  img.onload = function() {
                      let width = img.width;
                      let height = img.height;

                    if (width > height) {
                          if (width > maxWidth) {
                              height = Math.round((height * maxWidth) / width);
                              width = maxWidth;
                          }
                      } else {
                          if (height > maxHeight) {
                              width = Math.round((width * maxHeight) / height);
                              height = maxHeight;
                          }
                      }
                  const canvas = document.createElement("canvas");
                      canvas.width = width;
                      canvas.height = height;

                      const ctx = canvas.getContext("2d");
                      ctx.drawImage(img, 0, 0, width, height);

                      const dataUrl = canvas.toDataURL("image/jpeg", quality);
                      resolve(dataUrl);
                  };
                  img.onerror = reject;
                  img.src = e.target.result;
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
          });
      }
function toggleMenu() {
          const links = document.getElementById("menuLinks");
          links.classList.toggle("ativo");
      }

      // MODAL ADMIN
      function abrirModalAdmin() {
          const links = document.getElementById("menuLinks");
          if (links.classList.contains("ativo")) toggleMenu();
          document.getElementById("modalAdmin").classList.remove("escondido");
      }

      function fecharModalAdmin() {
          document.getElementById("modalAdmin").classList.add("escondido");
      }

      function autenticarAdmin() {
          const senhaDig = document.getElementById("senhaInput").value;
          if (senhaDig === senhaAdmin) {
              document.getElementById("admin-login").style.display = "none";
              document.getElementById("admin-conteudo").style.display = "block";
              mostrarToast("Acesso autorizado!");
              renderizarAdminLista();
          } else {
              mostrarToast("Senha incorreta!");
          }
      }

function sairAdmin() {
          document.getElementById("admin-login").style.display = "block";
          document.getElementById("admin-conteudo").style.display = "none";
          document.getElementById("senhaInput").value = "";
      }

      function alterarSenhaAdmin() {
          const nova = prompt("Digite a nova senha para o Painel:");
          if (nova && nova.trim() !== "") {
              senhaAdmin = nova.trim();
              salvarDados();
              mostrarToast("Senha alterada!");
          }
      }

// CÁLCULO DE DIAS JUNTOS
      function calcularDiasJuntos() {
    const inicioRelacionamento = new Date("2026-02-22T00:00:00");
    const hoje = new Date();

    inicioRelacionamento.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);

    const diferenca = hoje.getTime() - inicioRelacionamento.getTime();

    return Math.floor(diferenca / 86400000);
}

document.getElementById("diasJuntos").textContent =
    calcularDiasJuntos();

// ESTATÍSTICAS E BARRA DE META
      function atualizarEstatisticas() {
          let totalKm = 0;
          let kmTitan = 0;
          let kmFan = 0;

          viagens.forEach(v => {
              const km = Number(v.km) || 0;
              totalKm += km;
              if (v.moto === "Titan 150") kmTitan += km;
              else if (v.moto === "Fan 150") kmFan += km;
              else if (v.moto === "Ambas") {
                  kmTitan += km;
                  kmFan += km;
              }
          });

          // Atualizar os elementos no dashboard conforme a ordem das 3 linhas x 2 colunas
          document.getElementById("totalViagens").innerText = viagens.length;
          document.getElementById("kmTitan").innerText = `${kmTitan.toLocaleString()} km`;
          document.getElementById("kmFan").innerText = `${kmFan.toLocaleString()} km`;
          document.getElementById("kmTotal").innerText = `${totalKm.toLocaleString()} km`;

          document.getElementById("kmTitanGaragem").innerText = `${kmTitan.toLocaleString()} km`;
          document.getElementById("kmFanGaragem").innerText = `${kmFan.toLocaleString()} km`;

          const pct = Math.min(Math.round((totalKm / META_PADRAO_KM) * 100), 100);
          document.getElementById("metaAtual").innerText = `${pct}%`;
          document.getElementById("progresso").style.width = `${pct}%`;
          document.getElementById("textoMeta").innerText = `${totalKm.toLocaleString()} / ${META_PADRAO_KM} km`;
      }

// CARDS DE VIAGENS
      function renderizarViagens() {
          const lista = document.getElementById("listaViagens");
          if (viagens.length === 0) {
              lista.innerHTML = `<p style="text-align:center; color:#888; grid-column: 1/-1;">Nenhuma viagem cadastrada ainda.</p>`;
              return;
          }

          lista.innerHTML = viagens.map(v => {
              const numFotos = v.album ? v.album.length : (v.capa ? 1 : 0);
              const dataFormatada = new Date(v.data + "T00:00:00").toLocaleDateString('pt-BR');
              const capaImg = v.capa || (v.album && v.album[0]) || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80';

              return `
                  <div class="viagem-card" onclick="abrirAlbumModal('${v.id}')">
                      <img class="viagem-capa" src="${capaImg}" alt="${v.destino}" onerror="this.src='https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'">
                      
                      <div class="viagem-topo">
                          <span class="viagem-etiqueta">🏍️ ${v.moto}</span>
                          <span class="viagem-data">${dataFormatada}</span>
                      </div>

                      <h3 class="viagem-cidade">${v.destino}</h3>
                      <p class="viagem-descricao">${v.relato || 'Clique para ver as fotos e relato.'}</p>

                      <div class="viagem-distancia">
                          <span class="viagem-icone">🛣️</span>
                          <div class="viagem-texto-distancia">
                              <span class="viagem-km">${v.km} KM</span>
                              <span class="viagem-legenda">Distância Rodada</span>
                          </div>
                      </div>

                      <button class="btn-abrir-album">🖼️ Ver Álbum (${numFotos} fotos)</button>
                  </div>
              `;
          }).join('');
      }

// PREVIEW DE FOTOS CARREGADAS DA GALERIA (COM COMPRESSÃO AUTOMÁTICA)
      async function previewCapa(event) {
          const file = event.target.files[0];
          if (file) {
              try {
                  tempCapaBase64 = await comprimirImagem(file);
                  document.getElementById("capaPreviewImg").src = tempCapaBase64;
                  document.getElementById("previewCapaContainer").style.display = "block";
              } catch (err) {
                  mostrarToast("Erro ao processar imagem da capa.");
              }
          }
      }

      async function previewAlbum(event) {
          const files = Array.from(event.target.files);
          tempAlbumBase64 = [];
          const container = document.getElementById("previewAlbumContainer");
          container.innerHTML = "";

          for (const file of files) {
              try {
                  const base64 = await comprimirImagem(file);
                  tempAlbumBase64.push(base64);

                  const img = document.createElement("img");
                  img.src = base64;
                  img.className = "mini-preview";
                  container.appendChild(img);
              } catch (err) {
                  console.error("Erro ao comprimir foto do álbum:", err);
              }
          }
      }
// MANIPULAÇÃO DE VIAGENS
      function salvarViagem(e) {
          e.preventDefault();
          const editId = document.getElementById("editId").value;
          const destino = document.getElementById("destinoInput").value;
          const data = document.getElementById("dataInput").value;
          const km = Number(document.getElementById("kmInput").value);
          const moto = document.getElementById("motoInput").value;
          const relato = document.getElementById("relatoInput").value;

          if (editId) {
              const index = viagens.findIndex(v => v.id === editId);
              if (index !== -1) {
                  viagens[index].destino = destino;
                  viagens[index].data = data;
                  viagens[index].km = km;
                  viagens[index].moto = moto;
                  viagens[index].relato = relato;
                  if (tempCapaBase64) viagens[index].capa = tempCapaBase64;
                  if (tempAlbumBase64.length > 0) viagens[index].album = tempAlbumBase64;
                  mostrarToast("Viagem atualizada!");
              }
          } else {
              const novaViagem = {
                  id: Date.now().toString(),
                  destino,
                  data,
                  km,
                  moto,
                  relato,
                  capa: tempCapaBase64 || (tempAlbumBase64[0] || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'),
                  album: tempAlbumBase64.length > 0 ? tempAlbumBase64 : (tempCapaBase64 ? [tempCapaBase64] : [])
              };
              viagens.unshift(novaViagem);
              mostrarToast("Viagem cadastrada!");
          }

          salvarDados();
          resetForm();
          atualizarEstatisticas();
          renderizarViagens();
          renderizarAdminLista();
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
          const v = viagens.find(item => item.id === id);
          if (!v) return;

          document.getElementById("editId").value = v.id;
          document.getElementById("destinoInput").value = v.destino;
          document.getElementById("dataInput").value = v.data;
          document.getElementById("kmInput").value = v.km;
          document.getElementById("motoInput").value = v.moto;
          document.getElementById("relatoInput").value = v.relato || "";

          if (v.capa) {
              document.getElementById("capaPreviewImg").src = v.capa;
              document.getElementById("previewCapaContainer").style.display = "block";
          }

          document.getElementById("formTitulo").innerText = "Editar Viagem";
          document.getElementById("btnCancelarEdit").style.display = "block";
      }

      function excluirViagemAdmin(id) {
          if (confirm("Excluir esta viagem permanentemente?")) {
              viagens = viagens.filter(v => v.id !== id);
              salvarDados();
              atualizarEstatisticas();
              renderizarViagens();
              renderizarAdminLista();
              mostrarToast("Viagem removida.");
          }
      }
function renderizarAdminLista() {
          const cont = document.getElementById("adminListaViagens");
          if (viagens.length === 0) {
              cont.innerHTML = "<p style='color:#777; font-size:0.85rem;'>Nenhuma viagem salva.</p>";
              return;
          }

          cont.innerHTML = viagens.map(v => `
              <div style="background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                      <strong style="color:#f4ad4e; font-size:0.85rem;">${v.destino}</strong>
                      <span style="font-size:0.75rem; color:#aaa; margin-left: 6px;">${v.km} KM</span>
                  </div>
                  <div>
                      <button class="btn-secundario" onclick="editarViagemAdmin('${v.id}')">✏️ Edit</button>
                      <button class="btn-secundario" onclick="excluirViagemAdmin('${v.id}')" style="color:#ff5555; border-color:#ff5555;">🗑️</button>
                  </div>
              </div>
          `).join('');
}

// MODAL ÁLBUM LIGHTBOX
      function abrirAlbumModal(id) {
          viagemAtivaModal = viagens.find(v => v.id === id);
          if (!viagemAtivaModal) return;

          fotoIndexAtiva = 0;
          document.getElementById("modalTitulo").innerText = viagemAtivaModal.destino;
          const dataFmt = new Date(viagemAtivaModal.data + "T00:00:00").toLocaleDateString('pt-BR');
          document.getElementById("modalSubtitulo").innerText = `${dataFmt} • ${viagemAtivaModal.km} KM • Moto: ${viagemAtivaModal.moto}`;
          document.getElementById("modalRelato").innerText = viagemAtivaModal.relato || "Sem história/relato cadastrado.";

          renderizarCarrossel();
          document.getElementById("modalAlbum").classList.remove("escondido");
      }

      function fecharModalAlbum() {
          document.getElementById("modalAlbum").classList.add("escondido");
          viagemAtivaModal = null;
      }

      function renderizarCarrossel() {
          if (!viagemAtivaModal) return;
          const fotos = (viagemAtivaModal.album && viagemAtivaModal.album.length > 0)
              ? viagemAtivaModal.album
              : [viagemAtivaModal.capa || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'];

          document.getElementById("carrosselImg").src = fotos[fotoIndexAtiva];
          document.getElementById("carrosselAtual").innerText = fotoIndexAtiva + 1;
          document.getElementById("carrosselTotal").innerText = fotos.length;

          const thumbsCont = document.getElementById("modalThumbs");
          thumbsCont.innerHTML = fotos.map((f, idx) => `
              <img src="${f}" class="thumb ${idx === fotoIndexAtiva ? 'ativa' : ''}" onclick="selecionarFoto(${idx})">
          `).join('');
      }

      function mudarFoto(dir) {
          if (!viagemAtivaModal) return;
          const fotos = viagemAtivaModal.album || [viagemAtivaModal.capa];
          fotoIndexAtiva = (fotoIndexAtiva + dir + fotos.length) % fotos.length;
          renderizarCarrossel();
      }

      function selecionarFoto(idx) {
          fotoIndexAtiva = idx;
          renderizarCarrossel();
}

      function mostrarToast(msg) {
          const t = document.getElementById("toast");
          t.innerText = msg;
          t.classList.add("visivel");
          setTimeout(() => t.classList.remove("visivel"), 3000);
      }