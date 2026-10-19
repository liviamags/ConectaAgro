import {
    createContext,
    ReactNode,
    useContext,
    useState,
} from 'react';

export type TipoAfiliacao = 'produtor' | 'produto';

export type Afiliacao = {
  id: string;
  tipo: TipoAfiliacao;
  entidadeId: string;
  nome: string;
  produtor: string;
  comissao: number;
  codigo: string;
  imagem: any;
};

type NovaAfiliacao = {
  tipo: TipoAfiliacao;
  entidadeId: string;
  nome: string;
  produtor: string;
  comissao: number;
  imagem: any;
};

type AfiliacaoContextType = {
  afiliacoes: Afiliacao[];
  adicionarAfiliacao: (
    afiliacao: NovaAfiliacao
  ) => void;
  removerAfiliacao: (id: string) => void;
  estaAfiliado: (
    tipo: TipoAfiliacao,
    entidadeId: string
  ) => boolean;
  buscarAfiliacao: (
    tipo: TipoAfiliacao,
    entidadeId: string
  ) => Afiliacao | undefined;
  limparAfiliacoes: () => void;
};

const AfiliacaoContext =
  createContext<AfiliacaoContextType | undefined>(
    undefined
  );

function gerarCodigo(
  tipo: TipoAfiliacao,
  entidadeId: string
) {
  const prefixo =
    tipo === 'produto' ? 'PROD' : 'PRDT';

  const parteId = entidadeId
    .replace(/-/g, '')
    .toUpperCase()
    .slice(0, 8);

  return `CA-${prefixo}-${parteId}`;
}

export function AfiliacaoProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [afiliacoes, setAfiliacoes] = useState<
    Afiliacao[]
  >([]);

  function adicionarAfiliacao(
    novaAfiliacao: NovaAfiliacao
  ) {
    setAfiliacoes((atuais) => {
      const id =
        `${novaAfiliacao.tipo}:${novaAfiliacao.entidadeId}`;

      const jaExiste = atuais.some(
        (item) => item.id === id
      );

      if (jaExiste) {
        return atuais;
      }

      const afiliacao: Afiliacao = {
        id,
        ...novaAfiliacao,
        codigo: gerarCodigo(
          novaAfiliacao.tipo,
          novaAfiliacao.entidadeId
        ),
      };

      return [...atuais, afiliacao];
    });
  }

  function removerAfiliacao(id: string) {
    setAfiliacoes((atuais) =>
      atuais.filter((item) => item.id !== id)
    );
  }

  function estaAfiliado(
    tipo: TipoAfiliacao,
    entidadeId: string
  ) {
    return afiliacoes.some(
      (item) =>
        item.tipo === tipo &&
        item.entidadeId === entidadeId
    );
  }

  function buscarAfiliacao(
    tipo: TipoAfiliacao,
    entidadeId: string
  ) {
    return afiliacoes.find(
      (item) =>
        item.tipo === tipo &&
        item.entidadeId === entidadeId
    );
  }

  function limparAfiliacoes() {
    setAfiliacoes([]);
  }

  return (
    <AfiliacaoContext.Provider
      value={{
        afiliacoes,
        adicionarAfiliacao,
        removerAfiliacao,
        estaAfiliado,
        buscarAfiliacao,
        limparAfiliacoes,
      }}
    >
      {children}
    </AfiliacaoContext.Provider>
  );
}

export function useAfiliacao() {
  const context = useContext(
    AfiliacaoContext
  );

  if (!context) {
    throw new Error(
      'useAfiliacao deve ser usado dentro de AfiliacaoProvider'
    );
  }

  return context;
}