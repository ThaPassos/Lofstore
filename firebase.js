// firebase.js - VERSÃO FINAL SIMPLIFICADA
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCEN4R_mvvU6wp0R1cRjV4_IWBjdZWveEM",
  authDomain: "lofstore-site.firebaseapp.com",
  projectId: "lofstore-site",
  storageBucket: "lofstore-site.firebasestorage.app",
  messagingSenderId: "632247032272",
  appId: "1:632247032272:web:a820d414b71c4cfcf0c1d5"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Configura persistência do login
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Firebase: Persistência configurada"))
  .catch((error) => console.error("Firebase: Erro persistência:", error));

// Exporta serviços
export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("Firebase inicializado com sucesso!");

// =================== FUNÇÕES PARA CATEGORIAS ===================
export async function carregarCategorias() {
  try {
    console.log("Firebase: Buscando categorias...");
    
    const querySnapshot = await getDocs(collection(db, "categorias"));
    const categorias = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.ativo !== false && data.nome) {
        categorias.push(data.nome);
      }
    });
    
    console.log(`Firebase: ${categorias.length} categorias carregadas`);
    return categorias.sort(); // Retorna ordenado
    
  } catch (error) {
    console.error("Firebase: Erro ao carregar categorias:", error.message);
    return []; // Retorna array vazio em caso de erro
  }
}

export async function adicionarCategoria(nomeCategoria) {
  try {
    console.log(`Firebase: Adicionando categoria: ${nomeCategoria}`);
    
    const categoriaData = {
      nome: nomeCategoria,
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    await addDoc(collection(db, "categorias"), categoriaData);
    
    console.log(`Firebase: Categoria "${nomeCategoria}" adicionada com sucesso`);
    return true;
    
  } catch (error) {
    console.error("Firebase: Erro ao adicionar categoria:", error);
    throw error;
  }
}

export async function removerCategoria(nomeCategoria) {
  try {
    console.log(`Firebase: Buscando categoria para remover: ${nomeCategoria}`);
    
    const querySnapshot = await getDocs(collection(db, "categorias"));
    let categoriaId = null;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.nome === nomeCategoria) {
        categoriaId = doc.id;
      }
    });
    
    if (!categoriaId) {
      throw new Error(`Categoria "${nomeCategoria}" não encontrada`);
    }
    
    await deleteDoc(doc(db, "categorias", categoriaId));
    
    console.log(`Firebase: Categoria "${nomeCategoria}" removida com sucesso`);
    return true;
    
  } catch (error) {
    console.error("Firebase: Erro ao remover categoria:", error);
    throw error;
  }
}