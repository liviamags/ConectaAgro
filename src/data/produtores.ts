export type Produtor = {
  id: string;
  nome: string;
  propriedade: string;
  localizacao: string;
  categoria: string;
  imagem: any;
  descricao: string;
  produtos: string[];
  comissao: number;
  latitude: number;
  longitude: number;
};

export const produtores: Produtor[] = [
  {
    id: 'jose-marcos',
    nome: 'José Marcos',
    propriedade: 'Sítio do José',
    localizacao: 'Contagem, MG',
    categoria: 'Hortaliças e legumes',
    imagem: require('../../assets/images/prod1.jpg'),
    descricao:
      'José trabalha com a produção de hortaliças e legumes frescos, valorizando a agricultura local e a venda direta ao consumidor.',
    produtos: ['tomate', 'abobora'],
    comissao: 8,
    latitude: -19.9326,
    longitude: -44.0538,
  },
  {
    id: 'maria-tereza',
    nome: 'Maria Tereza',
    propriedade: 'Horta da Maria',
    localizacao: 'Contagem, MG',
    categoria: 'Verduras e hortaliças',
    imagem: require('../../assets/images/prod2.jpg'),
    descricao:
      'Maria cultiva verduras e hortaliças frescas e busca aproximar sua produção dos consumidores da região.',
    produtos: ['alface', 'cenoura'],
    comissao: 7,
    latitude: -19.9258,
    longitude: -44.0714,
  },
  {
    id: 'joao-silva',
    nome: 'João Silva',
    propriedade: 'Fazenda São José',
    localizacao: 'Betim, MG',
    categoria: 'Frutas',
    imagem: require('../../assets/images/prod3.jpg'),
    descricao:
      'João trabalha com produção de frutas, oferecendo alimentos frescos diretamente de sua propriedade.',
    produtos: ['banana', 'melancia'],
    comissao: 8,
    latitude: -19.9678,
    longitude: -44.1987,
  },
  {
    id: 'ana-paula',
    nome: 'Ana Paula',
    propriedade: 'Sítio Vale Natural',
    localizacao: 'Contagem, MG',
    categoria: 'Frutas e produtos artesanais',
    imagem: require('../../assets/images/prod4.jpg'),
    descricao:
      'Ana Paula trabalha com frutas e alimentos artesanais, valorizando a produção em pequena escala.',
    produtos: ['maca', 'biscoitos'],
    comissao: 10,
    latitude: -19.9473,
    longitude: -44.0872,
  },
  {
    id: 'lucia-ferreira',
    nome: 'Lúcia Ferreira',
    propriedade: 'Sítio Recanto Verde',
    localizacao: 'Contagem, MG',
    categoria: 'Hortaliças',
    imagem: require('../../assets/images/prod5.jpg'),
    descricao:
      'Lúcia dedica sua produção ao cultivo de hortaliças frescas e à comercialização local.',
    produtos: ['alface', 'tomate'],
    comissao: 7,
    latitude: -19.9145,
    longitude: -44.0371,
  },
  {
    id: 'helena-souza',
    nome: 'Helena Souza',
    propriedade: 'Horta Esperança',
    localizacao: 'Betim, MG',
    categoria: 'Verduras e legumes',
    imagem: require('../../assets/images/prod6.jpg'),
    descricao:
      'Helena cultiva verduras e legumes e acredita na aproximação entre pequenos produtores e consumidores.',
    produtos: ['cenoura', 'abobora'],
    comissao: 8,
    latitude: -19.9477,
    longitude: -44.1842,
  },
  {
    id: 'carla-mendes',
    nome: 'Carla Mendes',
    propriedade: 'Fazenda Boa Terra',
    localizacao: 'Contagem, MG',
    categoria: 'Frutas e hortaliças',
    imagem: require('../../assets/images/prod7.jpg'),
    descricao:
      'Carla trabalha com produção diversificada de frutas e hortaliças.',
    produtos: ['maca', 'alface'],
    comissao: 9,
    latitude: -19.9536,
    longitude: -44.0431,
  },
  {
    id: 'antonio-rocha',
    nome: 'Antônio Rocha',
    propriedade: 'Sítio Serra Verde',
    localizacao: 'Ibirité, MG',
    categoria: 'Frutas e café',
    imagem: require('../../assets/images/prod8.jpg'),
    descricao:
      'Antônio trabalha com produção rural em pequena escala, incluindo frutas e café artesanal.',
    produtos: ['cafe', 'banana'],
    comissao: 10,
    latitude: -20.0217,
    longitude: -44.0587,
  },
  {
    id: 'paulo-henrique',
    nome: 'Paulo Henrique',
    propriedade: 'Fazenda Santa Clara',
    localizacao: 'Contagem, MG',
    categoria: 'Produção rural',
    imagem: require('../../assets/images/prod9.jpg'),
    descricao:
      'Paulo atua na produção rural local, buscando fortalecer a comercialização direta.',
    produtos: ['carnebovina'],
    comissao: 6,
    latitude: -19.9397,
    longitude: -44.1125,
  },
  {
    id: 'marcos-e-rosa',
    nome: 'Marcos e Rosa',
    propriedade: 'Sítio Família Oliveira',
    localizacao: 'Contagem, MG',
    categoria: 'Hortaliças e legumes',
    imagem: require('../../assets/images/prod10.jpg'),
    descricao:
      'Marcos e Rosa trabalham juntos na propriedade da família.',
    produtos: ['tomate', 'cenoura'],
    comissao: 8,
    latitude: -19.9038,
    longitude: -44.0661,
  },
  {
    id: 'carlos-e-mariana',
    nome: 'Carlos e Mariana',
    propriedade: 'Horta Família Santos',
    localizacao: 'Betim, MG',
    categoria: 'Verduras e alimentos naturais',
    imagem: require('../../assets/images/prod11.jpg'),
    descricao:
      'Carlos e Mariana administram juntos a produção familiar.',
    produtos: ['alface', 'abobora'],
    comissao: 8,
    latitude: -19.9823,
    longitude: -44.1698,
  },
  {
    id: 'pedro-e-juliana',
    nome: 'Pedro e Juliana',
    propriedade: 'Fazenda Raízes da Terra',
    localizacao: 'Contagem, MG',
    categoria: 'Frutas e produtos artesanais',
    imagem: require('../../assets/images/prod12.jpg'),
    descricao:
      'Pedro e Juliana trabalham juntos na produção familiar.',
    produtos: ['banana', 'paes'],
    comissao: 10,
    latitude: -19.9631,
    longitude: -44.0749,
  },
];

export function buscarProdutor(id: string) {
  return produtores.find((produtor) => produtor.id === id);
}