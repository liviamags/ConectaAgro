import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';

export type TipoNotificacao = 'pedido' | 'produto' | 'excedente' | 'produtor' | 'afiliacao' | 'sistema';
export type PublicoNotificacao = 'consumidor' | 'produtor';
export type Notificacao = {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  tempo: string;
  lida: boolean;
  rota?: string;
};

type NotificacoesContextType = {
  notificacoes: Notificacao[];
  quantidadeNaoLidas: number;
  marcarComoLida: (id: string) => void;
  marcarTodasComoLidas: () => void;
  removerNotificacao: (id: string) => void;
  notificacoesProdutor: Notificacao[];
  quantidadeNaoLidasProdutor: number;
  marcarComoLidaProdutor: (id: string) => void;
  marcarTodasComoLidasProdutor: () => void;
  removerNotificacaoProdutor: (id: string) => void;
};

const NotificacoesContext = createContext<NotificacoesContextType | undefined>(undefined);

type RegistroNotificacao = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  rota: string | null;
  lida: boolean;
  created_at: string;
};

function formatarTempo(data: string): string {
  const diferenca = Math.max(0, Date.now() - new Date(data).getTime());
  const minutos = Math.floor(diferenca / 60000);
  if (minutos < 1) return 'Agora';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? 'Ontem' : `${dias} dias`;
}

function normalizarTipo(tipo: string): TipoNotificacao {
  const tipos: TipoNotificacao[] = ['pedido', 'produto', 'excedente', 'produtor', 'afiliacao', 'sistema'];
  return tipos.includes(tipo as TipoNotificacao) ? tipo as TipoNotificacao : 'sistema';
}

function converterRegistro(registro: RegistroNotificacao): Notificacao {
  return {
    id: registro.id,
    tipo: normalizarTipo(registro.tipo),
    titulo: registro.titulo,
    mensagem: registro.mensagem,
    tempo: formatarTempo(registro.created_at),
    lida: registro.lida,
    rota: registro.rota ?? undefined,
  };
}

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notificacoesProdutor, setNotificacoesProdutor] = useState<Notificacao[]>([]);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function atualizarUsuario() {
      const { data, error } = await supabase.auth.getUser();
      if (!ativo) return;
      if (error || !data.user) {
        setUsuarioId(null);
        setNotificacoes([]);
        setNotificacoesProdutor([]);
        return;
      }
      setUsuarioId(data.user.id);
    }

    atualizarUsuario();
    const { data: authListener } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      if (!ativo) return;
      setUsuarioId(sessao?.user.id ?? null);
      setNotificacoes([]);
      setNotificacoesProdutor([]);
    });
    return () => {
      ativo = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!usuarioId) return;
    let ativo = true;

    async function carregar() {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('id, tipo, titulo, mensagem, rota, lida, created_at')
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!ativo) return;
      if (error) {
        console.log('Erro ao carregar notificações:', error);
        return;
      }
      const registros = (data ?? []) as RegistroNotificacao[];
      const lista = registros.map(converterRegistro);
      setNotificacoes(lista.filter((item) => !item.rota?.startsWith('/area-produtor/')));
      setNotificacoesProdutor(lista.filter((item) => item.rota?.startsWith('/area-produtor/')));
    }

    carregar();
    const intervalo = setInterval(carregar, 20000);
    const appListener = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') carregar();
    });
    return () => {
      ativo = false;
      clearInterval(intervalo);
      appListener.remove();
    };
  }, [usuarioId]);

  async function atualizarLida(ids: string[], lida: boolean) {
    if (!usuarioId || ids.length === 0) return;
    const { error } = await supabase.from('notificacoes')
      .update({ lida })
      .eq('usuario_id', usuarioId)
      .in('id', ids);
    if (error) console.log('Erro ao marcar notificações:', error);
  }

  async function excluir(id: string) {
    if (!usuarioId) return;
    const { error } = await supabase.from('notificacoes')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('id', id);
    if (error) console.log('Erro ao remover notificação:', error);
  }

  function marcarComoLida(id: string) {
    setNotificacoes((lista) => lista.map((item) => item.id === id ? { ...item, lida: true } : item));
    void atualizarLida([id], true);
  }

  function marcarTodasComoLidas() {
    const ids = notificacoes.filter((item) => !item.lida).map((item) => item.id);
    setNotificacoes((lista) => lista.map((item) => ({ ...item, lida: true })));
    void atualizarLida(ids, true);
  }

  function removerNotificacao(id: string) {
    setNotificacoes((lista) => lista.filter((item) => item.id !== id));
    void excluir(id);
  }

  function marcarComoLidaProdutor(id: string) {
    setNotificacoesProdutor((lista) => lista.map((item) => item.id === id ? { ...item, lida: true } : item));
    void atualizarLida([id], true);
  }

  function marcarTodasComoLidasProdutor() {
    const ids = notificacoesProdutor.filter((item) => !item.lida).map((item) => item.id);
    setNotificacoesProdutor((lista) => lista.map((item) => ({ ...item, lida: true })));
    void atualizarLida(ids, true);
  }

  function removerNotificacaoProdutor(id: string) {
    setNotificacoesProdutor((lista) => lista.filter((item) => item.id !== id));
    void excluir(id);
  }

  return (
    <NotificacoesContext.Provider value={{
      notificacoes,
      quantidadeNaoLidas: notificacoes.filter((item) => !item.lida).length,
      marcarComoLida,
      marcarTodasComoLidas,
      removerNotificacao,
      notificacoesProdutor,
      quantidadeNaoLidasProdutor: notificacoesProdutor.filter((item) => !item.lida).length,
      marcarComoLidaProdutor,
      marcarTodasComoLidasProdutor,
      removerNotificacaoProdutor,
    }}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  const contexto = useContext(NotificacoesContext);
  if (!contexto) throw new Error('useNotificacoes deve ser usado dentro de NotificacoesProvider');
  return contexto;
}
