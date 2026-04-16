"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

interface ContactInfo {
  discord: string;
  whatsapp: string;
  email: string;
  instagram: string;
}

interface ContactInfoFormProps {
  initialContactInfo: ContactInfo;
}

export function ContactInfoForm({ initialContactInfo }: ContactInfoFormProps) {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(initialContactInfo);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ContactInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: Partial<ContactInfo> = {};
    for (const key of Object.keys(contactInfo) as (keyof ContactInfo)[]) {
      const value = contactInfo[key].trim();
      payload[key] = value || undefined;
    }

    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_info: payload }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao atualizar contato.");
        return;
      }

      toast.success("Informações de contato atualizadas!");
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
          <MessageCircle className="h-4 w-4 text-primary" />
          Informações de Contato
        </CardTitle>
        <CardDescription>
          Visíveis apenas para usuários com plano Scout. Preencha os campos que quiser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={contactInfo.whatsapp}
              onChange={handleChange("whatsapp")}
              placeholder="Ex: +55 11 99999-9999"
              maxLength={20}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail de contato</Label>
            <Input
              id="email"
              type="email"
              value={contactInfo.email}
              onChange={handleChange("email")}
              placeholder="seuemail@exemplo.com"
              maxLength={100}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discord">Discord</Label>
            <Input
              id="discord"
              value={contactInfo.discord}
              onChange={handleChange("discord")}
              placeholder="usuario#0000 ou nome de usuário"
              maxLength={100}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={contactInfo.instagram}
              onChange={handleChange("instagram")}
              placeholder="@seuusuario (sem o @)"
              maxLength={60}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Salvando..." : "Salvar contato"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
