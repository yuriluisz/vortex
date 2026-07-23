/**
 * Redireciona os tipos do @prisma/client diretamente para o cliente gerado.
 * Necessário porque o Turbopack do Next.js 16 não consegue seguir a cadeia
 * de re-exports: @prisma/client → .prisma/client/default → .prisma/client/index
 */
declare module "@prisma/client" {
  export * from ".prisma/client";
}