"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  UserCheck,
  Mail,
  Loader2,
  Crown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  inviteTeamMemberAction,
  removeTeamMemberAction,
  getTeamMembersAction,
} from "@/app/admin/team-actions";

interface MemberItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  avatarUrl: string | null;
  isOwner: boolean;
  joinedAt: string;
}

export function TeamSettingsTab() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadMembers = () => {
    setLoading(true);
    getTeamMembersAction()
      .then((res) => setMembers(res as MemberItem[]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await inviteTeamMemberAction(email, role);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg(`Convite enviado com sucesso para ${email}!`);
        setEmail("");
        loadMembers();
      }
    });
  };

  const handleRemove = (memberId: string, memberEmail: string) => {
    if (!confirm(`Tem certeza de que deseja remover ${memberEmail} da equipe?`)) return;

    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await removeTeamMemberAction(memberId);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMsg("Membro removido da equipe com sucesso.");
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Card: Convidar Membro */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Convidar Membro</h3>
            <p className="text-xs text-muted-foreground">
              Adicione colaboradores a este workspace.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-xs text-destructive font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
            className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none shrink-0"
          >
            <option value="MEMBER">Membro</option>
            <option value="ADMIN">Admin</option>
          </select>

          <button
            type="submit"
            disabled={isPending || !email}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-md shadow-primary/20 shrink-0"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            <span>Convidar</span>
          </button>
        </form>
      </div>

      {/* Card: Lista de Membros da Equipe */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Membros</h3>
              <p className="text-xs text-muted-foreground">
                Colaboradores com acesso ao workspace.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-xs">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando membros...</span>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-foreground font-bold text-sm border border-white/10 flex-shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {member.name}
                      </span>
                      {member.isOwner ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Crown className="w-3 h-3" />
                          Dono
                        </span>
                      ) : member.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-white/10 text-muted-foreground">
                          <UserCheck className="w-3 h-3" />
                          Membro
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                </div>

                {!member.isOwner && (
                  <button
                    type="button"
                    onClick={() => handleRemove(member.id, member.email)}
                    disabled={isPending}
                    title="Remover Membro"
                    className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
