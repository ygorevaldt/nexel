"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Gamepad2, Check, Loader2 } from "lucide-react";

interface PlayRequestButtonProps {
  profileId: string;
  isOwnProfile: boolean;
  hasAnyContact: boolean;
}

export function PlayRequestButton({ profileId, isOwnProfile, hasAnyContact }: PlayRequestButtonProps) {
  const { data: session, status } = useSession();
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sent' | 'loading' | 'checking'>('checking');
  const [showNoContactDialog, setShowNoContactDialog] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || isOwnProfile) return;
    fetch(`/api/play-request?to_profile_id=${profileId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.exists) {
          setRequestStatus('sent');
        } else {
          setRequestStatus('idle');
        }
      })
      .catch(() => setRequestStatus('idle'));
  }, [profileId, status, isOwnProfile]);

  if (status !== 'authenticated' || isOwnProfile) return null;
  if (requestStatus === 'checking') return null;

  const sendRequest = async () => {
    setRequestStatus('loading');
    try {
      const res = await fetch('/api/play-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_profile_id: profileId }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setRequestStatus('sent');
          return;
        }
        toast.error(json.error ?? 'Erro ao enviar interesse.');
        setRequestStatus('idle');
        return;
      }
      setRequestStatus('sent');
      toast.success('Interesse enviado! O jogador será notificado.');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
      setRequestStatus('idle');
    }
  };

  const handleClick = () => {
    if (requestStatus === 'sent') return;
    if (!hasAnyContact) {
      setShowNoContactDialog(true);
      return;
    }
    sendRequest();
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={requestStatus === 'sent' || requestStatus === 'loading'}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
          requestStatus === 'sent'
            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 cursor-default'
            : 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20'
        }`}
      >
        {requestStatus === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : requestStatus === 'sent' ? (
          <Check className="h-4 w-4" />
        ) : (
          <Gamepad2 className="h-4 w-4" />
        )}
        {requestStatus === 'sent' ? 'Interesse enviado ✓' : 'Quero jogar junto 🎮'}
      </button>

      <AlertDialog open={showNoContactDialog} onOpenChange={setShowNoContactDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Jogador sem contato cadastrado</AlertDialogTitle>
            <AlertDialogDescription>
              Este jogador ainda não cadastrou formas de contato. Você pode enviar o interesse
              mesmo assim e ele será notificado para cadastrar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowNoContactDialog(false);
                sendRequest();
              }}
            >
              Enviar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
