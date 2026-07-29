export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("Iniciando workers no processo do Next.js...");
    // Importa dinamicamente para garantir que só rode no Node.js e não no Edge
    await import("./workers/index");
  }
}
