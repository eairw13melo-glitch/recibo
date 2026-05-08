// ====================== VALOR POR EXTENSO ======================
function numeroPorExtenso(num) {
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function converter(n) {
    if (n === 0) return "";
    if (n < 10) return unidades[n];
    if (n < 20) return teens[n-10];
    if (n < 100) return dezenas[Math.floor(n/10)] + (n%10 ? " e " + unidades[n%10] : "");
    if (n === 100) return "cem";
    return centenas[Math.floor(n/100)] + (n%100 ? " e " + converter(n%100) : "");
  }

  let inteiro = Math.floor(num);
  let centavos = Math.round((num - inteiro) * 100);
  let texto = converter(inteiro);
  if (centavos > 0) texto += " e " + converter(centavos) + " centavo" + (centavos > 1 ? "s" : "");
  return texto + (inteiro === 1 && centavos === 0 ? " real" : " reais");
}

function mesPorExtenso(mes) {
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  return meses[mes];
}

function gerarRecibo(isPreview = false) {
  const valorInput = parseFloat(document.getElementById("valor").value);
  if (!valorInput || valorInput <= 0) {
    if (!isPreview) alert("⚠️ Informe um valor válido.");
    return;
  }

  const valorFormatado = valorInput.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const valorExtenso = numeroPorExtenso(valorInput);

  const pagador = document.getElementById("pagador").value;
  const referente = document.getElementById("referente").value;
  const formaPag = document.getElementById("formaPagamento").value;

  let dataInput = document.getElementById("data").value;
  if (!dataInput) {
    const hoje = new Date();
    dataInput = hoje.toISOString().split("T")[0];
    document.getElementById("data").value = dataInput;
  }

  const [ano, mes, dia] = dataInput.split("-");
  const dataObj = new Date(ano, mes - 1, dia);
  const dataFormatada = `Itapetininga, ${parseInt(dia)} de ${mesPorExtenso(dataObj.getMonth())} de ${ano}`;

  let seq = parseInt(localStorage.getItem(`recibo_seq_${ano}`) || "0");
  if (!isPreview) seq++;
  localStorage.setItem(`recibo_seq_${ano}`, seq);
  const numeroRecibo = `${ano}/${String(seq).padStart(3, "0")}`;

  const reciboHTML = `
    Recebi(emos) de <strong>${pagador}</strong>, a importância de <strong>${valorFormatado}</strong> 
    (${valorExtenso}), correspondente à <strong>${referente}</strong>, 
    paga através de <strong>${formaPag}</strong>.<br><br>
    Para maior clareza e para os devidos fins de direito, firmo(amos) o presente recibo, 
    que comprova o recebimento integral do valor mencionado, concedendo 
    <strong>quitação plena, geral, irrevogável e para todos os fins de direito</strong> pela quantia recebida.
  `;

  document.getElementById("reciboNumero").innerHTML = `<strong>Recibo nº ${numeroRecibo}</strong>`;
  document.getElementById("valorFormatado").innerText = valorFormatado;
  document.getElementById("reciboTexto").innerHTML = reciboHTML;
  document.getElementById("reciboData").innerText = dataFormatada;

  document.getElementById("reciboContainer").style.display = "block";

  if (!isPreview) {
    salvarNoHistorico(numeroRecibo, valorFormatado, pagador, referente, dataFormatada);
    atualizarHistorico();
  }
}

// ====================== PDF COM MARGENS EXATAS SOLICITADAS ======================
function gerarPDF() {
  const element = document.getElementById("reciboContainer");
  if (!element || element.style.display === "none") {
    alert("❌ Primeiro gere o recibo antes de baixar o PDF.");
    return;
  }

  const numero = document.getElementById("reciboNumero").innerText.replace(/[^0-9/]/g, "").replace("/", "-");

  const opt = {
    margin: [15, 12, 80, 12],     // ← Margens exatas que você pediu
    filename: `Recibo_${numero}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 3, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };

  html2pdf().set(opt).from(element).save();
}

function salvarNoHistorico(numero, valor, pagador, referente, data) {
  let historico = JSON.parse(localStorage.getItem("recibosHistorico") || "[]");
  historico.unshift({ numero, valor, pagador: pagador.substring(0, 35) + (pagador.length > 35 ? "..." : ""), referente, data, timestamp: Date.now() });
  if (historico.length > 10) historico.pop();
  localStorage.setItem("recibosHistorico", JSON.stringify(historico));
}

function atualizarHistorico() {
  const lista = document.getElementById("historicoLista");
  const historico = JSON.parse(localStorage.getItem("recibosHistorico") || "[]");
  lista.innerHTML = historico.map(r => `
    <div onclick="carregarRecibo('${r.numero}')" class="bg-white border border-gray-200 rounded-2xl p-4 cursor-pointer hover:shadow-md transition">
      <div class="flex justify-between text-sm">
        <span class="font-mono">${r.numero}</span>
        <span class="font-semibold">${r.valor}</span>
      </div>
      <div class="text-xs text-gray-500 mt-2">${r.data}</div>
      <div class="text-sm font-medium mt-1">${r.pagador}</div>
      <div class="text-xs text-gray-600 mt-1 line-clamp-2">${r.referente}</div>
    </div>
  `).join("") || '<p class="text-gray-400 col-span-full text-center py-6">Nenhum recibo gerado ainda</p>';
}

function carregarRecibo(numero) {
  alert(`🔄 Recibo ${numero} selecionado!`);
}

function limparTudo() {
  document.getElementById("valor").value = "";
  document.getElementById("pagador").selectedIndex = 0;
  document.getElementById("referente").selectedIndex = 0;
  document.getElementById("data").value = "";
  document.getElementById("formaPagamento").selectedIndex = 0;
  document.getElementById("reciboContainer").style.display = "none";
}

window.onload = function() {
  tailwind.config = { content: ["./**/*.{html,js}"] };

  const dataInput = document.getElementById("data");
  if (!dataInput.value) {
    const hoje = new Date();
    dataInput.value = hoje.toISOString().slice(0,10);
  }

  const inputs = document.querySelectorAll('#valor, #pagador, #referente, #data, #formaPagamento');
  inputs.forEach(input => {
    input.addEventListener('input', () => gerarRecibo(true));
    input.addEventListener('change', () => gerarRecibo(true));
  });

  atualizarHistorico();
};
