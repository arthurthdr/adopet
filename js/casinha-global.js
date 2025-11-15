
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

document.addEventListener('DOMContentLoaded', updateCasinhaContador);