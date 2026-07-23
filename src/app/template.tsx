export default function Template({ children }: { children: React.ReactNode }) {
  // Templates re-montam a cada navegação, criando uma transição
  // de fade suave ao trocar de página (ex: Home -> Painel).
  return <div className="animate-fade-in">{children}</div>;
}
