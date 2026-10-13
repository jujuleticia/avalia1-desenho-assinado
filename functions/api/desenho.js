import { gerarDesenho } from '../../lib/desenho.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Verificar método (O contrato exige 405 para métodos diferentes de POST, mas o pages function do tipo onRequestPost já restringe para POST, 
  // no entanto, podemos garantir as validações na ordem correta)
  
  // 2. Obter o cabeçalho Authorization
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Token ausente ou inválido", { status: 401 });
  }
  const token = authHeader.split(" ")[1];

  // 3. Ler e validar o corpo da requisição (JSON com { numero })
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response("JSON inválido ou corpo ausente", { status: 400 });
  }

  const numero = Number(body.numero);
  if (isNaN(numero) || !Number.isInteger(numero) || numero < 1 || numero > 100) {
    return new Response("Número ausente, não inteiro ou fora do intervalo de 1 a 100", { status: 400 });
  }

  // 4. Validar o token do Google no endpoint tokeninfo
  try {
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    
    if (!googleRes.ok) {
      return new Response("Token inválido ou expirado", { status: 401 });
    }

    const tokenData = await googleRes.json();

    // Validar o campo 'aud' (Client ID) e se o email foi verificado
    if (tokenData.aud !== env.GOOGLE_CLIENT_ID || tokenData.email_verified !== "true" && tokenData.email_verified !== true) {
      return new Response("Token com aud incorreto ou email não verificado", { status: 401 });
    }

    const email = tokenData.email;

    // 5. Gerar o desenho usando a função pura importada de lib/desenho.js
    const svgContent = gerarDesenho(numero, email);

    // 6. Retornar a resposta com sucesso (200) e Content-Type de imagem SVG
    return new Response(svgContent, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml"
      }
    });

  } catch (err) {
    return new Response("Erro interno ao validar o token", { status: 401 });
  }
}

// Para garantir o código 405 caso cheguem outros métodos se usar onRequest genérico, 
// mas utilizando onRequestPost o Cloudflare já trata. Se preferires um onRequest geral:
export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("Método não permitido", { status: 405 });
  }
  return onRequestPost(context);
}
