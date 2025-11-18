/* Aguarda o carregamento completo do DOM antes de executar o script */
document.addEventListener('DOMContentLoaded', function () {

    /*
    ==================================================
    |                CONSTANTES E REGRAS               |
    ==================================================
    */

    const regrasBase = [
        { id: 'ref-cafe', nome: 'Café da Manhã', min: 15, max: 20 },
        { id: 'ref-lanche-manha', nome: 'Lanche da Manhã', min: 5, max: 10 },
        { id: 'ref-almoco', nome: 'Almoço', min: 30, max: 35 },
        { id: 'ref-lanche-tarde', nome: 'Lanche da Tarde', min: 10, max: 15 },
        { id: 'ref-jantar', nome: 'Jantar', min: 20, max: 25 },
        { id: 'ref-ceia', nome: 'Ceia', min: 5, max: 5 }
    ];

    const gruposFoco = {
        manha: ['ref-cafe', 'ref-lanche-manha'],
        tarde: ['ref-almoco', 'ref-lanche-tarde'],
        noite: ['ref-jantar', 'ref-ceia']
    };

    const gruposLanches = ['ref-lanche-manha', 'ref-lanche-tarde'];
    const gruposPrincipais = ['ref-cafe', 'ref-almoco', 'ref-jantar'];

    /*
    ==================================================
    |              SELETORES DE ELEMENTOS (DOM)        |
    ==================================================
    */

    // Navegação e Telas
    const navLinks = document.querySelectorAll('.nav-link');
    const telas = document.querySelectorAll('.tela');

    // Tela 1: Calculadora
    const checkboxes = document.querySelectorAll('input[name="refeicao"]');
    const btnToggleAll = document.getElementById('btn-toggle-all');
    const divPeriodoFoco = document.getElementById('periodo-foco');
    const kcalInput = document.getElementById('kcal-total');
    const btnCalcular = document.getElementById('btn-calcular');
    const listaResultados = document.getElementById('lista-resultados');
    const selectPeriodo = document.getElementById('select-periodo');
    const optManha = selectPeriodo.querySelector('option[value="manha"]');
    const optTarde = selectPeriodo.querySelector('option[value="tarde"]');
    const optNoite = selectPeriodo.querySelector('option[value="noite"]');

    // Tela 2: Classificação
    const btnClassificar = document.getElementById('btn-classificar');
    const inputPtn = document.getElementById('macro-ptn');
    const inputCho = document.getElementById('macro-cho');
    const inputLip = document.getElementById('macro-lip');
    const listaClassificacao = document.getElementById('lista-classificacao');

    // Tela 3: Proporção
    const btnCalcularPtn = document.getElementById('btn-calcular-ptn');
    const inputTela3Kcal = document.getElementById('tela3-kcal');
    const inputTela3GKg = document.getElementById('tela3-g-kg');
    const inputTela3Peso = document.getElementById('tela3-peso');
    const listaResultadosTela3 = document.getElementById('lista-resultados-tela3');

    /*
    ==================================================
    |        LÓGICA DE UI (Checkboxes e Visibilidade)  |
    ==================================================
    */

    function verificarRefeicoes() {
        const refeicoesMarcadas = Array.from(checkboxes).filter(cb => cb.checked);
        if (refeicoesMarcadas.length > 0) {
            divPeriodoFoco.style.display = 'block';
        } else {
            divPeriodoFoco.style.display = 'none';
        }

        // Filtrar Opções
        const manhaChecked = gruposFoco.manha.some(id => document.getElementById(id).checked);
        const tardeChecked = gruposFoco.tarde.some(id => document.getElementById(id).checked);
        const noiteChecked = gruposFoco.noite.some(id => document.getElementById(id).checked);

        optManha.style.display = manhaChecked ? 'block' : 'none';
        optTarde.style.display = tardeChecked ? 'block' : 'none';
        optNoite.style.display = noiteChecked ? 'block' : 'none';

        // Corrigir Seleção se ficou oculta
        const selecionadaAtualmente = selectPeriodo.value;
        const selecionadaEstaVisivel = document.querySelector(`option[value="${selecionadaAtualmente}"]`).style.display !== 'none';

        if (!selecionadaEstaVisivel) {
            if (manhaChecked) selectPeriodo.value = 'manha';
            else if (tardeChecked) selectPeriodo.value = 'tarde';
            else if (noiteChecked) selectPeriodo.value = 'noite';
        }
    }

    function toggleTodas() {
        const algumaNaoMarcada = Array.from(checkboxes).some(cb => !cb.checked);
        const novoEstado = algumaNaoMarcada; 

        checkboxes.forEach(checkbox => {
            checkbox.checked = novoEstado;
        });
        verificarRefeicoes();
    }

    /*
    ==================================================
    |             LÓGICA PRINCIPAL (TELA 1)            |
    ==================================================
    */

    function calcularDieta() {
        const kcalTotal = parseFloat(kcalInput.value);
        if (isNaN(kcalTotal) || kcalTotal <= 0) {
            alert("Por favor, insira um valor de Kcal total válido.");
            return;
        }

        const refeicoesMarcadas = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.id);

        if (refeicoesMarcadas.length === 0) {
            alert("Por favor, selecione pelo menos uma refeição.");
            return;
        }

        const focoSelecionado = selectPeriodo.value;
        listaResultados.innerHTML = ''; 

        let sugestaoCalculada = regrasBase
            .filter(regra => refeicoesMarcadas.includes(regra.id))
            .map(regra => ({ ...regra, sugestao: regra.max }));

        let percentTotalDisponivel = 100.0;
        const ceia = sugestaoCalculada.find(r => r.id === 'ref-ceia');
        if (ceia) {
            ceia.sugestao = 5.0;
            percentTotalDisponivel = 95.0; 
        }

        const refeicoesFoco = sugestaoCalculada.filter(r =>
            r.id !== 'ref-ceia' && gruposFoco[focoSelecionado].includes(r.id)
        );
        const refeicoesNonFoco = sugestaoCalculada.filter(r =>
            r.id !== 'ref-ceia' && !gruposFoco[focoSelecionado].includes(r.id)
        );

        const sumMaxNonCeia = refeicoesFoco.reduce((acc, r) => acc + r.max, 0) +
                              refeicoesNonFoco.reduce((acc, r) => acc + r.max, 0);

        if (sumMaxNonCeia < percentTotalDisponivel) {
            // Cenário 1: Déficit
            let deficit = percentTotalDisponivel - sumMaxNonCeia;
            const totalPesoFoco = refeicoesFoco.reduce((acc, r) => acc + r.max, 0);

            if (totalPesoFoco > 0) {
                refeicoesFoco.forEach(r => {
                    const proporcao = r.max / totalPesoFoco;
                    r.sugestao = r.max + (deficit * proporcao);
                });
            } else if (sugestaoCalculada.length > (ceia ? 1 : 0)) {
                const count = refeicoesFoco.length + refeicoesNonFoco.length;
                const deficitPorRefeicao = deficit / count;
                sugestaoCalculada.forEach(r => {
                    if (r.id !== 'ref-ceia') r.sugestao += deficitPorRefeicao;
                });
            }

        } else if (sumMaxNonCeia > percentTotalDisponivel) {
            // Cenário 2: Excesso
            let excessoParaRemover = sumMaxNonCeia - percentTotalDisponivel;
            const lanchesNonFoco = refeicoesNonFoco.filter(r => gruposLanches.includes(r.id));
            const principaisNonFoco = refeicoesNonFoco.filter(r => gruposPrincipais.includes(r.id));

            const removerExcesso = (lista, excesso) => {
                let excessoRestante = excesso;
                for (const r of lista) {
                    if (excessoRestante <= 0.001) break; 
                    const espacoParaRemover = r.max - r.min; 
                    const remover = Math.min(excessoRestante, espacoParaRemover);
                    r.sugestao = r.max - remover;
                    excessoRestante -= remover;
                }
                return excessoRestante; 
            };

            excessoParaRemover = removerExcesso(lanchesNonFoco, excessoParaRemover);
            if (excessoParaRemover > 0.001) {
                excessoParaRemover = removerExcesso(principaisNonFoco, excessoParaRemover);
            }
            if (excessoParaRemover > 0.001) {
                excessoParaRemover = removerExcesso(refeicoesFoco, excessoParaRemover);
            }
        }
        
        // Renderiza resultados da Tela 1
        let totalSugerido = 0;
        refeicoesMarcadas.forEach(id => {
            const li = document.createElement('li');
            const regraBase = regrasBase.find(r => r.id === id);
            const calculo = sugestaoCalculada.find(r => r.id === id);
            const { nome, min, max } = regraBase;
            const { sugestao } = calculo;
            const kcalSugestao = (kcalTotal * (sugestao / 100)).toFixed(0);

            let textoBase = (min === max) ? 
                `${nome} (${min}%):` : 
                `${nome} (${min}% a ${max}%):`;

            li.textContent = `${textoBase} --> Sugestão: ${sugestao.toFixed(1)}% - ${kcalSugestao} kcal`;
            listaResultados.appendChild(li);
            totalSugerido += sugestao;
        });

        const liTotal = document.createElement('li');
        liTotal.className = 'total';
        liTotal.textContent = `TOTAL SUGERIDO: ${totalSugerido.toFixed(1)}%`;
        listaResultados.appendChild(liTotal);
    }

    /*
    ==================================================
    |             LÓGICA PRINCIPAL (TELA 2)            |
    ==================================================
    */

    function classificarDieta() {
        listaClassificacao.innerHTML = '';

        const ptn = parseFloat(inputPtn.value) || 0;
        const cho = parseFloat(inputCho.value) || 0;
        const lip = parseFloat(inputLip.value) || 0;

        function getClassificacaoProteina(valor) {
            if (valor < 10) return "Hipoproteica (pouca proteína)";
            if (valor >= 10 && valor <= 20) return "Normoproteica (normal)";
            if (valor > 20) return "Hiperproteica (rica em proteína)";
            return "Valor inválido";
        }

        function getClassificacaoCarboidrato(valor) {
            if (valor < 45) return "Hipoglicídica (pouco carboidrato)";
            if (valor >= 45 && valor <= 60) return "Normoglicídica (normal)";
            if (valor > 60) return "Hiperglicídica (muito carboidrato)";
            return "Valor inválido";
        }

        function getClassificacaoGordura(valor) {
            if (valor < 20) return "Hipolipídica (pouca gordura)";
            if (valor >= 20 && valor <= 30) return "Normolipídica (normal)";
            if (valor > 30) return "Hiperlipídica (rica em gordura)";
            return "Valor inválido";
        }

        const resultados = [
            `Proteína: ${getClassificacaoProteina(ptn)}`,
            `Carboidrato: ${getClassificacaoCarboidrato(cho)}`,
            `Gordura: ${getClassificacaoGordura(lip)}`
        ];

        resultados.forEach(texto => {
            const li = document.createElement('li');
            li.textContent = texto;
            listaClassificacao.appendChild(li);
        });
    }

    /*
    ==================================================
    |             LÓGICA PRINCIPAL (TELA 3)            |
    ==================================================
    */

    function calcularProporcaoProteina() {
        listaResultadosTela3.innerHTML = '';

        const kcal = parseFloat(inputTela3Kcal.value) || 0;
        const gKg = parseFloat(inputTela3GKg.value) || 0;
        const peso = parseFloat(inputTela3Peso.value) || 0;

        if (kcal <= 0 || gKg <= 0 || peso <= 0) {
            alert("Por favor, preencha todos os campos com valores válidos.");
            return;
        }

        const gDiaProteina = gKg * peso;
        const y = gDiaProteina * 4; // Kcal da proteína
        const x = (y * 100) / kcal; // % da proteína

        const resultados = [
            `Gramas de Proteína/dia: ${gDiaProteina.toFixed(1)} g`,
            `Kcal da Proteína: ${y.toFixed(0)} kcal`,
            `% de Kcal da Proteína: ${x.toFixed(1)} %`
        ];

        resultados.forEach(texto => {
            const li = document.createElement('li');
            li.textContent = texto;
            listaResultadosTela3.appendChild(li);
        });
    }

    /*
    ==================================================
    |             LÓGICA DE NAVEGAÇÃO (TELAS)        |
    ==================================================
    */

    function trocarTela(event) {
        event.preventDefault(); 
        const linkClicado = event.currentTarget;
        const targetId = linkClicado.getAttribute('data-target');
        const telaAlvo = document.getElementById(targetId);

        if (!telaAlvo) return; 

        telas.forEach(tela => { tela.style.display = 'none'; });
        telaAlvo.style.display = 'block';
        navLinks.forEach(link => { link.classList.remove('active'); });
        linkClicado.classList.add('active');
    }

    /*
    ==================================================
    |              INICIALIZAÇÃO E LISTENERS           |
    ==================================================
    */

    // --- Listeners da Tela 1 ---
    btnCalcular.addEventListener('click', calcularDieta);
    btnToggleAll.addEventListener('click', toggleTodas);
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', verificarRefeicoes);
    });

    // --- Listeners da Tela 2 ---
    btnClassificar.addEventListener('click', classificarDieta);

    // --- Listeners da Tela 3 ---
    btnCalcularPtn.addEventListener('click', calcularProporcaoProteina);

    // --- Listeners da Navegação ---
    navLinks.forEach(link => {
        link.addEventListener('click', trocarTela);
    });

    // Executa uma vez no início
    verificarRefeicoes();
});