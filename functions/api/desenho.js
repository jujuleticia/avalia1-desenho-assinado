import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { numero, token } = body;

    if (!numeroValido(numero)) {
      return new Response(JSON.stringify({ error: "Número inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!token) {
      return new Response(JSON.stringify({ error: "Token ausente" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!googleResponse.ok) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const tokenData = await googleResponse.json();
    const email = tokenData.email;

    if (env.GOOGLE_CLIENT_ID && tokenData.aud !== env.GOOGLE_CLIENT_ID) {
      return new Response(JSON.stringify({ error: "Client ID não corresponde" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const svg = gerarDesenho(Number(numero), email);

    return new Response(JSON.stringify({ svg, email }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno no servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("Método não permitido", { status: 405 });
  }
}
