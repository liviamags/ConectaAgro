import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from 'react';

export type ProdutoCarrinho = {
  id: string;
  nome: string;
  produtor: string;
  preco: number;
  quantidade: number;
  imagem: any;

  // Campos novos. São opcionais para manter compatibilidade
  // com todas as telas que já adicionam produtos normais.
  tipo?: 'produto' | 'excedente';
  produto_id?: string;
  excedente_id?: string;
  produtor_id?: string;
  quantidade_maxima?: number;
};

type CartContextType = {
  itens: ProdutoCarrinho[];
  adicionarProduto: (produto: ProdutoCarrinho) => void;
  removerProduto: (id: string) => void;
  alterarQuantidade: (id: string, quantidade: number) => void;
  limparCarrinho: () => void;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [itens, setItens] = useState<ProdutoCarrinho[]>([]);

  function adicionarProduto(produto: ProdutoCarrinho) {
    setItens((itensAtuais) => {
      const produtoExistente = itensAtuais.find(
        (item) => item.id === produto.id
      );

      if (produtoExistente) {
        const novaQuantidade =
          produtoExistente.quantidade + produto.quantidade;

        const quantidadeFinal =
          produto.quantidade_maxima !== undefined
            ? Math.min(novaQuantidade, produto.quantidade_maxima)
            : novaQuantidade;

        return itensAtuais.map((item) =>
          item.id === produto.id
            ? {
                ...item,
                ...produto,
                quantidade: quantidadeFinal,
              }
            : item
        );
      }

      const quantidadeInicial =
        produto.quantidade_maxima !== undefined
          ? Math.min(produto.quantidade, produto.quantidade_maxima)
          : produto.quantidade;

      return [
        ...itensAtuais,
        {
          ...produto,
          quantidade: quantidadeInicial,
        },
      ];
    });
  }

  function removerProduto(id: string) {
    setItens((itensAtuais) =>
      itensAtuais.filter((item) => item.id !== id)
    );
  }

  function alterarQuantidade(
    id: string,
    quantidade: number
  ) {
    if (quantidade < 1) {
      removerProduto(id);
      return;
    }

    setItens((itensAtuais) =>
      itensAtuais.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const quantidadeFinal =
          item.quantidade_maxima !== undefined
            ? Math.min(quantidade, item.quantidade_maxima)
            : quantidade;

        return {
          ...item,
          quantidade: quantidadeFinal,
        };
      })
    );
  }

  function limparCarrinho() {
    setItens([]);
  }

  return (
    <CartContext.Provider
      value={{
        itens,
        adicionarProduto,
        removerProduto,
        alterarQuantidade,
        limparCarrinho,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      'useCart deve ser usado dentro de CartProvider'
    );
  }

  return context;
}
