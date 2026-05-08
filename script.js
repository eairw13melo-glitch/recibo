function numeroPorExtenso(num) {
  const u = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const t = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const d = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const c = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function conv(n) {
    if (n === 0) return "";
    if (n < 10) return u[n];
    if (n < 20) return t[n-10];
    if (n < 100) return d[Math.floor(n/10)] + (n%10 ? " e " + u[n%10] : "");
    if (n === 100) return "cem";
    return c[Math.floor(n/100)] + (n%100 ? " e " + conv(n%100) : "");
  }

  let inteiro = Math.floor(num);
  let centavos = Math.round((num - inteiro) * 100);
  let texto = conv(inteiro);
  if (centavos > 0) texto += " e " + conv(centavos) + " centavo" + (centavos > 1 ? "s" : "");
  return texto + (inteiro === 1 && centavos === 0 ? " real" : " reais");
}

function mesPorExtenso(mes) {
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  return meses[mes];
}

function gerarRecibo(isPreview = false) {
  const valorInput = parseFloat(document.getElementById("valor").value);
  if (!valorInput || valorInput <= 0) return alert("Informe um valor válido.");

  const valorFormatado = valorInput.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const valorExtenso = numeroPorExtenso(valorInput);
  const pagador = document.getElementById("pagador").value;
  const referente = document.getElementById("referente").value;
  const formaPag = document.getElementById("formaPagamento").value;

  let dataInput = document.getElementById("data").value || new Date().toISOString().split("T")[0];
  const [ano, mes, dia] = dataInput.split("-");
  const dataObj = new Date(ano, mes - 1, dia);
  const dataFormatada = `Itapetininga, ${parseInt(dia)} de ${mesPorExtenso(dataObj.getMonth())} de ${ano}`;

  let seq = parseInt(localStorage.getItem(`recibo_seq_${ano}`) || "0") + (isPreview ? 0 : 1);
  if (!isPreview) localStorage.setItem(`recibo_seq_${ano}`, seq);
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
    // salvar histórico...
    let h = JSON.parse(localStorage.getItem("recibosHistorico") || "[]");
    h.unshift({numero: numeroRecibo, valor: valorFormatado, pagador: pagador.substring(0,35), referente, data: dataFormatada});
    if (h.length > 10) h.pop();
    localStorage.setItem("recibosHistorico", JSON.stringify(h));
    atualizarHistorico();
  }
}

function gerarPDF() {
  const el = document.getElementById("reciboContainer");
  if (!el || el.style.display === "none") return alert("Gere o recibo primeiro.");

  const numero = document.getElementById("reciboNumero").innerText.replace(/[^0-9/]/g, "").replace("/", "-");

  html2pdf().set({
    margin: [15, 12, 80, 12],
    filename: `Recibo_${numero}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 3, useCORS: true, letterRendering: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  }).from(el).save();
}

function atualizarHistorico() {
  // ... (mantido simples)
  console.log("Histórico atualizado");
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
  const dataInput = document.getElementById("data");
  if (!dataInput.value) dataInput.value = new Date().toISOString().slice(0,10);

  const inputs = document.querySelectorAll('#valor, #pagador, #referente, #data, #formaPagamento');
  inputs.forEach(i => i.addEventListener('input', () => gerarRecibo(true)));
};
