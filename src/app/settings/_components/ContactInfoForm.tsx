"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

const WHATSAPP_REGEX = /^\(\d{2}\) \d{5}-\d{4}$/;
const DISCORD_REGEX = /^[a-zA-Z0-9._]{2,32}(#\d{4})?$/;

const ContactSchema = z.object({
  whatsapp: z
    .string()
    .refine((v) => v === "" || WHATSAPP_REGEX.test(v), { message: "Formato inválido. Use (99) 99999-9999" })
    .optional(),
  discord: z
    .string()
    .max(32, "Máximo 32 caracteres")
    .refine((v) => v === "" || DISCORD_REGEX.test(v), { message: "Formato inválido. Use usuario ou usuario#0000" })
    .optional(),
  email: z.string().email("E-mail inválido").max(100).or(z.literal("")).optional(),
  instagram: z.string().max(60, "Máximo 60 caracteres").optional(),
});

function formatWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

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
  const [errors, setErrors] = useState<Partial<Record<keyof ContactInfo, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setContactInfo((prev) => ({ ...prev, whatsapp: formatted }));
    if (errors.whatsapp) setErrors((prev) => ({ ...prev, whatsapp: undefined }));
  };

  const handleChange = (field: Exclude<keyof ContactInfo, "whatsapp">) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactInfo((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = ContactSchema.safeParse(contactInfo);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof ContactInfo, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ContactInfo;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

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
              onChange={handleWhatsAppChange}
              placeholder="(99) 99999-9999"
              maxLength={15}
              disabled={loading}
              inputMode="numeric"
            />
            {errors.whatsapp && <p className="text-xs text-red-400">{errors.whatsapp}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="discord">Discord</Label>
            <Input
              id="discord"
              value={contactInfo.discord}
              onChange={handleChange("discord")}
              placeholder="usuario ou usuario#0000"
              maxLength={32}
              disabled={loading}
            />
            {errors.discord && <p className="text-xs text-red-400">{errors.discord}</p>}
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
            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
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
