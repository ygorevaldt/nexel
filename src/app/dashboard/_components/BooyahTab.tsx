'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, UploadCloud, Swords, Users, Crosshair, Calendar, AlertCircle } from 'lucide-react';

interface BooyahVictory {
  match_type: 'SOLO' | 'SQUAD';
  game_mode: 'RANKED_SOLO' | 'RANKED_SQUAD';
  kills: number;
  date: string;
}

interface BooyahStats {
  total: number;
  solo: number;
  squad: number;
  total_kills: number;
  avg_kills: number;
}

interface BooyahTabProps {
  victories: BooyahVictory[];
  stats: BooyahStats;
  dailyUsed: number;
  dailyLimit: number;
  onVictoryRecorded: () => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

function getResultToast(result: string, message: string) {
  switch (result) {
    case 'duplicate':
      toast.warning('Print duplicado', { description: message });
      break;
    case 'fraud':
      toast.error('Fraude detectada', { description: message });
      break;
    case 'not_ranked':
      toast.info('Partida não ranqueada', { description: message });
      break;
    case 'low_confidence':
    case 'invalid_print':
      toast.warning('Print inconclusivo', { description: message });
      break;
    case 'not_victory':
      toast.info('Não é uma vitória', { description: message });
      break;
  }
}

export function BooyahTab({ victories, stats, dailyUsed, dailyLimit, onVictoryRecorded }: BooyahTabProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | undefined>(undefined);
  const [filterYear, setFilterYear] = useState<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);

  const filteredVictories = victories.filter((v) => {
    const d = new Date(v.date);
    if (filterYear !== undefined && d.getFullYear() !== filterYear) return false;
    if (filterMonth !== undefined && d.getMonth() + 1 !== filterMonth) return false;
    return true;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`Imagem muito grande. Máximo ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    setAnalyzing(true);
    toast.info('Analisando print com IA...');

    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/me/booyah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      const json = await res.json();

      if (res.status === 409) {
        toast.warning('Print duplicado', { description: json.message });
        return;
      }

      if (res.status === 429) {
        toast.error(json.error, { description: `Limite diário: ${json.dailyLimit} envios/dia.` });
        return;
      }

      if (!res.ok) {
        getResultToast(json.result ?? 'error', json.message ?? json.error ?? 'Erro desconhecido.');
        return;
      }

      const { victory } = json as { victory: { match_type: string; kills: number } };
      toast.success('BOOYAH registrado!', {
        description: `${victory.match_type} — ${victory.kills} kills`,
        duration: 6000,
      });
      onVictoryRecorded();
    } catch {
      toast.error('Erro ao enviar print. Tente novamente.');
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col items-center justify-center text-center p-6 border-dashed border-2 hover:border-primary/50 transition-colors">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4">
            {analyzing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Trophy className="h-8 w-8" />
              </motion.div>
            ) : (
              <Trophy className="h-8 w-8" />
            )}
          </div>
          <h3 className="text-lg font-bold mb-1">{analyzing ? 'Analisando...' : 'Registrar Booyah'}</h3>
          <p className="text-sm text-muted-foreground mb-2 max-w-[16rem]">
            Envie um print da tela de resultados de uma partida ranqueada.
          </p>
          <p className={`text-xs mb-4 font-medium ${dailyRemaining === 0 ? 'text-red-400' : 'text-muted-foreground/70'}`}>
            {dailyRemaining === 0
              ? 'Limite diário atingido'
              : `${dailyUsed} de ${dailyLimit} envios hoje`}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="booyah-upload"
            disabled={analyzing || dailyRemaining === 0}
          />
          <label
            htmlFor="booyah-upload"
            className={`cursor-pointer inline-flex items-center px-6 py-2 rounded-full font-medium transition-colors text-sm ${
              analyzing || dailyRemaining === 0
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            {analyzing ? 'Processando...' : 'Enviar Print'}
          </label>
          {dailyRemaining === 0 && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Limite recarrega à meia-noite (horário de Brasília)
            </div>
          )}
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total de Vitórias', value: stats.total, icon: Trophy, color: 'text-amber-400' },
            { label: 'Vitórias Solo', value: stats.solo, icon: Swords, color: 'text-blue-400' },
            { label: 'Vitórias Squad', value: stats.squad, icon: Users, color: 'text-emerald-400' },
            { label: 'Kills p/ Vitória', value: stats.avg_kills, icon: Crosshair, color: 'text-red-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={`h-3.5 w-3.5 ${color}`} />
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* History Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Histórico de Vitórias
              </CardTitle>
              <CardDescription>
                {stats.total > 0
                  ? `${stats.total} vitória${stats.total !== 1 ? 's' : ''} registrada${stats.total !== 1 ? 's' : ''} — ${stats.total_kills} kills no total`
                  : 'Nenhuma vitória registrada ainda'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                value={filterMonth ?? ''}
                onChange={(e) => setFilterMonth(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="text-xs bg-muted/40 border border-border rounded-lg px-2 py-1.5 text-foreground"
              >
                <option value="">Todos os meses</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={filterYear ?? ''}
                onChange={(e) => setFilterYear(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="text-xs bg-muted/40 border border-border rounded-lg px-2 py-1.5 text-foreground"
              >
                <option value="">Todos os anos</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVictories.length === 0 ? (
            <div className="py-10 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">
                {victories.length === 0
                  ? 'Envie o print de uma vitória ranqueada para começar.'
                  : 'Nenhuma vitória no período selecionado.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVictories.map((v, idx) => (
                <motion.div
                  key={`${v.date}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/20 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">BOOYAH</div>
                      <div className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(v.date))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {v.match_type}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm font-bold text-red-400">
                      <Crosshair className="h-3.5 w-3.5" />
                      {v.kills}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
