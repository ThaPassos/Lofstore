// produtos.js - SISTEMA COMPLETO COM CATEGORIAS DINÂMICAS
import { db } from "./firebase.js";
import { 
  collection, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { configurarAuthDisplay, adicionarModal } from './auth-display.js';
import { 
  configurarUploadSimples, 
  uploadImagemParaFirebase,
  preencherImagemExistente 
} from './upload-simples.js';

// IMPORTA O SISTEMA DE CATEGORIAS DINÂMICAS
import { inicializarCategorias } from './categorias.js';
import { isFavorito } from './favoritos.js';

const listaProdutos = document.getElementById('lista-produtos');
let todosProdutos = [];
let categorias = [];
let categoriaAtual = '';

// =================== AUTENTICAÇÃO ===================
onAuthStateChanged(auth, (user) => {
    const adminButtons = document.getElementById('admin-buttons');
    const editarButtons = document.querySelectorAll('.btn-editar');
    
    if (user) {
        console.log("Usuário logado:", user.email);
        if (adminButtons) adminButtons.style.display = 'block';
        
        editarButtons.forEach(btn => {
            btn.style.display = 'inline-block';
        });
    } else {
        console.log("Visitante não logado");
        if (adminButtons) adminButtons.style.display = 'none';
        
        editarButtons.forEach(btn => {
            btn.style.display = 'none';
        });
    }
});

// =================== FORMATAÇÃO ===================
function formatarPreco(preco) {
  if (!preco && preco !== 0) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(preco);
}

// =================== CRIAR CARD DE PRODUTO ===================
function criarCardProduto(produto) {
  const temImagemBase64 = produto.imagem && produto.imagem.startsWith('data:image');
  const temImagemURL = produto.imagem && produto.imagem.startsWith('http');
  const temImagem = temImagemBase64 || temImagemURL;
  
  const srcImagem = temImagem ? produto.imagem : 'imagens/produto-placeholder.jpg';
  
  // Verifica se é favorito
  const favoritoClass = isFavorito(produto.id) ? 'ativo' : '';
  
  return `
    <div class="card-produto" data-id="${produto.id}">
      <!-- ÍCONES SOBRE A IMAGEM -->
      <div class="card-acoes-overlay">
        <button class="btn-favorito ${favoritoClass}" 
                onclick="event.stopPropagation(); window.toggleFavoritoCard('${produto.id}', this)"
                aria-label="Adicionar aos favoritos">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        
        <button class="btn-carrinho-card" 
                onclick="event.stopPropagation(); window.adicionarAoCarrinhoCard('${produto.id}')"
                aria-label="Adicionar ao carrinho">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>
      
      <img src="${srcImagem}" 
           alt="${produto.nome}" 
           class="imagem-produto"
           onclick="abrirModalDetalhes('${produto.id}')"
           onerror="this.onerror=null; this.src='imagens/produto-placeholder.jpg'">
      
      <div class="conteudo-produto" onclick="abrirModalDetalhes('${produto.id}')">
        <h3 class="nome-produto">${produto.nome || 'Sem nome'}</h3>
        <p class="preco-produto">${formatarPreco(produto.preco)}</p>
        
        ${produto.categoria ? `<p class="categoria-badge">${produto.categoria}</p>` : ''}
        
        <span class="status-produto ${produto.ativo ? 'status-ativo' : 'status-inativo'}">
          ${produto.ativo ? 'Disponível' : 'Indisponível'}
        </span>
      </div>
    </div>
  `;
}

// =================== FILTRAR POR CATEGORIA ===================
window.filtrarPorCategoria = function(categoria) {
  categoriaAtual = categoria;
  
  // Atualiza título da seção
  const titulo = document.querySelector('.titulo-produtos');
  if (titulo) {
    titulo.textContent = categoria ? `PERFUMES - ${categoria.toUpperCase()}` : 'NOSSOS PERFUMES';
  }
  
  // Exibe produtos filtrados
  exibirProdutos(todosProdutos);
  
  // Scroll suave para seção de produtos
  const secaoProdutos = document.querySelector('.produtos-section');
  if (secaoProdutos) {
    secaoProdutos.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  console.log(`Filtrando por categoria: ${categoria || 'Todas'}`);
};

// =================== BUSCAR PRODUTOS ===================
window.buscarProdutos = function() {
  const searchInput = document.querySelector('.search-box input') || document.getElementById('searchInput');
  const termo = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  if (!termo) {
    exibirProdutos(todosProdutos);
    return;
  }
  
  const produtosFiltrados = todosProdutos.filter(produto => {
    return produto.nome.toLowerCase().includes(termo) ||
           (produto.descricao && produto.descricao.toLowerCase().includes(termo)) ||
           (produto.categoria && produto.categoria.toLowerCase().includes(termo));
  });
  
  exibirProdutos(produtosFiltrados);
  
  const titulo = document.querySelector('.titulo-produtos');
  if (titulo) {
    titulo.textContent = `RESULTADOS PARA: "${termo}"`;
  }
  
  console.log(`Busca por: "${termo}" - ${produtosFiltrados.length} resultados`);
};

// Enter para buscar
const searchInput = document.querySelector('.search-box input') || document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      buscarProdutos();
    }
  });
}

// Botão de busca
const searchButton = document.querySelector('.search-box button');
if (searchButton) {
  searchButton.addEventListener('click', buscarProdutos);
}

// =================== EXIBIR PRODUTOS ===================
function exibirProdutos(produtos) {
  if (!listaProdutos) {
    console.error("Elemento #lista-produtos não encontrado!");
    return;
  }
  
  // Aplica filtro de categoria se houver
  let produtosParaExibir = produtos;
  
  if (categoriaAtual) {
    produtosParaExibir = produtos.filter(p => p.categoria === categoriaAtual);
  }
  
  listaProdutos.innerHTML = '';
  
  if (produtosParaExibir.length === 0) {
    listaProdutos.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666;">
        <h3>Nenhum perfume encontrado</h3>
        <p>${categoriaAtual ? `Nenhum produto na categoria "${categoriaAtual}"` : 'Tente outro termo de busca'}</p>
        <button onclick="filtrarPorCategoria('')" 
                style="margin-top: 20px; padding: 10px 20px; background: #b52d1e; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Ver todos os produtos
        </button>
      </div>
    `;
    return;
  }
  
  produtosParaExibir.forEach((produto) => {
    listaProdutos.innerHTML += criarCardProduto(produto);
  });
  
  console.log(`Exibindo ${produtosParaExibir.length} produtos`);
}

// =================== CARREGAR PRODUTOS ===================
async function carregarProdutos() {
  console.log("Iniciando carregamento de produtos...");
  
  if (!listaProdutos) {
    console.error("Elemento #lista-produtos não encontrado!");
    return;
  }
  
  try {
    listaProdutos.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
        <p style="font-size: 18px; color: #666;">Carregando perfumes...</p>
      </div>
    `;
    
    const perfumesRef = collection(db, "perfumes");
    const q = query(perfumesRef, orderBy("criadoEm", "desc"));
    
    console.log("Buscando produtos no Firebase...");
    const querySnapshot = await getDocs(q);
    
    console.log(`Encontrados ${querySnapshot.size} produtos`);
    
    todosProdutos = [];
    querySnapshot.forEach((doc) => {
      todosProdutos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Exibe produtos
    exibirProdutos(todosProdutos);
    
    console.log("Produtos carregados com sucesso!");
    
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    
    listaProdutos.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #f44336;">
        <h3>⚠ Erro ao carregar produtos</h3>
        <p>Tente recarregar a página ou verifique sua conexão.</p>
        <p><small>${error.message}</small></p>
        <button onclick="location.reload()" 
                style="margin-top: 20px; padding: 10px 20px; background: #b52d1e; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Recarregar página
        </button>
      </div>
    `;
  }
}

// =================== REDIRECIONAR PARA PÁGINA DE DETALHES ===================
window.abrirModalDetalhes = function(produtoId) {
  console.log("Clicou no produto ID:", produtoId);
  console.log("Tipo do ID:", typeof produtoId);
  
  // Verifica se o ID é válido
  if (!produtoId || produtoId.trim() === '') {
    console.error("ID do produto inválido ou vazio!");
    alert("Erro: ID do produto inválido");
    return;
  }
  
  // Remove possíveis espaços
  produtoId = produtoId.trim();
  
  console.log("Redirecionando para: produto-detalhes.html?id=" + produtoId);
  
  // Redireciona para a página de detalhes com o ID do produto
  window.location.href = `produto-detalhes.html?id=${produtoId}`;
};

// =================== MODAL DE EDIÇÃO ===================
window.abrirModalEdicao = async function(produtoId, produtoNome) {
  event.stopPropagation();
  
  try {
    const docRef = doc(db, "perfumes", produtoId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const produto = docSnap.data();
      
      document.getElementById('produto-id').value = produtoId;
      document.getElementById('produto-nome').value = produto.nome || '';
      document.getElementById('produto-preco').value = produto.preco || '';
      document.getElementById('produto-descricao').value = produto.descricao || '';
      document.getElementById('produto-categoria').value = produto.categoria || '';
      document.getElementById('produto-imagem').value = produto.imagem || '';
      document.getElementById('produto-ativo').value = produto.ativo ? 'true' : 'false';
      
      preencherImagemExistente(produto.imagem);
      configurarUploadSimples();
      
      const status = document.getElementById('status-upload');
      if (status) status.innerHTML = '';
      
      document.getElementById('modal-overlay').style.display = 'flex';
      document.getElementById('produto-nome').focus();
    }
  } catch (error) {
    console.error("Erro ao carregar produto:", error);
    alert("Erro ao carregar dados do produto.");
  }
};

window.fecharModal = function() {
  document.getElementById('modal-overlay').style.display = 'none';
  const form = document.getElementById('form-editar');
  if (form) form.reset();
  
  const preview = document.getElementById('imagem-preview');
  const semImagem = document.getElementById('sem-imagem');
  const btnRemover = document.querySelector('.btn-remover-imagem');
  
  if (preview) preview.style.display = 'none';
  if (semImagem) semImagem.style.display = 'block';
  if (btnRemover) btnRemover.style.display = 'none';
  
  const inputImagem = document.getElementById('upload-imagem');
  if (inputImagem) inputImagem.value = '';
};

// =================== SALVAR EDIÇÃO ===================
document.getElementById('form-editar')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const produtoId = document.getElementById('produto-id').value;
  const status = document.getElementById('status-upload');
  
  const nome = document.getElementById('produto-nome').value;
  const preco = document.getElementById('produto-preco').value;
  
  if (!nome || !nome.trim()) {
    alert('Por favor, informe o nome do produto.');
    return;
  }
  
  if (!preco || parseFloat(preco) <= 0) {
    alert('Por favor, informe um preço válido.');
    return;
  }
  
  try {
    if (status) {
      status.innerHTML = '<span class="status-carregando">Salvando produto...</span>';
    }
    
    const urlImagem = await uploadImagemParaFirebase(produtoId);
    
    const dadosAtualizados = {
      nome: nome.trim(),
      preco: parseFloat(preco),
      descricao: document.getElementById('produto-descricao').value.trim(),
      categoria: document.getElementById('produto-categoria').value.trim(),
      ativo: document.getElementById('produto-ativo').value === 'true',
      atualizadoEm: new Date()
    };
    
    if (urlImagem) {
      dadosAtualizados.imagem = urlImagem;
    } else {
      const imagemExistente = document.getElementById('produto-imagem').value;
      if (imagemExistente) {
        dadosAtualizados.imagem = imagemExistente;
      }
    }
    
    await updateDoc(doc(db, "perfumes", produtoId), dadosAtualizados);
    
    if (status) {
      status.innerHTML = '<span class="status-sucesso">✓ Produto salvo com sucesso!</span>';
    }
    
    setTimeout(() => {
      fecharModal();
      carregarProdutos();
    }, 1500);
    
  } catch (error) {
    console.error("Erro ao salvar:", error);
    if (status) {
      status.innerHTML = `<span class="status-erro">✗ Erro: ${error.message}</span>`;
    } else {
      alert(`Erro ao salvar: ${error.message}`);
    }
  }
});

// =================== EXCLUIR PRODUTO ===================
window.excluirProduto = function(produtoId) {
  event.stopPropagation();
  
  if (confirm("Tem certeza que deseja excluir este produto?")) {
    deleteDoc(doc(db, "perfumes", produtoId))
      .then(() => {
        alert("Produto excluído com sucesso!");
        carregarProdutos();
      })
      .catch(error => {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir produto: " + error.message);
      });
  }
};

// =================== INICIALIZAÇÃO ===================
async function inicializar() {
  console.log("Inicializando sistema de produtos...");
  
  try {
    // INICIALIZA CATEGORIAS DINÂMICAS
    categorias = await inicializarCategorias();
    
    // Carrega produtos
    await carregarProdutos();
    
    // Configura autenticação (se existir)
    if (typeof configurarAuthDisplay === 'function') {
      configurarAuthDisplay();
    }
    if (typeof adicionarModal === 'function') {
      adicionarModal();
    }
    
    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        fecharModalDetalhes();
        fecharModal();
      }
    });
    
    console.log("Sistema de produtos inicializado!");
  } catch (error) {
    console.error("Erro na inicialização:", error);
    
    if (listaProdutos) {
      listaProdutos.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #f44336;">
          <h3>⚠ Erro ao inicializar</h3>
          <p>${error.message}</p>
          <button onclick="location.reload()" 
                  style="margin-top: 20px; padding: 10px 20px; background: #b52d1e; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Recarregar página
          </button>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}

export { carregarProdutos, formatarPreco };