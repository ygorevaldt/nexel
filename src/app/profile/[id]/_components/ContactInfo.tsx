"use client";

import { useState } from "react";
import { MessageCircle, Mail, Shield, AtSign, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ContactInfoProps {
  contactInfo: {
    discord?: string;
    whatsapp?: string;
    email?: string;
    instagram?: string;
  };
}

function normalizeWhatsapp(raw: string): string {
  return raw.replace(/\D/g, "");
}

function ContactRow({
  href,
  onClick,
  colorClass,
  icon: Icon,
  label,
  value,
  actionIcon: ActionIcon,
}: {
  href?: string;
  onClick?: () => void;
  colorClass: string;
  icon: React.ElementType;
  label: string;
  value: string;
  actionIcon: React.ElementType;
}) {
  const inner = (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-opacity hover:opacity-80 ${colorClass}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
      <ActionIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {inner}
    </button>
  );
}

export function ContactInfo({ contactInfo }: ContactInfoProps) {
  const [discordCopied, setDiscordCopied] = useState(false);

  const handleCopyDiscord = async () => {
    if (!contactInfo.discord) return;
    try {
      await navigator.clipboard.writeText(contactInfo.discord);
      setDiscordCopied(true);
      toast.success("Discord copiado!");
      setTimeout(() => setDiscordCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const hasAny =
    contactInfo.whatsapp || contactInfo.email || contactInfo.discord || contactInfo.instagram;

  if (!hasAny) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Jogador não informou dados de contato ainda.
      </p>
    );
  }

  return (
    <div className="space-y-3 flex flex-col gap-2">
      {contactInfo.whatsapp && (
        <ContactRow
          href={`https://wa.me/${normalizeWhatsapp(contactInfo.whatsapp)}`}
          colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          icon={MessageCircle}
          label="WhatsApp"
          value={contactInfo.whatsapp}
          actionIcon={ExternalLink}
        />
      )}
      {contactInfo.email && (
        <ContactRow
          href={`mailto:${contactInfo.email}`}
          colorClass="bg-blue-500/10 border-blue-500/20 text-blue-400"
          icon={Mail}
          label="E-mail"
          value={contactInfo.email}
          actionIcon={ExternalLink}
        />
      )}
      {contactInfo.discord && (
        <ContactRow
          onClick={handleCopyDiscord}
          colorClass="bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
          icon={Shield}
          label="Discord — clique para copiar"
          value={contactInfo.discord}
          actionIcon={discordCopied ? Check : Copy}
        />
      )}
      {contactInfo.instagram && (
        <ContactRow
          href={`https://instagram.com/${contactInfo.instagram}`}
          colorClass="bg-pink-500/10 border-pink-500/20 text-pink-400"
          icon={AtSign}
          label="Instagram"
          value={`@${contactInfo.instagram}`}
          actionIcon={ExternalLink}
        />
      )}
    </div>
  );
}
