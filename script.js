// Conversão de número para extenso
function numeroPorExtenso(num) {
    const u = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const t = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const d = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const c = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

    function conv(n) {
        if (n === 0) return "";
        if (n < 10) return u[n];
        if (n < 20) return t[n - 10];
        if (n < 100) return d[Math.floor(n / 10)] + (n % 10 ? " e " + u[n % 10] : "");
        if (n === 100) return "cem";
        return c[Math.floor(n / 100)] + (n % 100 ? " e " + conv(n % 100) : "");
    }

    let inteiro = Math.floor(num);
    let centavos = Math.round((num - inteiro) * 100);
    let texto = conv(inteiro);
    
    if (centavos > 0) {
        texto += " e " + conv(centavos) + " centavo" + (centavos > 1 ? "s" : "");
    }
    
    return texto + (inteiro === 1 && centavos === 0 ? " real" : " reais");
}

// Mês por extenso
function mesPorExtenso(mes) {
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", 
                   "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return meses[mes];
}

// Gerar recibo
function gerarRecibo(isPreview = false) {
    const valorInput = parseFloat(document.getElementById("valor").value);
    if (!valorInput || valorInput <= 0) {
        if (!isPreview) alert("Informe um valor válido.");
        return;
    }

    const valorFormatado = valorInput.toLocaleString("pt-BR", { 
        style: "currency", 
        currency: "BRL" 
    });
    const valorExtenso = numeroPorExtenso(valorInput);
    
    const pagador = document.getElementById("pagador").value;
    const referente = document.getElementById("referente").value;
    const formaPag = document.getElementById("formaPagamento").value;
    
    let dataInput = document.getElementById("data").value || new Date().toISOString().split("T")[0];
    const [ano, mes, dia] = dataInput.split("-");
    const dataObj = new Date(ano, mes - 1, dia);
    const dataFormatada = `Itapetininga, ${parseInt(dia)} de ${mesPorExtenso(dataObj.getMonth())} de ${ano}`;

    // Numeração sequencial
    let seq = parseInt(localStorage.getItem(`recibo_seq_${ano}`) || "0");
    if (!isPreview) {
        seq += 1;
        localStorage.setItem(`recibo_seq_${ano}`, seq);
    }
    const numeroRecibo = `${ano}/${String(seq).padStart(3, "0")}`;

    // Texto do recibo
    const reciboTexto = `Para maior clareza e para os devidos fins de direito, firmo(amos) o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo <strong>quitação plena, geral, irrevogável e para todos os fins de direito</strong> pela quantia recebida.`;

    // Preencher campos
    document.getElementById("reciboNumero").innerHTML = `<strong>Recibo nº ${numeroRecibo}</strong>`;
    document.getElementById("pagadorNome").textContent = pagador || "_________________________";
    document.getElementById("valorFormatado").textContent = valorFormatado;
    document.getElementById("valorExtenso").textContent = valorExtenso;
    document.getElementById("referenteTexto").textContent = referente || "_________________________";
    document.getElementById("formaPagTexto").textContent = formaPag;
    document.getElementById("reciboTexto").innerHTML = reciboTexto;
    document.getElementById("reciboData").textContent = dataFormatada;

    // Mostrar recibo
    document.getElementById("reciboContainer").style.display = "block";
    document.getElementById("botoesAcao").style.display = "flex";

    // Salvar no histórico (apenas se não for preview)
    if (!isPreview && pagador && referente) {
        salvarHistorico(numeroRecibo, valorFormatado, pagador, referente, dataFormatada);
    }
}

// Salvar no histórico
function salvarHistorico(numero, valor, pagador, referente, data) {
    let h = JSON.parse(localStorage.getItem("recibosHistorico") || "[]");
    h.unshift({
        numero: numero,
        valor: valor,
        pagador: pagador.substring(0, 35),
        referente: referente,
        data: data
    });
    if (h.length > 10) h.pop();
    localStorage.setItem("recibosHistorico", JSON.stringify(h));
    atualizarHistorico();
}

// Gerar PDF
function gerarPDF() {
    const el = document.getElementById("reciboContainer");
    if (!el || el.style.display === "none") {
        alert("Gere o recibo primeiro.");
        return;
    }

    const numero = document.getElementById("reciboNumero").innerText.replace(/[^0-9/]/g, "").replace("/", "-");
    
    const opt = {
        margin: [0, 0, 0, 0],
        filename: `Recibo_${numero}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            letterRendering: true,
            scrollY: 0
        },
        jsPDF: { 
            unit: "mm", 
            format: "a4", 
            orientation: "portrait",
            compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(el).save();
}

// Atualizar histórico na tela
function atualizarHistorico() {
    const lista = document.getElementById("historicoLista");
    const h = JSON.parse(localStorage.getItem("recibosHistorico") || "[]");
    
    if (h.length === 0) {
        lista.innerHTML = '<p class="text-slate-500 text-sm">Nenhum recibo gerado ainda.</p>';
        return;
    }

    lista.innerHTML = h.map((r, i) => `
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <p class="font-semibold text-slate-800 text-sm">${r.numero}</p>
                    <p class="text-slate-600 text-xs mt-1">${r.pagador}</p>
                    <p class="text-slate-500 text-xs">${r.referente}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-blue-600 text-sm">${r.valor}</p>
                    <p class="text-slate-400 text-xs mt-1">${r.data.split(',')[0]}</p>
                </div>
            </div>
        </div>
    `).join("");
}

// Limpar tudo
function limparTudo() {
    document.getElementById("valor").value = "";
    document.getElementById("pagador").selectedIndex = 0;
    document.getElementById("referente").selectedIndex = 0;
    document.getElementById("data").value = "";
    document.getElementById("formaPagamento").selectedIndex = 0;
    document.getElementById("reciboContainer").style.display = "none";
    document.getElementById("botoesAcao").style.display = "none";
}

// Inicialização
window.onload = function() {
    // Definir data atual
    const dataInput = document.getElementById("data");
    if (!dataInput.value) {
        dataInput.value = new Date().toISOString().slice(0, 10);
    }

    // Auto-gerar preview
    const inputs = document.querySelectorAll('#valor, #pagador, #referente, #data, #formaPagamento');
    inputs.forEach(i => {
        i.addEventListener('input', () => gerarRecibo(true));
        i.addEventListener('change', () => gerarRecibo(true));
    });

    // Carregar histórico
    atualizarHistorico();
};
