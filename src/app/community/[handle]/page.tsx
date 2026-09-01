import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Globe, Camera, Play, MessageCircle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Perfil - Comunidade Vórtex" };

export default async function CommunityProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  const user = await prisma.user.findUnique({
    where: { handle },
    include: {
      templates: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { likes: true, usages: true } },
        },
      },
    },
  });

  if (!user || !user.publicProfile) {
    notFound();
  }

  const links = (user.profileLinks as Record<string, string> | null) ?? {};

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-3xl font-bold mb-4 ring-2 ring-white/10 text-white">
            {user.displayName?.[0] ?? user.email[0].toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold text-white">{user.displayName ?? "Anônimo"}</h1>
          <p className="text-neutral-400 mt-1">@{user.handle}</p>
          {user.bio && (
            <p className="text-neutral-300 mt-4 max-w-lg leading-relaxed">{user.bio}</p>
          )}

          {/* Social Links */}
          <div className="flex items-center gap-4 mt-6">
            {links.website && (
              <a href={links.website} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors" title="Website">
                <Globe className="w-5 h-5" />
              </a>
            )}
            {links.instagram && (
              <a href={links.instagram} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors" title="Instagram">
                <Camera className="w-5 h-5" />
              </a>
            )}
            {links.youtube && (
              <a href={links.youtube} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors" title="YouTube">
                <Play className="w-5 h-5" />
              </a>
            )}
            {links.whatsapp && (
              <a href={links.whatsapp.startsWith("http") ? links.whatsapp : `https://wa.me/${links.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors" title="WhatsApp">
                <MessageCircle className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Templates Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-white">
            Templates Publicados ({user.templates.length})
          </h2>
          {user.templates.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p>Nenhum template publicado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/templates/${template.slug}`}
                  className="group border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden hover:border-primary/40 hover:shadow-2xl transition-all"
                >
                  <div className="aspect-[4/3] bg-black flex items-center justify-center p-4 border-b border-white/10">
                    <span className="text-4xl font-bold text-neutral-600">
                      {template.name[0]}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate text-white group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                      <span>{template._count.usages} usos</span>
                      <span>{template._count.likes} curtidas</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}