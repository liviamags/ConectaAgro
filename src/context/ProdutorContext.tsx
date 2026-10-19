import {
  createContext,

  ReactNode,

  useContext,

  useEffect,

  useMemo,

  useState,
} from 'react';

import { supabase } from '../lib/supabase';

export type ProdutoProdutor = {

  id: string;

  nome: string;

  categoria: string;

  preco: number;

  unidade: string;

  estoque: number;

  descricao: string;

  ativo: boolean;

  imagem: any;

};

export type StatusPedido =

  | 'Novo'

  | 'Confirmado'

  | 'Em preparo'

  | 'Pronto'

  | 'Concluído'

  | 'Cancelado';

export type ItemPedido = {

  id: string;

  produtoId: string;

  nome: string;

  quantidade: number;

  unidade: string;

  precoUnitario: number;

};

export type PedidoProdutor = {

  id: string;

  numero: string;

  cliente: string;

  telefone: string;

  data: string;

  hora: string;

  itens: ItemPedido[];

  total: number;

  formaPagamento: string;

  tipoRecebimento: 'Retirada' | 'Entrega';

  endereco?: string;

  observacao?: string;

  status: StatusPedido;

};

export type ExcedenteProdutor = {

  id: string;

  produtoId: string;

  nome: string;

  categoria: string;

  precoOriginal: number;

  precoExcedente: number;

  unidade: string;

  quantidadeDisponivel: number;

  motivo: string;

  prazo: string;

  ativo: boolean;

  imagem: any;

};

export type PublicacaoProdutor = {

  id: string;

  texto: string;

  imagem: any;

  data: string;

  curtidas: number;

  comentarios: number;

};

export type PerfilProdutor = {

  id: string;

  nome: string;

  propriedade: string;

  localizacao: string;

  categoria: string;

  descricao: string;

  comissao: number;

  imagem: any;

};

type NovoProduto = Omit<ProdutoProdutor, 'id'>;

type NovoExcedente = Omit<ExcedenteProdutor, 'id'>;

type NovaPublicacao = Omit<PublicacaoProdutor, 'id' | 'curtidas' | 'comentarios'>;

type ProdutorContextType = {

  produtos: ProdutoProdutor[];

  produtosAtivos: ProdutoProdutor[];

  pedidos: PedidoProdutor[];

  pedidosNovos: PedidoProdutor[];

  excedentes: ExcedenteProdutor[];

  excedentesAtivos: ExcedenteProdutor[];

  publicacoesProdutor: PublicacaoProdutor[];

  perfilProdutor: PerfilProdutor;

  adicionarProduto: (produto: NovoProduto) => void;

  editarProduto: (id: string, dados: Partial<ProdutoProdutor>) => void;

  excluirProduto: (id: string) => void;

  alternarProdutoAtivo: (id: string) => void;

  buscarProduto: (id: string) => ProdutoProdutor | undefined;

  buscarPedido: (id: string) => PedidoProdutor | undefined;

  alterarStatusPedido: (id: string, status: StatusPedido) => void;

  adicionarExcedente: (excedente: NovoExcedente) => void;

  editarExcedente: (id: string, dados: Partial<ExcedenteProdutor>) => void;

  excluirExcedente: (id: string) => void;

  alternarExcedenteAtivo: (id: string) => void;

  buscarExcedente: (id: string) => ExcedenteProdutor | undefined;

  adicionarPublicacao: (publicacao: NovaPublicacao) => void;

  editarPublicacao: (id: string, dados: Partial<PublicacaoProdutor>) => void;

  excluirPublicacao: (id: string) => void;

  buscarPublicacao: (id: string) => PublicacaoProdutor | undefined;

  editarPerfilProdutor: (dados: Partial<PerfilProdutor>) => void;

};

const ProdutorContext = createContext<ProdutorContextType | undefined>(undefined);

function perfilVazio(userId: string): PerfilProdutor {

  return {

    id: userId,

    nome: '',

    propriedade: '',

    localizacao: '',

    categoria: '',

    descricao: '',

    comissao: 0,

    imagem: null,

  };

}

function criarId(prefixo: string): string {

  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

}

function ProdutorProviderDaConta({

  children,

  userId,

}: {

  children: ReactNode;

  userId: string | null;

}) {

  const [produtos, setProdutos] = useState<ProdutoProdutor[]>([]);

  const [pedidos, setPedidos] = useState<PedidoProdutor[]>([]);

  const [excedentes, setExcedentes] = useState<ExcedenteProdutor[]>([]);

  const [publicacoesProdutor, setPublicacoesProdutor] = useState<PublicacaoProdutor[]>([]);

  const [perfilProdutor, setPerfilProdutor] = useState<PerfilProdutor>(() => perfilVazio(userId ?? ''));

  useEffect(() => {

    let ativo = true;

    if (!userId) return;

    async function carregarPerfil() {

      const [perfilResposta, produtorResposta] = await Promise.all([

        supabase.from('profiles').select('nome').eq('id', userId).maybeSingle(),

        supabase

          .from('produtores')

          .select('nome_fazenda, cidade, estado, descricao, tipo_producao, imagem_url')

          .eq('id', userId)

          .maybeSingle(),

      ]);

      if (!ativo) return;

      if (perfilResposta.error) console.log('Erro ao buscar nome do produtor:', perfilResposta.error);

      if (produtorResposta.error) console.log('Erro ao buscar propriedade:', produtorResposta.error);

      const perfil = perfilResposta.data;

      const produtor = produtorResposta.data;

      const localizacao = [produtor?.cidade, produtor?.estado].filter(Boolean).join(', ');

      setPerfilProdutor((anterior) => ({

        ...anterior,

        id: userId ?? '',

        nome: perfil?.nome ?? '',

        propriedade: produtor?.nome_fazenda ?? '',

        localizacao,

        categoria: produtor?.tipo_producao ?? '',

        descricao: produtor?.descricao ?? '',

        imagem: produtor?.imagem_url ? { uri: produtor.imagem_url } : null,

      }));

    }

    carregarPerfil().catch((erro) => console.log('Erro ao carregar perfil do contexto:', erro));

    return () => { ativo = false; };

  }, [userId]);

  function adicionarProduto(produto: NovoProduto) {

    setProdutos((atuais) => [{ ...produto, id: criarId('produto') }, ...atuais]);

  }

  function editarProduto(id: string, dados: Partial<ProdutoProdutor>) {

    setProdutos((atuais) => atuais.map((item) => item.id === id ? { ...item, ...dados } : item));

  }

  function excluirProduto(id: string) {

    setProdutos((atuais) => atuais.filter((item) => item.id !== id));

    setExcedentes((atuais) => atuais.filter((item) => item.produtoId !== id));

  }

  function alternarProdutoAtivo(id: string) {

    setProdutos((atuais) => atuais.map((item) => item.id === id ? { ...item, ativo: !item.ativo } : item));

  }

  function buscarProduto(id: string) { return produtos.find((item) => item.id === id); }

  function buscarPedido(id: string) { return pedidos.find((item) => item.id === id); }

  function alterarStatusPedido(id: string, status: StatusPedido) {

    setPedidos((atuais) => atuais.map((item) => item.id === id ? { ...item, status } : item));

  }

  function adicionarExcedente(excedente: NovoExcedente) {

    setExcedentes((atuais) => [{ ...excedente, id: criarId('excedente') }, ...atuais]);

  }

  function editarExcedente(id: string, dados: Partial<ExcedenteProdutor>) {

    setExcedentes((atuais) => atuais.map((item) => item.id === id ? { ...item, ...dados } : item));

  }

  function excluirExcedente(id: string) {

    setExcedentes((atuais) => atuais.filter((item) => item.id !== id));

  }

  function alternarExcedenteAtivo(id: string) {

    setExcedentes((atuais) => atuais.map((item) => item.id === id ? { ...item, ativo: !item.ativo } : item));

  }

  function buscarExcedente(id: string) { return excedentes.find((item) => item.id === id); }

  function adicionarPublicacao(publicacao: NovaPublicacao) {

    setPublicacoesProdutor((atuais) => [{ ...publicacao, id: criarId('publicacao'), curtidas: 0, comentarios: 0 }, ...atuais]);

  }

  function editarPublicacao(id: string, dados: Partial<PublicacaoProdutor>) {

    setPublicacoesProdutor((atuais) => atuais.map((item) => item.id === id ? { ...item, ...dados } : item));

  }

  function excluirPublicacao(id: string) {

    setPublicacoesProdutor((atuais) => atuais.filter((item) => item.id !== id));

  }

  function buscarPublicacao(id: string) { return publicacoesProdutor.find((item) => item.id === id); }

  function editarPerfilProdutor(dados: Partial<PerfilProdutor>) {

    setPerfilProdutor((atual) => ({ ...atual, ...dados, id: userId ?? '' }));

  }

  const produtosAtivos = useMemo(() => produtos.filter((item) => item.ativo), [produtos]);

  const pedidosNovos = useMemo(() => pedidos.filter((item) => item.status === 'Novo'), [pedidos]);

  const excedentesAtivos = useMemo(() => excedentes.filter((item) => item.ativo), [excedentes]);

  return (

    <ProdutorContext.Provider value={{

      produtos, produtosAtivos, pedidos, pedidosNovos,

      excedentes, excedentesAtivos, publicacoesProdutor, perfilProdutor,

      adicionarProduto, editarProduto, excluirProduto, alternarProdutoAtivo, buscarProduto,

      buscarPedido, alterarStatusPedido,

      adicionarExcedente, editarExcedente, excluirExcedente, alternarExcedenteAtivo, buscarExcedente,

      adicionarPublicacao, editarPublicacao, excluirPublicacao, buscarPublicacao,

      editarPerfilProdutor,

    }}>

      {children}

    </ProdutorContext.Provider>

  );

}

export function ProdutorProvider({ children }: { children: ReactNode }) {

  const [userId, setUserId] = useState<string | null>(null);

  const [verificandoSessao, setVerificandoSessao] = useState(true);

  useEffect(() => {

    let ativo = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, sessao) => {

      if (!ativo) return;

      setUserId(sessao?.user?.id ?? null);

      setVerificandoSessao(false);

    });

    supabase.auth.getSession().then(({ data, error }) => {

      if (!ativo) return;

      if (error) console.log('Erro ao consultar sessão:', error);

      setUserId((atual) => atual ?? data.session?.user?.id ?? null);

      setVerificandoSessao(false);

    }).catch((erro) => {

      if (!ativo) return;

      console.log('Erro ao carregar sessão do produtor:', erro);

      setVerificandoSessao(false);

    });

    return () => { ativo = false; subscription.unsubscribe(); };

  }, []);

  if (verificandoSessao) return null;

  return <ProdutorProviderDaConta key={userId ?? 'anonimo'} userId={userId}>{children}</ProdutorProviderDaConta>;

}

export function useProdutor() {

  const context = useContext(ProdutorContext);

  if (!context) throw new Error('useProdutor precisa ser usado dentro de ProdutorProvider.');

  return context;

}
