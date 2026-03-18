import { storage } from "./firebase.js";
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

let arquivoAtual = null;
let urlImagemAtual = ''; // 
// Configura o upload de imagem
export function configurarUploadSimples() {
  const inputImagem = document.getElementById('upload-imagem');
  const preview = document.getElementById('imagem-preview');
  const semImagem = document.getElementById('sem-imagem');
  const status = document.getElementById('status-upload');
  
  // Evento quando seleciona imagem
  inputImagem.addEventListener('change', async function(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    
    // Validações básicas
    if (!arquivo.type.match('image.*')) {
      mostrarStatus('Apenas imagens são permitidas', 'erro');
      return;
    }
    
    if (arquivo.size > 20 * 1024 * 1024) { 
      mostrarStatus('Imagem muito grande (máx: 20MB)', 'erro');
      return;
    }

    // Agora comprime apenas se for maior que 2MB
    if (arquivo.size > 2 * 1024 * 1024) { // Se maior que 2MB
      mostrarStatus('Otimizando imagem...', 'info');
      arquivoAtual = await comprimirImagem(arquivo);
      mostrarStatus(`Imagem otimizada (${(arquivoAtual.size / 1024).toFixed(0)}KB)`, 'sucesso');
    } else {
      arquivoAtual = arquivo;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.src = e.target.result; // base64 só pro preview
      preview.style.display = 'block';
      semImagem.style.display = 'none';
      
      const btnRemover = document.querySelector('.btn-remover-imagem');
      if (btnRemover) btnRemover.style.display = 'block';
      
      mostrarStatus('Imagem pronta para salvar', 'sucesso');
    };
    reader.readAsDataURL(arquivoAtual);
  });
  
  // Adiciona botão para remover imagem
  adicionarBotaoRemover();
}

async function comprimirImagem(arquivo, maxWidth = 1920, qualidade = 0.85) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Redimensiona proporcionalmente se necessário
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converte para blob com compressão
        canvas.toBlob((blob) => {
          resolve(new File([blob], arquivo.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        }, 'image/jpeg', qualidade);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(arquivo);
  });
}

// Adiciona botão para remover imagem
function adicionarBotaoRemover() {
  const secaoImagem = document.querySelector('.secao-imagem');
  if (!secaoImagem) return;
  
  // Evita adicionar múltiplos botões
  if (document.querySelector('.btn-remover-imagem')) return;
  
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
  const btnRemover = document.querySelector('.btn-remover-imagem');
  
  inputImagem.value = '';
  arquivoAtual = null;
  urlImagemAtual = ''; // Limpa a URL também
  
  preview.style.display = 'none';
  preview.src = ''; // Limpa o src
  semImagem.style.display = 'block';
  if (btnRemover) btnRemover.style.display = 'none';
  
  mostrarStatus('Imagem removida', 'sucesso');
}

// Mostra mensagem de status
function mostrarStatus(mensagem, tipo = 'info') {
  const status = document.getElementById('status-upload');
  if (!status) return;
  
  status.innerHTML = `<span class="status-${tipo}">${mensagem}</span>`;
  status.style.display = 'block';
}

export async function uploadImagemParaFirebase(produtoId) {
  if (!arquivoAtual) {

    return urlImagemAtual || '';
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
    if (btnRemover) btnRemover.style.display = 'none';
    
    // Cria barra de progresso
    if (status) {
      status.innerHTML += `
        <div class="progress-container">
          <div class="progress-bar" id="progress-bar"></div>
        </div>
      `;
    }
    
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
          if (btnRemover) btnRemover.style.display = 'block';
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          urlImagemAtual = downloadURL;
          
          mostrarStatus('Imagem enviada com sucesso!', 'sucesso');
          if (btnRemover) btnRemover.style.display = 'block';
          
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


export function preencherImagemExistente(urlImagem) {
  const preview = document.getElementById('imagem-preview');
  const semImagem = document.getElementById('sem-imagem');
  const btnRemover = document.querySelector('.btn-remover-imagem');
  
  if (urlImagem) {
    preview.src = urlImagem; // URL do Storage
    preview.style.display = 'block';
    semImagem.style.display = 'none';
    if (btnRemover) btnRemover.style.display = 'block';
    
    urlImagemAtual = urlImagem;
  } else {
    preview.style.display = 'none';
    preview.src = '';
    semImagem.style.display = 'block';
    if (btnRemover) btnRemover.style.display = 'none';
    urlImagemAtual = '';
  }
}

export function getUrlImagemAtual() {
  return urlImagemAtual;
}