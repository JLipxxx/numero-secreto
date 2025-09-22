// Estado do jogo e configurações
let listaDeNumerosSorteados = [];
let numeroLimite = 10;
let numeroSecreto;
let tentativas = 1;
let timerId = null;
let tempoMs = 0;
let vozAtiva = true;
let sonsAtivos = true;
let speedrunAtivo = false;
let dificuldadeAtual = 'facil'; // facil|medio|dificil
let dicaMin = 1;
let dicaMax = numeroLimite;

// Mapeamento de dificuldade -> limite
const DIFICULDADES = {
    facil: 10,
    medio: 50,
    dificil: 100,
};

// Utilitários
function falar(texto) {
    if (!vozAtiva) return;
    if (typeof window !== 'undefined' && window.responsiveVoice && typeof window.responsiveVoice.speak === 'function') {
        window.responsiveVoice.speak(texto, 'Brazilian Portuguese Female', { rate: 1.2 });
    }
}

function exibirTextoNaTela(tag, texto) {
    const campo = document.querySelector(tag);
    if (campo) campo.innerHTML = texto;
    falar(texto);
}

function formatarTempo(ms) {
    const totalSeg = Math.floor(ms / 1000);
    const min = String(Math.floor(totalSeg / 60)).padStart(2, '0');
    const seg = String(totalSeg % 60).padStart(2, '0');
    return `${min}:${seg}`;
}

function atualizarStatus() {
    document.getElementById('status-tentativas')?.replaceChildren(document.createTextNode(String(tentativas)));
    document.getElementById('status-tempo')?.replaceChildren(document.createTextNode(formatarTempo(tempoMs)));
    const modo = speedrunAtivo ? 'Speedrun' : 'Clássico';
    document.getElementById('status-modo')?.replaceChildren(document.createTextNode(modo));
}

function carregarRecorde() {
    const key = `ns:recorde:${dificuldadeAtual}:${speedrunAtivo ? 'sr' : 'cl'}`;
    const recorde = JSON.parse(localStorage.getItem(key) || 'null');
    const alvo = document.getElementById('status-recorde');
    if (alvo) {
        if (!recorde) {
            alvo.textContent = '—';
        } else if (speedrunAtivo) {
            alvo.textContent = `${formatarTempo(recorde.tempoMs)}`;
        } else {
            alvo.textContent = `${recorde.tentativas} tent. / ${formatarTempo(recorde.tempoMs)}`;
        }
    }
}

function salvarRecordeSeMelhor() {
    const key = `ns:recorde:${dificuldadeAtual}:${speedrunAtivo ? 'sr' : 'cl'}`;
    const atual = { tentativas, tempoMs };
    const anterior = JSON.parse(localStorage.getItem(key) || 'null');
    let melhor;
    if (!anterior) {
        melhor = atual;
    } else if (speedrunAtivo) {
        // No speedrun, prioriza menor tempo
        melhor = (atual.tempoMs < anterior.tempoMs) ? atual : anterior;
    } else {
        // Clássico: menor tentativas, depois menor tempo
        melhor = (atual.tentativas < anterior.tentativas || (atual.tentativas === anterior.tentativas && atual.tempoMs < anterior.tempoMs)) ? atual : anterior;
    }
    localStorage.setItem(key, JSON.stringify(melhor));
    carregarRecorde();
}

function atualizarDicaIntervalo() {
    const minEl = document.getElementById('dica-min');
    const maxEl = document.getElementById('dica-max');
    if (minEl) minEl.textContent = String(dicaMin);
    if (maxEl) maxEl.textContent = String(dicaMax);
}

function atualizarProgresso(chute) {
    const fill = document.getElementById('progress-fill');
    if (!fill) return;
    const maxDist = Math.max(1, numeroLimite - 1);
    const dist = Math.abs(chute - numeroSecreto);
    const prox = Math.max(0, Math.min(100, Math.round((1 - dist / maxDist) * 100)));
    fill.style.width = `${prox}%`;
    const barra = fill.parentElement;
    if (barra) barra.setAttribute('aria-valuenow', String(prox));
}

function adicionarAoHistorico(chute, dica) {
    const ul = document.getElementById('lista-historico');
    if (!ul) return;
    const li = document.createElement('li');
    li.textContent = `#${tentativas} → ${chute} (${dica})`;
    ul.prepend(li);
}

function iniciarTimer() {
    if (timerId) return;
    const inicio = Date.now() - tempoMs;
    timerId = setInterval(() => {
        tempoMs = Date.now() - inicio;
        atualizarStatus();
    }, 250);
}

function pararTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

function confete() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    const count = 60;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        const size = 6 + Math.random() * 6;
        p.style.position = 'absolute';
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = '-10px';
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.background = `hsl(${Math.floor(Math.random() * 360)}, 90%, 60%)`;
        p.style.opacity = '0.9';
        p.style.transform = `rotate(${Math.random() * 360}deg)`;
        p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        p.style.transition = 'transform 2s linear, top 2s linear, opacity 2s linear';
        container.appendChild(p);
        requestAnimationFrame(() => {
            p.style.top = '110%';
            p.style.transform = `translateX(${(Math.random() * 200 - 100)}px) rotate(${Math.random() * 720}deg)`;
            p.style.opacity = '0';
        });
        setTimeout(() => p.remove(), 2200);
    }
}

function aplicarTema(tema) {
    document.body.classList.toggle('tema-claro', tema === 'claro');
    localStorage.setItem('ns:tema', tema);
}

function lerTemaPersistido() {
    return localStorage.getItem('ns:tema') || 'escuro';
}

function configurarUI() {
    // Atribuir ids já existem no HTML
    const input = document.getElementById('input-chute');
    if (input) {
        input.setAttribute('min', '1');
        input.setAttribute('max', String(numeroLimite));
        input.setAttribute('placeholder', `1 a ${numeroLimite}`);
    }

    // Dificuldade
    const seletor = document.getElementById('seletor-dificuldade');
    if (seletor) {
        dificuldadeAtual = (seletor.value || 'facil');
        numeroLimite = DIFICULDADES[dificuldadeAtual] || 10;
        seletor.addEventListener('change', () => {
            dificuldadeAtual = seletor.value;
            numeroLimite = DIFICULDADES[dificuldadeAtual] || 10;
            dicaMin = 1;
            dicaMax = numeroLimite;
            novoJogo();
        });
    }

    // Voz
    const chkVoz = document.getElementById('toggle-voz');
    if (chkVoz) {
        // Por padrão marcado no HTML; podemos persistir preferências se quiser
        const salvo = localStorage.getItem('ns:vozAtiva');
        if (salvo !== null) {
            vozAtiva = salvo === 'true';
            chkVoz.checked = vozAtiva;
        } else {
            vozAtiva = chkVoz.checked;
        }
        chkVoz.addEventListener('change', () => {
            vozAtiva = chkVoz.checked;
            localStorage.setItem('ns:vozAtiva', String(vozAtiva));
        });
    }

    // Sons
    const chkSons = document.getElementById('toggle-sons');
    if (chkSons) {
        const salvo = localStorage.getItem('ns:sonsAtivos');
        if (salvo !== null) {
            sonsAtivos = salvo === 'true';
            chkSons.checked = sonsAtivos;
        } else {
            sonsAtivos = chkSons.checked;
        }
        chkSons.addEventListener('change', () => {
            sonsAtivos = chkSons.checked;
            localStorage.setItem('ns:sonsAtivos', String(sonsAtivos));
        });
    }

    // Tema
    const temaSalvo = lerTemaPersistido();
    aplicarTema(temaSalvo);
    const chkTema = document.getElementById('toggle-tema');
    if (chkTema) {
        chkTema.checked = temaSalvo === 'claro';
        chkTema.addEventListener('change', () => aplicarTema(chkTema.checked ? 'claro' : 'escuro'));
    }

    // Atalhos: Enter para chutar, Ctrl+R para reiniciar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            verificarChute();
        } else if ((e.key === 'r' || e.key === 'R') && (e.ctrlKey || e.metaKey)) {
            reiniciarJogo();
        }
    });

    // Speedrun
    const chkSpeedrun = document.getElementById('toggle-speedrun');
    if (chkSpeedrun) {
        const salvo = localStorage.getItem('ns:speedrunAtivo');
        if (salvo !== null) {
            speedrunAtivo = salvo === 'true';
            chkSpeedrun.checked = speedrunAtivo;
        } else {
            speedrunAtivo = chkSpeedrun.checked;
        }
        chkSpeedrun.addEventListener('change', () => {
            speedrunAtivo = chkSpeedrun.checked;
            localStorage.setItem('ns:speedrunAtivo', String(speedrunAtivo));
            novoJogo(); // reinicia para aplicar modo
        });
    }
}

function exibirMensagemInicial() {
    exibirTextoNaTela('h1', 'Jogo do número secreto');
    exibirTextoNaTela('p', `Escolha um número entre 1 e ${numeroLimite}`);
    const input = document.getElementById('input-chute');
    if (input) {
        input.setAttribute('min', '1');
        input.setAttribute('max', String(numeroLimite));
        input.setAttribute('placeholder', `1 a ${numeroLimite}`);
        input.value = '';
        input.focus();
    }
    atualizarStatus();
    atualizarDicaIntervalo();
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = '0%';
    document.getElementById('reiniciar')?.setAttribute('disabled', 'true');
    carregarRecorde();
}

function novoJogo() {
    listaDeNumerosSorteados = [];
    numeroSecreto = gerarNumeroAleatorio();
    tentativas = 1;
    tempoMs = 0;
    pararTimer();
    dicaMin = 1;
    dicaMax = numeroLimite;
    document.getElementById('lista-historico')?.replaceChildren();
    exibirMensagemInicial();
    if (speedrunAtivo) {
        iniciarTimer(); // no speedrun, cronômetro inicia imediatamente
    }
}

function verificarChute() {
    const input = document.getElementById('input-chute');
    const valor = input ? input.value.trim() : '';
    const chute = Number(valor);

    if (!valor || Number.isNaN(chute)) {
        exibirTextoNaTela('p', 'Por favor, digite um número válido.');
        input?.classList.add('shake');
        setTimeout(() => input?.classList.remove('shake'), 320);
        invalidTone();
        return;
    }
    if (chute < 1 || chute > numeroLimite) {
        exibirTextoNaTela('p', `O número deve estar entre 1 e ${numeroLimite}.`);
        input?.classList.add('shake');
        setTimeout(() => input?.classList.remove('shake'), 320);
        invalidTone();
        return;
    }

    iniciarTimer();

    if (chute === numeroSecreto) {
        exibirTextoNaTela('h1', 'Acertou!');
        const palavraTentativa = tentativas > 1 ? 'tentativas' : 'tentativa';
        const mensagemTentativas = speedrunAtivo
            ? `Speedrun! Você acertou em ${formatarTempo(tempoMs)}!`
            : `Você descobriu o número secreto com ${tentativas} ${palavraTentativa} em ${formatarTempo(tempoMs)}!`;
        exibirTextoNaTela('p', mensagemTentativas);
        document.getElementById('reiniciar')?.removeAttribute('disabled');
        pararTimer();
        salvarRecordeSeMelhor();
        confete();
        successJingle();
        atualizarProgresso(chute);
        return;
    }

    // Atualiza dicas e histórico
    let dica;
    if (chute > numeroSecreto) {
        dica = 'maior → tente menor';
        exibirTextoNaTela('p', 'O número secreto é menor');
        dicaMax = Math.min(dicaMax, chute - 1);
    } else {
        dica = 'menor → tente maior';
        exibirTextoNaTela('p', 'O número secreto é maior');
        dicaMin = Math.max(dicaMin, chute + 1);
    }
    atualizarDicaIntervalo();

    // Quente/Frio
    const dist = Math.abs(chute - numeroSecreto);
    const hotCold = dist <= Math.max(1, Math.floor(numeroLimite * 0.05)) ? '🔥 Quente' : dist <= Math.floor(numeroLimite * 0.15) ? '🟠 Morno' : '🧊 Frio';
    adicionarAoHistorico(chute, `${dica} | ${hotCold}`);
    errorTone(dist);

    tentativas++;
    atualizarStatus();
    atualizarProgresso(chute);
    limparCampo();
}

function gerarNumeroAleatorio() {
    const numeroEscolhido = Math.floor(Math.random() * numeroLimite) + 1;
    const quantidadeDeElementosNaLista = listaDeNumerosSorteados.length;
    if (quantidadeDeElementosNaLista === numeroLimite) {
        listaDeNumerosSorteados = [];
    }
    if (listaDeNumerosSorteados.includes(numeroEscolhido)) {
        return gerarNumeroAleatorio();
    } else {
        listaDeNumerosSorteados.push(numeroEscolhido);
        return numeroEscolhido;
    }
}

function limparCampo() {
    const input = document.getElementById('input-chute');
    if (input) {
        input.value = '';
        input.focus();
    }
}

function reiniciarJogo() {
    novoJogo();
}

// Sons (WebAudio)
let audioCtx = null;
function ensureAudio() {
    if (!sonsAtivos) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playTone(freq = 440, duration = 0.15, type = 'sine', gain = 0.03) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}

function successJingle() {
    playTone(523.25, 0.1, 'sine', 0.04); // C5
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.04), 110); // E5
    setTimeout(() => playTone(783.99, 0.18, 'sine', 0.05), 220); // G5
}

function errorTone(distance = 0) {
    const base = 280;
    const freq = Math.max(160, base - Math.min(distance * 8, 200));
    playTone(freq, 0.12, 'square', 0.03);
}

function invalidTone() {
    playTone(160, 0.1, 'sawtooth', 0.03);
    setTimeout(() => playTone(120, 0.12, 'sawtooth', 0.03), 120);
}

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
    // Tema ao carregar (script com defer garante DOM disponível, mas por via das dúvidas)
    configurarUI();
    novoJogo();
});







