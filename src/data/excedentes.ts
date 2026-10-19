export type Excedente = {
  id: string;
  produtoId: string;
  nome: string;
  produtorId: string;
  produtor: string;
  localizacao: string;
  categoria: string;
  precoOriginal: number;
  precoExcedente: number;
  unidade: string;
  quantidadeDisponivel: number;
  motivo: string;
  prazo: string;
  imagem: any;
};

export const excedentes: Excedente[] = [
  {
    id: 'exc-tomate',
    produtoId: 'tomate',
    nome: 'Tomate',
    produtorId: 'jose-marcos',
    produtor: 'Sítio do José',
    localizacao: 'Contagem, MG',
    categoria: 'Hortaliças',
    precoOriginal: 6.9,
    precoExcedente: 3.9,
    unidade: 'Kg',
    quantidadeDisponivel: 12,
    motivo:
      'Excesso de produção desta colheita. Os tomates estão próprios para consumo e precisam ser comercializados rapidamente.',
    prazo: 'Retirada em até 2 dias',
    imagem: require('../../assets/images/tomate.jpg'),
  },
  {
    id: 'exc-alface',
    produtoId: 'alface',
    nome: 'Alface crespa',
    produtorId: 'maria-tereza',
    produtor: 'Horta da Maria',
    localizacao: 'Contagem, MG',
    categoria: 'Hortaliças',
    precoOriginal: 3.9,
    precoExcedente: 2.5,
    unidade: 'Unidade',
    quantidadeDisponivel: 18,
    motivo:
      'Parte da produção não foi vendida na feira. As alfaces continuam frescas e próprias para consumo.',
    prazo: 'Retirada até amanhã',
    imagem: require('../../assets/images/alface.jpg'),
  },
  {
    id: 'exc-banana',
    produtoId: 'banana',
    nome: 'Banana',
    produtorId: 'joao-silva',
    produtor: 'Fazenda São José',
    localizacao: 'Betim, MG',
    categoria: 'Frutas',
    precoOriginal: 6.5,
    precoExcedente: 4.2,
    unidade: 'Kg',
    quantidadeDisponivel: 20,
    motivo:
      'A colheita produziu uma quantidade maior que a demanda prevista para esta semana.',
    prazo: 'Retirada em até 3 dias',
    imagem: require('../../assets/images/banana.jpg'),
  },
  {
    id: 'exc-cenoura',
    produtoId: 'cenoura',
    nome: 'Cenoura',
    produtorId: 'lucia-ferreira',
    produtor: 'Sítio Recanto Verde',
    localizacao: 'Contagem, MG',
    categoria: 'Hortaliças',
    precoOriginal: 5.5,
    precoExcedente: 3.5,
    unidade: 'Kg',
    quantidadeDisponivel: 9,
    motivo:
      'Algumas cenouras ficaram fora do padrão de tamanho comercial, mas mantêm qualidade e condições adequadas para consumo.',
    prazo: 'Retirada em até 2 dias',
    imagem: require('../../assets/images/cenoura.jpg'),
  },
  {
    id: 'exc-maca',
    produtoId: 'maca',
    nome: 'Maçã',
    produtorId: 'ana-paula',
    produtor: 'Sítio Vale Natural',
    localizacao: 'Contagem, MG',
    categoria: 'Frutas',
    precoOriginal: 8.9,
    precoExcedente: 5.9,
    unidade: 'Kg',
    quantidadeDisponivel: 15,
    motivo:
      'Sobra de um lote comercializado durante a semana. As frutas continuam próprias para consumo.',
    prazo: 'Retirada em até 3 dias',
    imagem: require('../../assets/images/maca.jpg'),
  },
  {
    id: 'exc-abobora',
    produtoId: 'abobora',
    nome: 'Abóbora',
    produtorId: 'helena-souza',
    produtor: 'Horta Esperança',
    localizacao: 'Betim, MG',
    categoria: 'Legumes',
    precoOriginal: 5.9,
    precoExcedente: 3.9,
    unidade: 'Kg',
    quantidadeDisponivel: 25,
    motivo:
      'A produção desta colheita foi superior ao esperado e há unidades disponíveis além da demanda habitual.',
    prazo: 'Retirada em até 4 dias',
    imagem: require('../../assets/images/abobora.jpg'),
  },
  {
    id: 'exc-melancia',
    produtoId: 'melancia',
    nome: 'Melancia',
    produtorId: 'joao-silva',
    produtor: 'Fazenda São José',
    localizacao: 'Betim, MG',
    categoria: 'Frutas',
    precoOriginal: 5.5,
    precoExcedente: 3.7,
    unidade: 'Kg',
    quantidadeDisponivel: 30,
    motivo:
      'Grande volume colhido no mesmo período. O produtor disponibilizou parte da produção como excedente.',
    prazo: 'Retirada em até 3 dias',
    imagem: require('../../assets/images/melancia.jpg'),
  },
  {
    id: 'exc-paes',
    produtoId: 'paes',
    nome: 'Pães artesanais',
    produtorId: 'pedro-e-juliana',
    produtor: 'Fazenda Raízes da Terra',
    localizacao: 'Contagem, MG',
    categoria: 'Artesanais',
    precoOriginal: 9.9,
    precoExcedente: 6.9,
    unidade: 'Unidade',
    quantidadeDisponivel: 8,
    motivo:
      'Foram produzidas unidades extras para uma encomenda. Os pães excedentes estão disponíveis para retirada.',
    prazo: 'Retirada hoje',
    imagem: require('../../assets/images/paes.jpg'),
  },
];

export function calcularDesconto(
  precoOriginal: number,
  precoExcedente: number
) {
  return Math.round(
    ((precoOriginal - precoExcedente) / precoOriginal) * 100
  );
}

export function formatarPreco(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}