// js/casinha-global.js
// Este arquivo contém apenas as funções da casinha que são usadas em MAIS DE UMA PÁGINA.

function getCasinha() {
    return JSON.parse(localStorage.getItem('casinhaAdopet')) || [];
}

function saveCasinha(casinha) {
    localStorage.setItem('casinhaAdopet', JSON.stringify(casinha));
    updateCasinhaContador();
}

function updateCasinhaContador() {
    const contador = document.getElementById('casinha-contador');
    if (contador) {
        const casinha = getCasinha();
        contador.textContent = casinha.length;
        contador.style.display = casinha.length > 0 ? 'block' : 'none';
    }
}

// Chamar o contador assim que a página carrega, para manter o número sempre atualizado.
document.addEventListener('DOMContentLoaded', updateCasinhaContador);