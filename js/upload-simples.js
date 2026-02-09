import { storage } from "./firebase.js";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

let arquivoAtual = null;
let urlImagemAtual = '';

// Configura o upload de imagem
export function configurarUploadSimples() {
  const inputImagem = document.getElementById('upload-imagem');
  const preview = document.getElementById('imagem-preview');
  const semImagem = document.getElementById('sem-imagem');
  const status = document.getElementById('status-upload');
  
  // Evento quando seleciona imagem
  inputImagem.addEventListener('change', function(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    
    // Validações básicas
    if (!arquivo.type.match('image.*')) {
      mostrarStatus('Apenas imagens são permitidas', 'erro');
      return;
    }
    
    if (arquivo.size > 5 * 1024 * 1024) { 
      mostrarStatus('Imagem muito grande (máx: 5MB)', 'erro');
      return;
    }
    
    arquivoAtual = arquivo;
    
    // Mostra preview
    const reader = new FileReader();
    reader.onload = function(e) {
      urlImagemAtual = e.target.result;
      preview.src = urlImagemAtual;
      preview.style.display = 'block';
      semImagem.style.display = 'none';
      mostrarStatus('Imagem pronta para salvar', 'sucesso');
    };
    reader.readAsDataURL(arquivo);
  });
  
  // Adiciona botão para remover imagem
  adicionarBotaoRemover();
}

// Adiciona botão para remover imagem
function adicionarBotaoRemover() {
  const secaoImagem = document.querySelector('.secao-imagem');
  
  const btnRemover = document.createElement('button');
  btnRemover.type = 'button';
  btnRemover.className = 'btn-remover-imagem';
  btnRemover.textContent = 'Remover imagem';
  btnRemover.style.display = 'none';
  
  btnRemover.addEventListener('click', function() {
    removerImagemSelecionada();
  });
  
  secaoImagem.appendChild(btnRemover);
}

// Remove imagem selecionada
function removerImagemSelecionada() {
  const inputImagem = document.getElementById('upload-imagem');
  const preview = document.getElementById('imagem-preview');
  const semImagem = document.getElementById('sem-imagem');
  const status = document.getElementById('status-upload');
  const btnRemover = document.querySelector('.btn-remover-imagem');
  
  inputImagem.value = '';
  arquivoAtual = null;
  urlImagemAtual = '';
  
  preview.style.display = 'none';
  semImagem.style.display = 'block';
  btnRemover.style.display = 'none';
  
  mostrarStatus('Imagem removida', 'sucesso');
}

// Mostra mensagem de status
function mostrarStatus(mensagem, tipo = 'info') {
  const status = document.getElementById('status-upload');
  status.innerHTML = `<span class="status-${tipo}">${mensagem}</span>`;
  status.style.display = 'block';
}

// Faz upload da imagem para Firebase Storage
export async function uploadImagemParaFirebase(produtoId) {
  if (!arquivoAtual) {
    // Se não tem nova imagem, retorna a URL atual (se houver)
    return document.getElementById('produto-imagem').value || '';
  }
  
  const status = document.getElementById('status-upload');
  const btnRemover = document.querySelector('.btn-remover-imagem');
  
  try {
    // Gera nome único para o arquivo
    const timestamp = Date.now();
    const nomeOriginal = arquivoAtual.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const nomeArquivo = `${produtoId || 'novo'}_${timestamp}_${nomeOriginal}`;
    
    const storageRef = ref(storage, `produtos/${nomeArquivo}`);
    
    // Mostra status de carregamento
    mostrarStatus('Enviando imagem...', 'carregando');
    btnRemover.style.display = 'none';
    
    // Cria barra de progresso
    status.innerHTML += `
      <div class="progress-container">
        <div class="progress-bar" id="progress-bar"></div>
      </div>
    `;
    
    // Faz upload
    const uploadTask = uploadBytesResumable(storageRef, arquivoAtual);
    
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // Atualiza progresso
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const progressBar = document.getElementById('progress-bar');
          if (progressBar) {
            progressBar.style.width = progress + '%';
          }
        },
        (error) => {
          mostrarStatus(`Erro: ${error.message}`, 'erro');
          btnRemover.style.display = 'block';
          reject(error);
        },
        async () => {
          // Upload completo - pega URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          mostrarStatus('Imagem enviada com sucesso!', 'sucesso');
          btnRemover.style.display = 'block';
          
          // Limpa o arquivo atual após upload bem-sucedido
          arquivoAtual = null;
          document.getElementById('upload-imagem').value = '';
          
          resolve(downloadURL);
        }
      );
    });
    
  } catch (error) {
    console.error("Erro no upload:", error);
    mostrarStatus(`Erro no upload: ${error.message}`, 'erro');
    return '';
  }
}

// Preenche imagem existente no modal
export function preencherImagemExistente(urlImagem) {
  const preview = document.getElementById('imagem-preview');
  const semImagem = document.getElementById('sem-imagem');
  const btnRemover = document.querySelector('.btn-remover-imagem');
  
  if (urlImagem) {
    preview.src = urlImagem;
    preview.style.display = 'block';
    semImagem.style.display = 'none';
    btnRemover.style.display = 'block';
    urlImagemAtual = urlImagem;
  } else {
    preview.style.display = 'none';
    semImagem.style.display = 'block';
    btnRemover.style.display = 'none';
  }
}