// =================== SLIDER COM ANIMAÇÃO SIMPLES ===================
let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  const slides = document.getElementsByClassName("slide");
  const dots = document.getElementsByClassName("dot");
  
  if (!slides || slides.length === 0) {
    console.error("Nenhum slide encontrado!");
    return;
  }
  
  if (n > slides.length) slideIndex = 1;
  if (n < 1) slideIndex = slides.length;
  
  // Remove todas as animações
  for (let i = 0; i < slides.length; i++) {
    slides[i].classList.remove("slide-in-right", "slide-in-left");
    slides[i].style.display = "none";
  }
  
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.remove("active");
  }
  
  // Mostra o slide atual com animação
  slides[slideIndex - 1].style.display = "block";
  
  // Adiciona animação baseada na direção
  const direction = n > slideIndex ? "slide-in-right" : "slide-in-left";
  slides[slideIndex - 1].classList.add(direction);
  
  dots[slideIndex - 1].classList.add("active");
}

// Troca automática a cada 5s
setInterval(() => { 
  plusSlides(1); 
}, 5000);

// Torna funções globais para os botões onclick
window.plusSlides = plusSlides;
window.currentSlide = currentSlide;

console.log("Slider com animação simples inicializado!");