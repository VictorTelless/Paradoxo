// ========================================
// PARADOXO — FUGA DO LABORATÓRIO
// BUILD 0.3.0
// ========================================


// ========================================
// ELEMENTOS DO HTML
// ========================================

const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

const menu = document.getElementById("menu");
const gameScreen = document.getElementById("game-screen");

const sala01 = document.getElementById("sala-01");
const sala02 = document.getElementById("sala-02");
const finalScreen = document.getElementById("final-screen");

const terminal = document.getElementById("terminal");
const cabinet = document.getElementById("cabinet");
const door = document.getElementById("door");
let room = document.querySelector("#sala-01 .room");

const room02 = document.querySelector("#sala-02 .room-02");
const terminal02 = document.querySelector("#sala-02 .central-console");
const painelTautologia = document.querySelector("#sala-02 .tautologia-panel");
const player = document.getElementById("player");
const interactionPrompt = document.getElementById("interaction-prompt");

const inventoryItems = document.getElementById("inventory-items");

const messageTitle = document.getElementById("message-title");
const message = document.getElementById("message");

const messageTitle02 = document.getElementById("message-title-02");
const message02 = document.getElementById("message-02");

const modal = document.getElementById("modal");
const modalCategory = document.getElementById("modal-category");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");

const closeModalButton = document.getElementById("close-modal");


// ========================================
// ESTADO DO JOGO
// ========================================

const estado = {
    iniciada: false,
    jogador: { x: 0, y: 0, velocidade: 220 },

    // Sala 01
    cartaoEncontrado: false,
    senhaDescoberta: false,
    alarmeDesativado: false,
    portaAberta: false,

    // Sala 02
    expressaoSelecionada: null,
    valorP: true,

    valoresTestados: {
        verdadeiro: false,
        falso: false
    },

    terminalTautologiaValidado: false,
    senhaTautologiaDescoberta: false,
    senhaTautologiaDigitada: false
};

const SENHA_DO_TERMINAL = "1010";


// ========================================
// MOVIMENTAÇÃO E INTERAÇÃO DO PERSONAGEM
// ========================================

const teclasPressionadas = new Set();
let ultimoFrame = 0;
let alvoProximo = null;
const distanciaInteracao = 92;
function atualizarAnimacaoJogador(dx, dy) {
    player.classList.remove(
        "frente",
        "costas",
        "esquerda",
        "direita"
    );

    if (Math.abs(dx) > Math.abs(dy)) {
        player.classList.add(dx < 0 ? "esquerda" : "direita");
    } else if (dy < 0) {
        player.classList.add("costas");
    } else {
        player.classList.add("frente");
    }

    if (dx !== 0 || dy !== 0) {
        player.classList.add("andando");
    } else {
        player.classList.remove("andando");
    }
}
function posicionarJogadorInicial() {
    const largura = room.clientWidth;
    estado.jogador.x = largura / 2 - 17;
    estado.jogador.y = room.clientHeight - 105;

    const posicao = limitarPosicaoJogador(
        estado.jogador.x,
        estado.jogador.y
    );

    estado.jogador.x = posicao.x;
    estado.jogador.y = posicao.y;

    desenharJogador();
}

function desenharJogador() {
    player.style.left = `${estado.jogador.x}px`;
    player.style.top = `${estado.jogador.y}px`;
}

function obterAlvosInteracao() {

    // Objetos da Sala 02
    if (!sala02.hidden) {
        return [
            {
                elemento: terminal02,
                nome: "TERMINAL DE TAUTOLOGIA",
                acao: abrirTerminalTautologia
            }
        ];
    }

    // Objetos da Sala 01
    return [
    {
        elemento: terminal02,
        nome: "TERMINAL DE TAUTOLOGIA",
        acao: abrirTerminalTautologia
    },
    {
        elemento: serverDoor,
        nome: "PORTA DE SAÍDA",
        acao: verificarPortaServidor
    }
];
}
function abrirTerminalTautologia() {

    painelTautologia.hidden = false;

    atualizarMensagem02(
        "TERMINAL ATIVADO",
        "Analise as expressões lógicas e descubra qual delas é uma tautologia."
    );

    painelTautologia.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
function verificarPortaServidor() {

    if (!estado.senhaTautologiaDescoberta) {
        atualizarMensagem02(
            "ACESSO BLOQUEADO",
            "A porta exige a conclusão do protocolo de tautologia."
        );
        return;
    }

    concluirJogo();
}
function atualizarAlvoProximo() {
    const centroJogadorX = estado.jogador.x + 17;
    const centroJogadorY = estado.jogador.y + 24;
    let maisProximo = null;
    let menorDistancia = Infinity;

    obterAlvosInteracao().forEach(alvo => {
        const caixa = alvo.elemento.getBoundingClientRect();
        const salaCaixa = room.getBoundingClientRect();
        const centroX = caixa.left - salaCaixa.left + caixa.width / 2;
        const centroY = caixa.top - salaCaixa.top + caixa.height / 2;
        const distancia = Math.hypot(centroJogadorX - centroX, centroJogadorY - centroY);

        alvo.elemento.classList.remove("nearby");
        if (distancia < menorDistancia) {
            menorDistancia = distancia;
            maisProximo = alvo;
        }
    });

    if (maisProximo && menorDistancia < distanciaInteracao) {
        alvoProximo = maisProximo;
        alvoProximo.elemento.classList.add("nearby");
        interactionPrompt.innerHTML = `PRESSIONE <kbd>E</kbd> PARA INTERAGIR: ${alvoProximo.nome}`;
    } else {
        alvoProximo = null;
        interactionPrompt.innerHTML = 'USE <kbd>W A S D</kbd> OU <kbd>↑ ↓ ← →</kbd> PARA SE MOVER';
    }
}

function interagirComAlvo() {

    if (!estado.iniciada) return;

    if (sala01.hidden && sala02.hidden) return;

    if (modal && !modal.hidden) return;

    if (alvoProximo) {
        alvoProximo.acao();
    }
}
// Verifica se o personagem está encostando em algum obstáculo.
function colideComObstaculo(x, y) {
    const larguraJogador = player.offsetWidth || 34;
    const alturaJogador = player.offsetHeight || 48;
    const margem = 3;

    const jogador = {
        esquerda: x + margem,
        direita: x + larguraJogador - margem,
        topo: y + margem,
        base: y + alturaJogador - margem
    };

    const obstaculos = sala02.hidden
        ? [terminal, cabinet, door]
        : [
            ...room02.querySelectorAll(".server-rack"),
            terminal02,
            room02.querySelector(".server-door")
    ];
    return obstaculos.some(elemento => {
        if (!elemento || elemento.hidden) return false;

        const obstaculo = {
            esquerda: elemento.offsetLeft,
            direita: elemento.offsetLeft + elemento.offsetWidth,
            topo: elemento.offsetTop,
            base: elemento.offsetTop + elemento.offsetHeight
        };

        return (
            jogador.direita > obstaculo.esquerda &&
            jogador.esquerda < obstaculo.direita &&
            jogador.base > obstaculo.topo &&
            jogador.topo < obstaculo.base
        );
    });
}


// Impede o personagem de ultrapassar os limites da sala.
function limitarPosicaoJogador(x, y) {
    const larguraJogador = player.offsetWidth || 34;
    const alturaJogador = player.offsetHeight || 48;
    const margem = 8;
    const limiteChao = room.clientHeight - 45;

    return {
        x: Math.max(
            margem,
            Math.min(room.clientWidth - larguraJogador - margem, x)
        ),
        y: Math.max(
            margem,
            Math.min(limiteChao - alturaJogador, y)
        )
    };
}

function loopMovimento(tempo) {
    if (!estado.iniciada) return;

    const delta = ultimoFrame
        ? Math.min((tempo - ultimoFrame) / 1000, 0.04)
        : 0;

    ultimoFrame = tempo;

    if (modal && !modal.hidden) {
        requestAnimationFrame(loopMovimento);
        return;
    }

    let dx = 0;
    let dy = 0;

    if (teclasPressionadas.has("w") || teclasPressionadas.has("arrowup")) dy -= 1;
    if (teclasPressionadas.has("s") || teclasPressionadas.has("arrowdown")) dy += 1;
    if (teclasPressionadas.has("a") || teclasPressionadas.has("arrowleft")) dx -= 1;
    if (teclasPressionadas.has("d") || teclasPressionadas.has("arrowright")) dx += 1;
    atualizarAnimacaoJogador(dx, dy);
    if (dx || dy) {
        const tamanho = Math.hypot(dx, dy) || 1;
        const deslocamento = estado.jogador.velocidade * delta;

        const movimentoX = (dx / tamanho) * deslocamento;
        const movimentoY = (dy / tamanho) * deslocamento;

        // Movimento horizontal
        const posicaoX = limitarPosicaoJogador(
            estado.jogador.x + movimentoX,
            estado.jogador.y
        );

        if (!colideComObstaculo(posicaoX.x, posicaoX.y)) {
            estado.jogador.x = posicaoX.x;
        }

        // Movimento vertical
        const posicaoY = limitarPosicaoJogador(
            estado.jogador.x,
            estado.jogador.y + movimentoY
        );

        if (!colideComObstaculo(posicaoY.x, posicaoY.y)) {
            estado.jogador.y = posicaoY.y;
        }
        
        desenharJogador();
    }

    atualizarAlvoProximo();

    requestAnimationFrame(loopMovimento);
}

document.addEventListener("keydown", evento => {
    const tecla = evento.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(tecla)) evento.preventDefault();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(tecla)) teclasPressionadas.add(tecla);
    if (tecla === "e" && !evento.repeat) interagirComAlvo();
});

document.addEventListener("keyup", evento => teclasPressionadas.delete(evento.key.toLowerCase()));
window.addEventListener("blur", () => teclasPressionadas.clear());
window.addEventListener("resize", () => {
    if (estado.iniciada && !sala01.hidden) {
        const posicao = limitarPosicaoJogador(
            estado.jogador.x,
            estado.jogador.y
        );

        estado.jogador.x = posicao.x;
        estado.jogador.y = posicao.y;

        desenharJogador();
        atualizarAlvoProximo();
    }
});

// ========================================
// INICIAR JOGO
// ========================================

startButton.addEventListener("click", iniciarJogo);
door.addEventListener("click", verificarCondicoesPorta);

function iniciarJogo() {
    estado.iniciada = true;

    menu.classList.remove("active");
    gameScreen.classList.add("active");

    sala01.hidden = false;
    sala02.hidden = true;
    finalScreen.hidden = true;

    posicionarJogadorInicial();
    teclasPressionadas.clear();
    ultimoFrame = 0;
    requestAnimationFrame(loopMovimento);

    atualizarMensagem(
        "PROTOCOLO INICIADO",
        "Você despertou no laboratório. A porta está bloqueada. " +
        "Investigue o armário e o terminal para descobrir como escapar."
    );
}


// ========================================
// SISTEMA DE MENSAGENS
// ========================================

function atualizarMensagem(titulo, texto) {
    messageTitle.textContent = titulo;
    message.textContent = texto;
}

function atualizarMensagem02(titulo, texto) {
    messageTitle02.textContent = titulo;
    message02.textContent = texto;
}


// ========================================
// MODAL
// ========================================

function abrirModal(categoria, titulo, conteudo) {
    modalCategory.textContent = categoria;
    modalTitle.textContent = titulo;

    modalBody.replaceChildren();
    modalBody.append(conteudo);

    modal.hidden = false;
    closeModalButton.focus();
}

function fecharModal() {
    modal.hidden = true;
}

closeModalButton.addEventListener("click", fecharModal);

modal.addEventListener("click", function (evento) {
    if (evento.target === modal) {
        fecharModal();
    }
});

document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && !modal.hidden) {
        fecharModal();
    }
});


// ========================================
// AUXILIAR PARA CRIAR ELEMENTOS
// ========================================

function criarParagrafo(texto) {
    const elemento = document.createElement("p");
    elemento.textContent = texto;

    return elemento;
}

function criarBotao(texto, classe, acao) {
    const botao = document.createElement("button");

    botao.type = "button";
    botao.className = classe;
    botao.textContent = texto;

    botao.addEventListener("click", acao);

    return botao;
}


// ========================================
// INVENTÁRIO
// ========================================

function adicionarItem(nome) {
    if (inventoryItems.querySelector(".empty-inventory")) {
        inventoryItems.replaceChildren();
    }

    const item = document.createElement("span");

    item.className = "inventory-item";
    item.textContent = "▣ " + nome;

    inventoryItems.append(item);
}


// ========================================
// ARMÁRIO — ENCONTRAR CARTÃO
// ========================================

cabinet.addEventListener("click", investigarArmario);

function investigarArmario() {
    if (estado.cartaoEncontrado) {
        atualizarMensagem(
            "ARMÁRIO",
            "Você já investigou o armário. Não há mais nada útil aqui."
        );

        return;
    }

    const conteudo = document.createDocumentFragment();

    conteudo.append(
        criarParagrafo(
            "Você abre o armário metálico e encontra um cartão " +
            "de acesso escondido atrás de uma caixa de ferramentas."
        )
    );

    conteudo.append(
        criarBotao(
            "PEGAR CARTÃO",
            "modal-action",
            function () {
                if (estado.cartaoEncontrado) return;

                estado.cartaoEncontrado = true;

                adicionarItem("Cartão de acesso");

                cabinet.querySelector("small").textContent = "INVESTIGADO";

                fecharModal();

                atualizarMensagem(
                    "ITEM ENCONTRADO",
                    "Você conseguiu um cartão de acesso. " +
                    "Agora investigue o terminal de segurança."
                );
            }
        )
    );

    abrirModal("INVESTIGAÇÃO", "Armário metálico", conteudo);
}


// ========================================
// TERMINAL DA SALA 01
// ========================================

terminal.addEventListener("click", investigarTerminal);

function investigarTerminal() {
    if (estado.portaAberta) {
        atualizarMensagem(
            "TERMINAL",
            "O acesso ao próximo setor já foi liberado."
        );

        return;
    }

    const conteudo = document.createDocumentFragment();

    const expressao = document.createElement("div");

    expressao.className = "logic-expression";
    expressao.textContent = "P ∧ (Q ∨ R)";

    conteudo.append(
        criarParagrafo(
            "O terminal apresenta as condições necessárias para abrir " +
            "a porta. Você precisa interpretar a expressão proposicional."
        ),
        expressao,
        criarParagrafo(
            "P = possuir o cartão; Q = descobrir a senha; " +
            "R = desativar o alarme."
        ),
        criarParagrafo(
            "Escolha um dos procedimentos para satisfazer a condição " +
            "lógica de acesso."
        )
    );

    conteudo.append(
        criarBotao(
            "INVESTIGAR SENHA",
            "modal-action",
            investigarSenhaSala01
        )
    );

    conteudo.append(
        criarBotao(
            "DESATIVAR ALARME",
            "modal-action",
            investigarAlarmeSala01
        )
    );

    conteudo.append(
        criarBotao(
            "VERIFICAR CONDIÇÕES",
            "modal-action",
            verificarCondicoesPorta
        )
    );

    abrirModal(
        "TERMINAL DE SEGURANÇA",
        "Protocolo de acesso",
        conteudo
    );

    atualizarMensagem(
        "TERMINAL DESCOBERTO",
        "A porta exige o cartão e pelo menos uma condição adicional."
    );
}


// ========================================
// CAMINHO Q — DESCOBRIR A SENHA
// ========================================

function investigarSenhaSala01() {
    if (estado.senhaDescoberta) {
        atualizarMensagem(
            "SENHA",
            "Você já descobriu a senha do primeiro terminal."
        );

        return;
    }

    const conteudo = document.createDocumentFragment();

    conteudo.append(
        criarParagrafo(
            "O sistema exige que você identifique uma expressão " +
            "que seja verdadeira para qualquer valor de P."
        )
    );

    const opcoes = [
        {
            texto: "A) P ∧ ¬P",
            correta: false
        },
        {
            texto: "B) P ∨ ¬P",
            correta: true
        },
        {
            texto: "C) P → ¬P",
            correta: false
        }
    ];

    const area = document.createElement("div");
    area.className = "logic-options";

    const feedback = document.createElement("p");
    feedback.className = "logic-feedback";
    feedback.setAttribute("aria-live", "polite");

    opcoes.forEach(function (opcao) {
        const botao = criarBotao(
            opcao.texto,
            "logic-option",
            function () {
                if (!opcao.correta) {
                    feedback.textContent =
                        "RESPOSTA INCORRETA. Analise os valores lógicos.";

                    feedback.style.color = "#ff7777";

                    return;
                }

                estado.senhaDescoberta = true;

                feedback.textContent =
                    "CORRETO! Você identificou uma tautologia.";

                feedback.style.color = "#55f2c2";

                atualizarMensagem(
                    "SENHA DESCOBERTA",
                    "Você identificou uma tautologia. A condição Q agora é verdadeira."
                );

                area.querySelectorAll("button").forEach(function (item) {
                    item.disabled = true;
                });

                const continuar = criarBotao(
                    "VOLTAR AO TERMINAL",
                    "modal-action",
                    investigarTerminal
                );

                modalBody.append(continuar);
            }
        );

        area.append(botao);
    });

    conteudo.append(area, feedback);

    abrirModal(
        "CAMINHO Q",
        "Autenticação por senha",
        conteudo
    );
}


// ========================================
// CAMINHO R — DESATIVAR O ALARME
// ========================================

function investigarAlarmeSala01() {
    if (estado.alarmeDesativado) {
        atualizarMensagem(
            "ALARME",
            "O alarme já está desativado."
        );

        return;
    }

    const conteudo = document.createDocumentFragment();

    const expressao = document.createElement("div");

    expressao.className = "logic-expression";
    expressao.textContent = "P ∧ ¬P";

    conteudo.append(
        criarParagrafo(
            "O painel solicita que você identifique o tipo de expressão " +
            "lógica apresentada."
        ),
        expressao,
        criarParagrafo(
            "Qual é a classificação da expressão P ∧ ¬P?"
        )
    );

    const area = document.createElement("div");
    area.className = "logic-options";

    const feedback = document.createElement("p");
    feedback.className = "logic-feedback";
    feedback.setAttribute("aria-live", "polite");

    const opcoes = [
        {
            texto: "A) Tautologia",
            correta: false
        },
        {
            texto: "B) Contradição",
            correta: true
        },
        {
            texto: "C) Contingência",
            correta: false
        }
    ];

    opcoes.forEach(function (opcao) {
        const botao = criarBotao(
            opcao.texto,
            "logic-option",
            function () {
                if (!opcao.correta) {
                    feedback.textContent =
                        "INCORRETO. Uma proposição não pode ser verdadeira " +
                        "e falsa simultaneamente.";

                    feedback.style.color = "#ff7777";

                    return;
                }

                estado.alarmeDesativado = true;

                feedback.textContent =
                    "CORRETO! Você identificou uma contradição e desativou o alarme.";

                feedback.style.color = "#55f2c2";

                atualizarMensagem(
                    "ALARME DESATIVADO",
                    "Você identificou a contradição P ∧ ¬P. " +
                    "A condição R agora é verdadeira."
                );

                area.querySelectorAll("button").forEach(function (item) {
                    item.disabled = true;
                });

                modalBody.append(
                    criarBotao(
                        "VOLTAR AO TERMINAL",
                        "modal-action",
                        investigarTerminal
                    )
                );
            }
        );

        area.append(botao);
    });

    conteudo.append(area, feedback);

    abrirModal(
        "CAMINHO R",
        "Painel de alarme",
        conteudo
    );
}


// ========================================
// VERIFICAR A PORTA
// ========================================

function verificarCondicoesPorta() {
    const P = estado.cartaoEncontrado;
    const Q = estado.senhaDescoberta;
    const R = estado.alarmeDesativado;

    const resultado = P && (Q || R);

    const conteudo = document.createDocumentFragment();

    const expressao = document.createElement("div");

    expressao.className = "logic-expression";
    expressao.textContent =
        `${P ? "V" : "F"} ∧ (${Q ? "V" : "F"} ∨ ${R ? "V" : "F"})`;

    conteudo.append(expressao);

    conteudo.append(
        criarParagrafo(
            `Cartão (P): ${P ? "VERDADEIRO" : "FALSO"}`
        ),
        criarParagrafo(
            `Senha (Q): ${Q ? "VERDADEIRO" : "FALSO"}`
        ),
        criarParagrafo(
            `Alarme desativado (R): ${R ? "VERDADEIRO" : "FALSO"}`
        )
    );

    const resultadoTexto = document.createElement("p");

    resultadoTexto.className = "logic-feedback";

    resultadoTexto.textContent = resultado
        ? "EXPRESSÃO VERDADEIRA. ACESSO AUTORIZADO."
        : "EXPRESSÃO FALSA. A porta continua bloqueada.";

    resultadoTexto.style.color = resultado
        ? "#55f2c2"
        : "#ff7777";

    conteudo.append(resultadoTexto);

    if (resultado) {
        conteudo.append(
            criarBotao(
                "ABRIR PORTA",
                "modal-action",
                abrirPorta
            )
        );
    }

    abrirModal(
        "VERIFICAÇÃO LÓGICA",
        "Condições de segurança",
        conteudo
    );
}


// ========================================
// ABRIR A PORTA — SALA 01
// ========================================

function abrirPorta() {
    if (estado.portaAberta) {
        return;
    }

    const P = estado.cartaoEncontrado;
    const Q = estado.senhaDescoberta;
    const R = estado.alarmeDesativado;

    // Avaliação real da expressão P ∧ (Q ∨ R).
    if (!(P && (Q || R))) {
        return;
    }

    estado.portaAberta = true;

    door.classList.add("unlocked");

    door.querySelector(".door-lock").textContent = "🔓";

    document.getElementById("door-status").textContent = "LIBERADA";

    atualizarMensagem(
        "ACESSO AUTORIZADO",
        "A expressão lógica foi satisfeita. Você liberou a primeira porta."
    );

    const conteudo = document.createDocumentFragment();

    conteudo.append(
        criarParagrafo(
            "A porta se abre lentamente. Atrás dela, você encontra " +
            "um corredor que leva a outro setor do laboratório."
        )
    );

    conteudo.append(
        criarParagrafo(
            "O próximo terminal utiliza um sistema de autenticação " +
            "baseado em tautologias."
        )
    );

    conteudo.append(
        criarBotao(
            "AVANÇAR →",
            "modal-action",
            entrarSala02
        )
    );

    abrirModal(
        "SETOR 01 CONCLUÍDO",
        "Primeira barreira superada",
        conteudo
    );
}


// ========================================
// ENTRAR NA SALA 02
// ========================================

function entrarSala02() {

    fecharModal();

    sala01.classList.add("saindo");

    setTimeout(function () {

        sala01.hidden = true;
        sala01.classList.remove("saindo");

        sala02.hidden = false;
        finalScreen.hidden = true;

        // Transferir o personagem e o aviso de interação
        room02.append(player, interactionPrompt);

        // Atualizar a sala utilizada pelo sistema de movimento
        room = room02;

        // Posicionar o personagem na nova sala
        posicionarJogadorInicial();

        teclasPressionadas.clear();
        alvoProximo = null;

        sala02.classList.remove("entrando");

        void sala02.offsetWidth;

        sala02.classList.add("entrando");

        atualizarMensagem02(
            "SETOR 02 — SERVIDORES",
            "Explore o laboratório. Encontre o terminal central e pressione E para interagir."
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }, 350);
}


// ========================================
// TERMINAL DE TAUTOLOGIA — ELEMENTOS
// ========================================

const botoesExpressoes = document.querySelectorAll(
    "#sala-02 [data-expressao]"
);

const painelVerdade = document.getElementById("painel-verdade");
const painelSenha = document.getElementById("painel-senha");

const expressaoAtual = document.getElementById("expressao-atual");

const botaoValorP = document.getElementById("valor-p");
const valorPGrande = document.getElementById("valor-p-grande");

const valorPTabela = document.getElementById("valor-p-tabela");
const valorNegacao = document.getElementById("valor-negacao");
const resultadoLogico = document.getElementById("resultado-logico");

const testeVerdadeiro = document.getElementById("teste-verdadeiro");
const testeFalso = document.getElementById("teste-falso");

const feedbackTautologia = document.getElementById("feedback-tautologia");
const botaoValidar = document.getElementById("validar-tautologia");

const formSenha = document.getElementById("form-senha");
const senhaDigitada = document.getElementById("senha-digitada");
const feedbackSenha = document.getElementById("feedback-senha");


// ========================================
// DEFINIÇÃO DAS EXPRESSÕES
// ========================================

const expressoes = {
    contradicao: {
        simbolo: "P ∧ ¬P",

        avaliar: function (P) {
            return P && !P;
        }
    },

    tautologia: {
        simbolo: "P ∨ ¬P",

        avaliar: function (P) {
            return P || !P;
        }
    },

    implicacao: {
        simbolo: "P → ¬P",

        avaliar: function (P) {
            // A → B equivale a ¬A ∨ B.
            // Neste caso: P → ¬P = ¬P ∨ ¬P.
            return !P || !P;
        }
    }
};


// ========================================
// SELECIONAR EXPRESSÃO
// ========================================

botoesExpressoes.forEach(function (botao) {
    botao.addEventListener("click", function () {
        if (estado.terminalTautologiaValidado) {
            return;
        }

        estado.expressaoSelecionada = botao.dataset.expressao;

        // Cada nova expressão exige testar os dois valores novamente.
        estado.valoresTestados.verdadeiro = false;
        estado.valoresTestados.falso = false;

        estado.valorP = true;

        botoesExpressoes.forEach(function (outroBotao) {
            outroBotao.classList.remove("selecionada");
        });

        botao.classList.add("selecionada");

        expressaoAtual.textContent =
            expressoes[estado.expressaoSelecionada].simbolo;

        painelVerdade.hidden = false;
        painelSenha.hidden = true;

        feedbackTautologia.className = "feedback";

        feedbackTautologia.textContent =
            "Teste P = V e P = F antes de validar a expressão.";

        atualizarTabelaVerdade();

        atualizarProgressoTestes();

        atualizarMensagem02(
            "EXPRESSÃO SELECIONADA",
            "Agora alterne P e observe como o resultado lógico se comporta."
        );
    });
});


// ========================================
// ALTERNAR VALOR DE P
// ========================================

botaoValorP.addEventListener("click", function () {
    if (
        !estado.expressaoSelecionada ||
        estado.terminalTautologiaValidado
    ) {
        return;
    }

    // Registrar que o valor atual foi efetivamente testado.
    registrarValorTestado();

    // Alternar entre verdadeiro e falso.
    estado.valorP = !estado.valorP;

    atualizarTabelaVerdade();

    atualizarProgressoTestes();
});


// ========================================
// REGISTRAR VALOR TESTADO
// ========================================

function registrarValorTestado() {
    if (estado.valorP) {
        estado.valoresTestados.verdadeiro = true;
    } else {
        estado.valoresTestados.falso = true;
    }
}


// ========================================
// AVALIAR EXPRESSÃO SELECIONADA
// ========================================

function avaliarExpressaoSelecionada(P) {
    if (!estado.expressaoSelecionada) {
        return false;
    }

    return expressoes[estado.expressaoSelecionada].avaliar(P);
}


// ========================================
// ATUALIZAR TABELA-VERDADE
// ========================================

function atualizarTabelaVerdade() {
    const P = estado.valorP;
    const naoP = !P;

    const resultado = avaliarExpressaoSelecionada(P);

    valorPGrande.textContent = `P = ${P ? "V" : "F"}`;

    valorPTabela.textContent = P ? "V" : "F";

    valorNegacao.textContent = naoP ? "V" : "F";

    resultadoLogico.textContent = resultado ? "V" : "F";

    resultadoLogico.style.color = resultado
        ? "#55f2c2"
        : "#ff7777";
}


// ========================================
// MOSTRAR PROGRESSO DOS TESTES
// ========================================

function atualizarProgressoTestes() {
    const testouV = estado.valoresTestados.verdadeiro;
    const testouF = estado.valoresTestados.falso;

    testeVerdadeiro.textContent = testouV
        ? "P = V · TESTADO"
        : "P = V · PENDENTE";

    testeFalso.textContent = testouF
        ? "P = F · TESTADO"
        : "P = F · PENDENTE";

    testeVerdadeiro.classList.toggle("testado", testouV);
    testeFalso.classList.toggle("testado", testouF);
}


// ========================================
// VALIDAR A TAUTOLOGIA
// ========================================

botaoValidar.addEventListener("click", validarTautologia);

function validarTautologia() {
    if (!estado.expressaoSelecionada) {
        feedbackTautologia.textContent =
            "Selecione uma expressão antes de validar.";

        feedbackTautologia.className = "feedback erro";

        return;
    }

    // Registrar o valor que está visível no momento.
    registrarValorTestado();

    atualizarProgressoTestes();

    if (
        !estado.valoresTestados.verdadeiro ||
        !estado.valoresTestados.falso
    ) {
        feedbackTautologia.textContent =
            "Você ainda não testou os dois valores de P. " +
            "Alterne P para verificar as duas possibilidades.";

        feedbackTautologia.className = "feedback erro";

        atualizarTabelaVerdade();

        return;
    }

    // Avaliar as duas linhas da tabela-verdade.
    const resultadoV = avaliarExpressaoSelecionada(true);
    const resultadoF = avaliarExpressaoSelecionada(false);

    // Uma tautologia é verdadeira em todas as possibilidades.
    const ehTautologia = resultadoV && resultadoF;

    if (!ehTautologia) {
        feedbackTautologia.textContent =
            "EXPRESSÃO REJEITADA. O resultado não é verdadeiro " +
            "para todas as possibilidades. Escolha outra expressão.";

        feedbackTautologia.className = "feedback erro";

        atualizarMensagem02(
            "EXPRESSÃO REJEITADA",
            "O sistema detectou uma expressão que não é uma tautologia."
        );

        return;
    }

    estado.terminalTautologiaValidado = true;
    estado.senhaTautologiaDescoberta = true;

    feedbackTautologia.textContent =
        "TAUTOLOGIA CONFIRMADA! O sistema revelou a senha 1010.";

    feedbackTautologia.className = "feedback sucesso";

    painelSenha.hidden = false;

    // Impedir mudanças depois da validação.
    botoesExpressoes.forEach(function (botao) {
        botao.disabled = true;
    });

    botaoValorP.disabled = true;
    botaoValidar.disabled = true;

    atualizarMensagem02(
        "TAUTOLOGIA CONFIRMADA",
        "A expressão permanece verdadeira para P = V e P = F. " +
        "A senha de acesso foi revelada."
    );

    painelSenha.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


// ========================================
// VALIDAR SENHA DA SALA 02
// ========================================

formSenha.addEventListener("submit", function (evento) {
    evento.preventDefault();

    verificarSenhaTautologia();
});

function verificarSenhaTautologia() {
    if (!estado.terminalTautologiaValidado) {
        feedbackSenha.textContent =
            "Você precisa validar a tautologia primeiro.";

        feedbackSenha.className = "feedback erro";

        return;
    }

    if (estado.senhaTautologiaDigitada) {
        return;
    }

    const senha = senhaDigitada.value.trim();

    if (senha !== SENHA_DO_TERMINAL) {
        feedbackSenha.textContent =
            "SENHA INCORRETA. Verifique os quatro dígitos e tente novamente.";

        feedbackSenha.className = "feedback erro";

        senhaDigitada.select();

        return;
    }

    estado.senhaTautologiaDigitada = true;

    feedbackSenha.textContent =
        "ACESSO AUTORIZADO! O segundo setor foi desbloqueado.";

    feedbackSenha.className = "feedback sucesso";

    senhaDigitada.disabled = true;

    document.getElementById("verificar-senha").disabled = true;

    const botaoContinuar = criarBotao(
        "CONCLUIR PROTOCOLO →",
        "primary-button",
        concluirJogo
    );

    painelSenha.append(botaoContinuar);

    atualizarMensagem02(
        "SETOR 02 DESBLOQUEADO",
        "Você resolveu o desafio de tautologia e autenticou o acesso."
    );
}


// ========================================
// CONCLUIR JOGO
// ========================================

function concluirJogo() {
    sala02.hidden = true;
    finalScreen.hidden = false;

    atualizarMensagem02(
        "PROTOCOLO CONCLUÍDO",
        "Você superou os desafios lógicos do laboratório."
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ========================================
// REINICIAR JOGO
// ========================================

restartButton.addEventListener("click", function () {
    window.location.reload();
});