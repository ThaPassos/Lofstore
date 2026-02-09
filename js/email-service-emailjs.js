
// =================== CONFIGURAÇÃO DO EMAILJS ===================
const EMAILJS_SERVICE_ID = "service_k85ya1a";  
const EMAILJS_TEMPLATE_CLIENTE = "template_jjxc4sr";  
const EMAILJS_TEMPLATE_ADMIN = "template_4wmngsq";      
const EMAILJS_PUBLIC_KEY = "7cgPWSWeUZMOHbSp2";  

// Inicializa EmailJS (será chamado no HTML)
export function inicializarEmailJS() {
  if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log("EmailJS inicializado");
  } else {
    console.error("EmailJS não está carregado!");
  }
}

// =================== VALIDAÇÃO DE DADOS ===================
function validarDadosPedido(pedidoData) {
  console.log("Validando dados do pedido...");
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(pedidoData.cliente.email)) {
    console.error("E-mail inválido:", pedidoData.cliente.email);
    throw new Error("E-mail inválido");
  }
  
  if (!pedidoData.cliente.nome || pedidoData.cliente.nome.length < 2) {
    console.error("Nome inválido:", pedidoData.cliente.nome);
    throw new Error("Nome inválido");
  }
  
  console.log("Dados do pedido validados");
  return true;
}

// =================== FORMATAR LISTA DE PRODUTOS ===================
function formatarListaProdutos(itens) {
  console.log("Formatando lista de produtos...");
  
  return itens
    .map((item, i) => {
      const qtd = parseInt(item.quantidade) || 1;
      const preco = parseFloat(item.preco * qtd).toFixed(2);
      return `${i + 1}. ${item.nome} (x${qtd}) - R$ ${preco}`;
    })
    .join("\n");
}

// =================== ENVIAR E-MAIL PARA O CLIENTE ===================
async function enviarEmailCliente(pedidoData, pedidoId) {
  console.log("[1/2] Enviando e-mail para o CLIENTE...");
  console.log("   → Destinatário:", pedidoData.cliente.email);
  
  const listaProdutos = formatarListaProdutos(pedidoData.itens);
  const numeroPedido = pedidoId.substring(0, 8).toUpperCase();

  // Parâmetros que serão enviados para o template do EmailJS
  const templateParams = {
    to_email: pedidoData.cliente.email,
    to_name: pedidoData.cliente.nome,
    pedido_numero: numeroPedido,
    data: new Date().toLocaleDateString('pt-BR'),
    hora: new Date().toLocaleTimeString('pt-BR'),
    lista_produtos: listaProdutos,
    total: `R$ ${parseFloat(pedidoData.total).toFixed(2)}`,
    endereco: pedidoData.cliente.endereco,
    telefone: pedidoData.cliente.telefone,
    observacoes: pedidoData.observacoes || 'Nenhuma'
  };

  try {
    console.log("   → Enviando via EmailJS...");
    
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_CLIENTE,
      templateParams
    );

    console.log("E-mail para CLIENTE enviado com sucesso!");
    console.log("   → Status:", response.status);
    console.log("   → Text:", response.text);
    
    return response;
    
  } catch (error) {
    console.error("Erro ao enviar e-mail para cliente:", error);
    throw error;
  }
}

// =================== ENVIAR E-MAIL PARA O ADMIN ===================
async function enviarEmailAdmin(pedidoData, pedidoId) {
  console.log(" [2/2] Enviando e-mail para o ADMIN...");
  console.log("   → Destinatário: thafinhapassos@gmail.com");
  
  const listaProdutos = formatarListaProdutos(pedidoData.itens);
  const numeroPedido = pedidoId.substring(0, 8).toUpperCase();

  // Parâmetros para o template do admin
  const templateParams = {
    to_email: "thafinhapassos@gmail.com",
    pedido_numero: numeroPedido,
    data: new Date().toLocaleDateString('pt-BR'),
    hora: new Date().toLocaleTimeString('pt-BR'),
    cliente_nome: pedidoData.cliente.nome,
    cliente_email: pedidoData.cliente.email,
    cliente_telefone: pedidoData.cliente.telefone,
    lista_produtos: listaProdutos,
    total: `R$ ${parseFloat(pedidoData.total).toFixed(2)}`,
    endereco: pedidoData.cliente.endereco,
    observacoes: pedidoData.observacoes || 'Nenhuma'
  };

  try {
    console.log("   → Enviando via EmailJS...");
    
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ADMIN,
      templateParams
    );

    console.log(" E-mail para ADMIN enviado com sucesso!");
    console.log("   → Status:", response.status);
    console.log("   → Text:", response.text);
    
    return response;
    
  } catch (error) {
    console.error("Erro ao enviar e-mail para admin:", error);
    throw error;
  }
}

// =================== ENVIAR AMBOS OS E-MAILS ===================
export async function enviarEmailsPedido(pedidoData, pedidoId) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(" INICIANDO ENVIO DE E-MAILS VIA EMAILJS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Dados do pedido:");
  console.log("   → Cliente:", pedidoData.cliente.nome);
  console.log("   → Email:", pedidoData.cliente.email);
  console.log("   → Pedido ID:", pedidoId);
  console.log("   → Total:", pedidoData.total);
  console.log("   → Itens:", pedidoData.itens.length);
  
  try {
    // Valida dados
    validarDadosPedido(pedidoData);
    
    // Envia para o cliente
    console.log("\n ETAPA 1: Enviando para o cliente...");
    await enviarEmailCliente(pedidoData, pedidoId);
    
    // Pequeno delay entre envios
    console.log("\n Aguardando 1 segundo...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Envia para o admin
    console.log("\n ETAPA 2: Enviando para o admin...");
    await enviarEmailAdmin(pedidoData, pedidoId);
    
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(" SUCESSO! TODOS OS E-MAILS FORAM ENVIADOS!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    return { 
      success: true, 
      message: "E-mails enviados com sucesso para cliente e admin" 
    };
    
  } catch (error) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("ERRO AO ENVIAR E-MAILS!");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("Tipo:", error.name);
    console.error("Mensagem:", error.message);
    if (error.text) console.error("Detalhes:", error.text);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    return { 
      success: false, 
      message: error.message 
    };
  }
}