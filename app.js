let listaDeNumerosSorteados = [];
let numeroLimite = 10; // limite padrão alinhado com o input do HTML
let numeroSecreto = gerarNumeroAleatorio();
let tentativas = 1;

function exibirTextoNaTela(tag, texto) {
    const campo = document.querySelector(tag);
    if (campo) {
        campo.innerHTML = texto;
    }
    // Fala somente se a biblioteca estiver disponível
    if (typeof window !== 'undefined' && window.responsiveVoice && typeof window.responsiveVoice.speak === 'function') {
        window.responsiveVoice.speak(texto, 'Brazilian Portuguese Female', { rate: 1.2 });
    }
}

function exibirMensagemInicial() {
    exibirTextoNaTela('h1', 'Jogo do número secreto');
    exibirTextoNaTela('p', `Escolha um número entre 1 e ${numeroLimite}`);

    // Sincroniza atributos do input com o limite atual
    const input = document.querySelector('input');
    if (input) {
        input.setAttribute('min', '1');
        input.setAttribute('max', String(numeroLimite));
        input.setAttribute('placeholder', `1 a ${numeroLimite}`);
    }
}

exibirMensagemInicial();

function verificarChute() {
    const input = document.querySelector('input');
    const valor = input ? input.value.trim() : '';
    const chute = Number(valor);

    if (!valor || Number.isNaN(chute)) {
        exibirTextoNaTela('p', 'Por favor, digite um número válido.');
        return;
    }
    if (chute < 1 || chute > numeroLimite) {
        exibirTextoNaTela('p', `O número deve estar entre 1 e ${numeroLimite}.`);
        return;
    }

    if (chute === numeroSecreto) {
        exibirTextoNaTela('h1', 'Acertou!');
        const palavraTentativa = tentativas > 1 ? 'tentativas' : 'tentativa';
        const mensagemTentativas = `Você descobriu o número secreto com ${tentativas} ${palavraTentativa}!`;
        exibirTextoNaTela('p', mensagemTentativas);
        document.getElementById('reiniciar')?.removeAttribute('disabled');
    } else {
        if (chute > numeroSecreto) {
            exibirTextoNaTela('p', 'O número secreto é menor');
        } else {
            exibirTextoNaTela('p', 'O número secreto é maior');
        }
        tentativas++;
        limparCampo();
    }
}

function gerarNumeroAleatorio() {
    const numeroEscolhido = Math.floor(Math.random() * numeroLimite) + 1;
    const quantidadeDeElementosNaLista = listaDeNumerosSorteados.length;

    if (quantidadeDeElementosNaLista === numeroLimite) {
        // Zera a lista quando todos os números já foram sorteados
        listaDeNumerosSorteados = [];
    }
    if (listaDeNumerosSorteados.includes(numeroEscolhido)) {
        return gerarNumeroAleatorio();
    } else {
        listaDeNumerosSorteados.push(numeroEscolhido);
        // console.log(listaDeNumerosSorteados);
        return numeroEscolhido;
    }
}

function limparCampo() {
    const input = document.querySelector('input');
    if (input) {
        input.value = '';
        input.focus();
    }
}

function reiniciarJogo() {
    numeroSecreto = gerarNumeroAleatorio();
    limparCampo();
    tentativas = 1;
    exibirMensagemInicial();
    document.getElementById('reiniciar')?.setAttribute('disabled', 'true');
}







