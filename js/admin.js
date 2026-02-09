import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let arquivoImagem = null;
let imagemBase64 = null;
let produtosCarregados = [];
let categoriasDisponiveis = [];

function configurarLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('adminLogado');
            localStorage.removeItem('adminEmail');
            window.location.href = 'login.html';
        });
    }
}

function configurarUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');
    
    if (!uploadArea || !imageInput) return;
    
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.background = 'rgba(181, 45, 30, 0.15)';
        uploadArea.style.borderStyle = 'solid';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.background = 'rgba(181, 45, 30, 0.05)';
        uploadArea.style.borderStyle = 'dashed';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.background = 'rgba(181, 45, 30, 0.05)';
        uploadArea.style.borderStyle = 'dashed';
        
        if (e.dataTransfer.files.length) {
            const file = e.dataTransfer.files[0];
            processarImagem(file);
        }
    });
    
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) processarImagem(file);
    });
    
    function processarImagem(file) {
        if (!file.type.startsWith('image/')) {
            mostrarMensagem('Selecione apenas imagens!', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            mostrarMensagem('Imagem muito grande! Máximo: 5MB', 'error');
            return;
        }
        
        arquivoImagem = file;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            imagemBase64 = event.target.result;
            
            if (imagePreview) {
                imagePreview.src = imagemBase64;
                imagePreview.style.display = 'block';
            }
            
            if (removeImageBtn) {
                removeImageBtn.style.display = 'block';
            }
            
            mostrarMensagem('Imagem pronta!', 'success');
        };
        
        reader.onerror = function(error) {
            console.error("Erro ao ler imagem:", error);
            mostrarMensagem('Erro ao processar imagem', 'error');
        };
        
        reader.readAsDataURL(file);
    }
    
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            imageInput.value = '';
            arquivoImagem = null;
            imagemBase64 = null;
            
            if (imagePreview) {
                imagePreview.style.display = 'none';
                imagePreview.src = '';
            }
            
            removeImageBtn.style.display = 'none';
            mostrarMensagem('Imagem removida', 'info');
        });
    }
}

async function carregarCategoriasCheckboxes() {
    const container = document.getElementById('categoriasCheckboxes');
    const infoEl = document.getElementById('categoriasInfo');
    
    if (!container) {
        console.error("Elemento #categoriasCheckboxes não encontrado!");
        return;
    }
    
    try {
        console.log("Carregando categorias do Firestore...");
        
        // Limpa container
        container.innerHTML = '<p style="color: #999; grid-column: 1/-1; text-align: center;">Carregando categorias...</p>';
        
        const configRef = doc(db, "configuracoes", "categorias");
        const configSnap = await getDoc(configRef);
        
        let categorias = [];
        
        if (configSnap.exists()) {
            categorias = configSnap.data().lista || [];
            console.log(`${categorias.length} categorias carregadas:`, categorias);
        } else {
            // Cria categorias padrão
            categorias = ['Masculino', 'Feminino', 'Unissex', 'Premium'];
            await setDoc(configRef, { lista: categorias });
            console.log("Categorias padrão criadas");
        }
        
        categoriasDisponiveis = categorias.sort();
        
        // Limpa e preenche container
        container.innerHTML = '';
        
        if (categoriasDisponiveis.length === 0) {
            container.innerHTML = '<p style="color: #999; grid-column: 1/-1; text-align: center;">Nenhuma categoria cadastrada. Vá em "Gerenciar Categorias" para adicionar.</p>';
            return;
        }
        
        // Cria checkbox para cada categoria
        categoriasDisponiveis.forEach(categoria => {
            const divCheckbox = document.createElement('div');
            divCheckbox.className = 'categoria-checkbox';
            
            const checkboxId = `cat-${categoria.replace(/\s+/g, '-')}`;
            
            divCheckbox.innerHTML = `
                <input type="checkbox" id="${checkboxId}" value="${categoria}">
                <label for="${checkboxId}">${categoria}</label>
            `;
            
            container.appendChild(divCheckbox);
        });
        
        // Adiciona listeners para atualizar contador
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', atualizarContadorCategorias);
        });
        
        console.log(`${categoriasDisponiveis.length} checkboxes criados`);
        
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        container.innerHTML = `
            <p style="color: #f44336; grid-column: 1/-1; text-align: center;">
                Erro ao carregar categorias: ${error.message}
            </p>
        `;
    }
}

// =================== ATUALIZAR CONTADOR DE CATEGORIAS SELECIONADAS ===================
function atualizarContadorCategorias() {
    const selecionadas = obterCategoriasSelecionadas();
    const infoEl = document.getElementById('categoriasInfo');
    const countEl = document.getElementById('categoriasCount');
    
    if (countEl) {
        countEl.textContent = selecionadas.length;
    }
    
    if (infoEl) {
        if (selecionadas.length > 0) {
            infoEl.classList.add('mostrar');
        } else {
            infoEl.classList.remove('mostrar');
        }
    }
}

// =================== OBTER CATEGORIAS SELECIONADAS ===================
function obterCategoriasSelecionadas() {
    const container = document.getElementById('categoriasCheckboxes');
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    const selecionadas = Array.from(checkboxes).map(cb => cb.value);
    
    console.log("Categorias selecionadas:", selecionadas);
    return selecionadas;
}

// =================== DEFINIR CATEGORIAS SELECIONADAS (PARA EDIÇÃO) ===================
function definirCategoriasSelecionadas(categorias) {
    const container = document.getElementById('categoriasCheckboxes');
    if (!container || !categorias) return;
    
    // Converte para array se for string única
    const categoriasArray = Array.isArray(categorias) ? categorias : [categorias];
    
    // Desmarca todos
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    // Marca apenas os selecionados
    categoriasArray.forEach(categoria => {
        const checkboxId = `cat-${categoria.replace(/\s+/g, '-')}`;
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    atualizarContadorCategorias();
    console.log("Categorias definidas:", categoriasArray);
}

// =================== SALVAR PRODUTO (COM MÚLTIPLAS CATEGORIAS) ===================
async function salvarProduto() {
    const nome = document.getElementById('productName')?.value.trim();
    const preco = parseFloat(document.getElementById('productPrice')?.value);
    const categoriasSelecionadas = obterCategoriasSelecionadas();
    const status = document.getElementById('productStatus')?.value;
    const descricao = document.getElementById('productDescription')?.value.trim();
    
    if (!nome) {
        mostrarMensagem('Informe o nome do perfume', 'error');
        document.getElementById('productName').focus();
        return;
    }
    
    if (!preco || preco <= 0 || isNaN(preco)) {
        mostrarMensagem('Informe um preço válido', 'error');
        document.getElementById('productPrice').focus();
        return;
    }
    
    if (categoriasSelecionadas.length === 0) {
        mostrarMensagem('Selecione pelo menos uma categoria', 'error');
        return;
    }
    
    const saveBtn = document.getElementById('saveProductBtn');
    const textoOriginal = saveBtn.innerHTML;
    saveBtn.innerHTML = 'Salvando...';
    saveBtn.disabled = true;
    
    try {
        const produtoData = {
            nome: nome,
            preco: preco,
            categorias: categoriasSelecionadas, // ARRAY de categorias
            categoria: categoriasSelecionadas[0], // Mantém compatibilidade (primeira categoria)
            ativo: status === 'true',
            descricao: descricao || '',
            imagem: imagemBase64 || '',
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };
        
        console.log("💾 Salvando produto:", produtoData);
        
        const docRef = await addDoc(collection(db, "perfumes"), produtoData);
        console.log("✅ Produto salvo com ID:", docRef.id);
        
        mostrarMensagem('Produto salvo com sucesso!', 'success');
        
        limparFormulario();
        
        setTimeout(() => {
            carregarProdutos();
        }, 1000);
        
    } catch (error) {
        console.error("❌ Erro ao salvar:", error);
        mostrarMensagem(`Erro: ${error.message}`, 'error');
    } finally {
        saveBtn.innerHTML = textoOriginal;
        saveBtn.disabled = false;
    }
}

// =================== CARREGAR PRODUTOS ===================
async function carregarProdutos() {
    const container = document.getElementById('productsContainer');
    const loadingMsg = document.getElementById('loadingMessage');
    
    if (!container) return;
    
    try {
        if (loadingMsg) loadingMsg.style.display = 'block';
        container.innerHTML = '';
        
        const perfumesRef = collection(db, "perfumes");
        const q = query(perfumesRef, orderBy("criadoEm", "desc"));
        const querySnapshot = await getDocs(q);
        
        produtosCarregados = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            produtosCarregados.push({
                id: doc.id,
                nome: data.nome || 'Sem nome',
                preco: data.preco || 0,
                categorias: data.categorias || [data.categoria] || [],
                categoria: data.categoria || (data.categorias && data.categorias[0]) || 'Não categorizado',
                ativo: data.ativo !== undefined ? data.ativo : true,
                descricao: data.descricao || '',
                imagem: data.imagem || '',
                criadoEm: data.criadoEm || new Date().toISOString()
            });
        });
        
        if (loadingMsg) loadingMsg.style.display = 'none';
        
        if (produtosCarregados.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <p style="font-size: 18px; color: #666;">Nenhum produto cadastrado</p>
                    <p style="color: #999;">Adicione seu primeiro produto acima!</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        produtosCarregados.forEach(produto => {
            let imagemUrl = produto.imagem || '';
            const placeholder = 'https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
            
            if (!imagemUrl || imagemUrl.trim() === '') {
                imagemUrl = placeholder;
            }
            
            const precoFormatado = produto.preco ? 
                `R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}` : 
                'R$ 0,00';
            
            // Mostra todas as categorias
            const categoriasHTML = produto.categorias.length > 0 
                ? produto.categorias.map(cat => `<span class="categoria-badge">${cat}</span>`).join(' ')
                : '<span class="categoria-badge">Sem categoria</span>';
            
            html += `
                <div class="product-card" data-id="${produto.id}">
                    <img src="${imagemUrl}" 
                         class="product-image" 
                         alt="${produto.nome}"
                         onerror="this.src='${placeholder}'">
                    
                    <div class="product-content">
                        <h3 class="product-title">${produto.nome}</h3>
                        <div class="product-price">${precoFormatado}</div>
                        <div class="product-categories">${categoriasHTML}</div>
                        <div class="product-status ${produto.ativo ? 'status-active' : 'status-inactive'}">
                            ${produto.ativo ? 'Ativo' : 'Inativo'}
                        </div>
                        <p style="font-size: 14px; color: #666; margin: 10px 0; height: 60px; overflow: hidden;">
                            ${produto.descricao || 'Sem descrição'}
                        </p>
                        <div class="product-actions">
                            <button class="btn-edit" onclick="editarProduto('${produto.id}')">
                                Editar
                            </button>
                            <button class="btn-delete" onclick="excluirProduto('${produto.id}')">
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        
        if (loadingMsg) {
            loadingMsg.style.display = 'none';
        }
        
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="font-size: 18px; color: #f44336;">Erro ao carregar produtos</p>
                <p style="color: #666;">${error.message}</p>
                <button onclick="carregarProdutos()" 
                        style="margin-top: 20px; padding: 10px 20px; background: #b52d1e; color: white; border: none; border-radius: 5px;">
                    Tentar novamente
                </button>
            </div>
        `;
    }
}

// =================== FUNÇÕES AUXILIARES ===================
function limparFormulario() {
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStatus').value = 'true';
    document.getElementById('productDescription').value = '';
    
    // Desmarca todos os checkboxes
    const checkboxes = document.querySelectorAll('#categoriasCheckboxes input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    atualizarContadorCategorias();
    
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageBtn = document.getElementById('removeImageBtn');
    
    if (imageInput) imageInput.value = '';
    if (imagePreview) {
        imagePreview.style.display = 'none';
        imagePreview.src = '';
    }
    if (removeImageBtn) removeImageBtn.style.display = 'none';
    
    arquivoImagem = null;
    imagemBase64 = null;
}

function mostrarMensagem(texto, tipo = 'info') {
    const msgEl = document.getElementById('saveMessage');
    if (!msgEl) return;
    
    msgEl.textContent = texto;
    msgEl.className = `message ${tipo}`;
    msgEl.style.display = 'block';
    
    setTimeout(() => {
        msgEl.textContent = '';
        msgEl.style.display = 'none';
    }, 5000);
}

// =================== FUNÇÕES GLOBAIS ===================
window.editarProduto = async function(id) {
    const produto = produtosCarregados.find(p => p.id === id);
    if (!produto) return;
    
    if (confirm(`Editar "${produto.nome}"?`)) {
        document.getElementById('productName').value = produto.nome || '';
        document.getElementById('productPrice').value = produto.preco || '';
        definirCategoriasSelecionadas(produto.categorias || [produto.categoria]);
        document.getElementById('productStatus').value = produto.ativo ? 'true' : 'false';
        document.getElementById('productDescription').value = produto.descricao || '';
        
        if (produto.imagem && produto.imagem.startsWith('data:image')) {
            imagemBase64 = produto.imagem;
            const imagePreview = document.getElementById('imagePreview');
            const removeImageBtn = document.getElementById('removeImageBtn');
            
            if (imagePreview) {
                imagePreview.src = produto.imagem;
                imagePreview.style.display = 'block';
            }
            
            if (removeImageBtn) {
                removeImageBtn.style.display = 'block';
            }
        }
        
        const saveBtn = document.getElementById('saveProductBtn');
        saveBtn.innerHTML = 'Atualizar Produto';
        saveBtn.onclick = async () => {
            await window.atualizarProduto(id);
        };
        
        mostrarMensagem(`Editando "${produto.nome}"...`, 'info');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.atualizarProduto = async function(id) {
    const nome = document.getElementById('productName').value.trim();
    const preco = parseFloat(document.getElementById('productPrice').value);
    const categoriasSelecionadas = obterCategoriasSelecionadas();
    const status = document.getElementById('productStatus').value === 'true';
    const descricao = document.getElementById('productDescription').value.trim();
    
    if (!nome || !preco) {
        mostrarMensagem('Preencha nome e preço', 'error');
        return;
    }
    
    if (categoriasSelecionadas.length === 0) {
        mostrarMensagem('Selecione pelo menos uma categoria', 'error');
        return;
    }
    
    const saveBtn = document.getElementById('saveProductBtn');
    const textoOriginal = saveBtn.innerHTML;
    saveBtn.innerHTML = 'Atualizando...';
    saveBtn.disabled = true;
    
    try {
        const dadosAtualizados = {
            nome: nome,
            preco: preco,
            categorias: categoriasSelecionadas,
            categoria: categoriasSelecionadas[0],
            ativo: status,
            descricao: descricao,
            atualizadoEm: new Date().toISOString()
        };
        
        if (imagemBase64) {
            dadosAtualizados.imagem = imagemBase64;
        }
        
        await updateDoc(doc(db, "perfumes", id), dadosAtualizados);
        
        mostrarMensagem('Produto atualizado!', 'success');
        
        saveBtn.innerHTML = 'Salvar Produto';
        saveBtn.onclick = salvarProduto;
        
        limparFormulario();
        carregarProdutos();
        
    } catch (error) {
        console.error("Erro ao atualizar:", error);
        mostrarMensagem(`Erro: ${error.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
    }
};

window.excluirProduto = async function(id) {
    const produto = produtosCarregados.find(p => p.id === id);
    if (!produto) return;
    
    if (confirm(`Excluir "${produto.nome}"?`)) {
        try {
            await deleteDoc(doc(db, "perfumes", id));
            mostrarMensagem('Produto excluído!', 'success');
            carregarProdutos();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            mostrarMensagem(`Erro: ${error.message}`, 'error');
        }
    }
};

// =================== INICIALIZAÇÃO ===================
document.addEventListener('DOMContentLoaded', function() {
    console.log("Painel Admin inicializando...");
    
    configurarLogout();
    configurarUpload();
    
    const saveBtn = document.getElementById('saveProductBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', salvarProduto);
    }
    
    // CARREGA CATEGORIAS COMO CHECKBOXES
    carregarCategoriasCheckboxes();
    
    carregarProdutos();
    
    console.log("Painel Admin inicializado com sucesso!");
});