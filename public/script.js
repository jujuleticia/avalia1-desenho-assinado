import { numeroValido } from "./desenho.js";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let svgAtual = "";
let googleIdToken = "";

window.handleCredentialResponse = function(response) {
  googleIdToken = response.credential;
  mensagem.textContent = "Autenticado com sucesso pelo Google!";
  mensagem.style.color = "green";
};

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";
  mensagem.style.color = "";

  const numero = Number(campoNumero.value);

  if (!numeroValido(numero)) {
    mensagem.textContent = "Digite um inteiro entre 1 e 100.";
    return;
  }
  if (!googleIdToken) {
    mensagem.textContent = "Por favor, faça login com o Google antes de desenhar.";
    return;
  }

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ numero, token: googleIdToken })
    });

    if (resposta.status === 400) {
      mensagem.textContent = "Erro 400: Número inválido fornecido.";
      return;
    }
    if (resposta.status === 401) {
      mensagem.textContent = "Erro 401: Falha na autenticação ou token inválido.";
      return;
    }
    if (!resposta.ok) {
      mensagem.textContent = "Ocorreu um erro no servidor.";
      return;
    }

    const dados = await resposta.json();
    svgAtual = dados.svg;
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch (erro) {
    mensagem.textContent = "Erro de conexão com o servidor.";
  }
});

botaoBaixar.addEventListener("click", () => {
  if (!svgAtual) return;
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "desenho-assinado.svg";
  link.click();
  URL.revokeObjectURL(url);
});
