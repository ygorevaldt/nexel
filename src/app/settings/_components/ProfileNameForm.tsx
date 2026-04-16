"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

interface ProfileNameFormProps {
  initialNickname: string;
}

export function ProfileNameForm({ initialNickname }: ProfileNameFormProps) {
  const { update } = useSession();
  const [nickname, setNickname] = useState(initialNickname);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = nickname.trim();
    if (trimmed === initialNickname) return;
    if (trimmed.length < 2) {
      toast.error("O nome deve ter pelo menos 2 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao atualizar nome.");
        return;
      }

      // Refresh session so the navbar reflects the new name immediately
      await update({ name: trimmed });
      toast.success("Nome atualizado com sucesso!");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-primary" />
          Nome no Jogo
        </CardTitle>
        <CardDescription>
          Este é o nome exibido no seu perfil e no menu de navegação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Nome de exibição</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Seu nick no Free Fire"
              maxLength={50}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading || nickname.trim() === initialNickname} size="sm">
            {loading ? "Salvando..." : "Salvar nome"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
