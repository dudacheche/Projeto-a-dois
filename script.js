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
