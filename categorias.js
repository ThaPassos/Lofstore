// categorias.js - Gerenciamento de Categorias Dinâmicas (VERSÃO UNIFICADA)
import { db } from "./firebase.js";
import { 
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// =================== CARREGAR CATEGORIAS (COMPATIBILIDADE COM AMBAS ESTRUTURAS) ===================
export async function carregarCategorias() {
  try {
    console.log("Carregando categorias...");
    
    // TENTA PRIMEIRO: estrutura antiga (coleção "categorias" com documentos individuais)
    try {
      const categoriasCollection = await getDocs(collection(db, "categorias"));
      
      if (!categoriasCollection.empty) {
        const categorias = [];
        categoriasCollection.forEach((doc) => {
          categorias.push(doc.data().nome);
        });
        
        console.log("Categorias carregadas da coleção 'categorias':", categorias);
        return categorias;
      }
    } catch (error) {
      console.log("Estrutura antiga não encontrada, tentando nova...");
    }
    
    // TENTA SEGUNDO: estrutura nova (configuracoes/categorias)
    const configRef = doc(db, "configuracoes", "categorias");
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      const categorias = configSnap.data().lista || [];
      console.log("Categorias carregadas de configuracoes/categorias:", categorias);
      return categorias;
    } else {
      // Se não existe nenhuma, cria com categorias padrão
      const categoriasPadrao = ["Masculino", "Feminino", "Premium", "Miniaturas"];
      await setDoc(configRef, { lista: categoriasPadrao });
      console.log("Categorias padrão criadas");
      return categoriasPadrao;
    }
    
  } catch (error) {
    console.error("Erro ao carregar categorias:", error);
    return ["Masculino", "Feminino", "Unissex", "Premium"];
  }
}

// =================== ATUALIZAR TODOS OS MENUS ===================
export function atualizarMenuCategorias(categorias) {
  // 1. Menu dropdown desktop e mobile (via função global)
  if (typeof window.atualizarMenusCategorias === 'function') {
    window.atualizarMenusCategorias(categorias);
  }
  
  // 2. Bolinhas circulares
  atualizarCategoriasCirculares(categorias);
  
  console.log(`Todos os menus atualizados com ${categorias.length} categorias`);
}

// =================== ATUALIZAR BOLINHAS CIRCULARES ===================
function atualizarCategoriasCirculares(categorias) {
  const container = document.querySelector('.categorias');
  
  if (!container) {
    console.error("Container de categorias circulares não encontrado!");
    return;
  }
  
  container.innerHTML = '';
  
  const categoriasLimitadas = categorias.slice(0, 8);
  
  categoriasLimitadas.forEach(categoria => {
    const bolinha = criarBolinhaCategoria(categoria);
    container.appendChild(bolinha);
  });
  
  console.log(`Bolinhas atualizadas com ${categoriasLimitadas.length} categorias`);
}

// =================== CRIAR BOLINHA DE CATEGORIA ===================
function criarBolinhaCategoria(categoria) {
  const div = document.createElement('div');
  div.className = 'bolasCategoria';
  div.onclick = () => {
    if (typeof window.filtrarPorCategoria === 'function') {
      window.filtrarPorCategoria(categoria);
    }
  };
  
  const id = `circlePath-${categoria.replace(/\s+/g, '')}`;
  
  div.innerHTML = `
    <svg viewBox="0 0 100 100">
      <defs>
        <path id="${id}" d="M 15,50 a 35,35 0 0,1 70,0" />
      </defs>
      <text>
        <textPath href="#${id}" startOffset="50%" text-anchor="middle">
          ${categoria.toUpperCase()}
        </textPath>
      </text>
    </svg>
  `;
  
  return div;
}

// =================== ADICIONAR NOVA CATEGORIA ===================
export async function adicionarCategoria(novaCategoria) {
  try {
    novaCategoria = novaCategoria.trim();
    
    if (!novaCategoria) {
      throw new Error("Categoria não pode estar vazia");
    }
    
    const categorias = await carregarCategorias();
    
    if (categorias.includes(novaCategoria)) {
      throw new Error("Esta categoria já existe");
    }
    
    categorias.push(novaCategoria);
    
    // Salva na estrutura nova (configuracoes/categorias)
    const configRef = doc(db, "configuracoes", "categorias");
    await setDoc(configRef, { lista: categorias });
    
    console.log(`Categoria "${novaCategoria}" adicionada com sucesso`);
    
    // Atualiza visualmente
    atualizarMenuCategorias(categorias);
    
    return categorias;
    
  } catch (error) {
    console.error("Erro ao adicionar categoria:", error);
    throw error;
  }
}

// =================== REMOVER CATEGORIA ===================
export async function removerCategoria(categoriaRemover) {
  try {
    const categorias = await carregarCategorias();
    
    const novasCategorias = categorias.filter(cat => cat !== categoriaRemover);
    
    if (novasCategorias.length === categorias.length) {
      throw new Error("Categoria não encontrada");
    }
    
    const configRef = doc(db, "configuracoes", "categorias");
    await setDoc(configRef, { lista: novasCategorias });
    
    console.log(`Categoria "${categoriaRemover}" removida com sucesso`);
    
    atualizarMenuCategorias(novasCategorias);
    
    return novasCategorias;
    
  } catch (error) {
    console.error("Erro ao remover categoria:", error);
    throw error;
  }
}

// =================== INICIALIZAR CATEGORIAS ===================
export async function inicializarCategorias() {
  try {
    console.log("Inicializando sistema de categorias...");
    
    const categorias = await carregarCategorias();
    
    atualizarMenuCategorias(categorias);
    
    console.log("Sistema de categorias inicializado com sucesso!");
    
    return categorias;
    
  } catch (error) {
    console.error("Erro ao inicializar categorias:", error);
    return [];
  }
}