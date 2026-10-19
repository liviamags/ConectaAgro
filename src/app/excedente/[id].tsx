import { Ionicons } from '@expo/vector-icons';

import { router, useLocalSearchParams } from 'expo-router';

import { useEffect, useState } from 'react';

import {
  ActivityIndicator,

  Alert,

  Image,

  ScrollView,

  StyleSheet,

  Text,

  TouchableOpacity,

  View,
} from 'react-native';



import { useCart } from '../../context/CartContext';

import { supabase } from '../../lib/supabase';



type ExcedenteDetalhes = {

  id: string;

  produtor_id: string;

  produto_id: string;

  quantidade: number;

  preco_promocional: number;

  data_validade: string | null;

  observacao: string | null;

  ativo: boolean;

  produto: {

    nome: string;

    categoria: string | null;

    preco: number;

    unidade: string | null;

    imagem_url: string | null;

  };

  produtor_nome: string;

};



function formatarPreco(valor: number) {

  return `R$ ${valor.toFixed(2).replace('.', ',')}`;

}



function calcularDesconto(precoOriginal: number, precoPromocional: number) {

  if (precoOriginal <= 0 || precoPromocional >= precoOriginal) {

    return 0;

  }



  return Math.round(

    ((precoOriginal - precoPromocional) / precoOriginal) * 100

  );

}



function formatarValidade(data: string | null) {

  if (!data) {

    return 'Não informada';

  }



  const partes = data.split('-');



  if (partes.length !== 3) {

    return data;

  }



  return `${partes[2]}/${partes[1]}/${partes[0]}`;

}



export default function ExcedenteDetalhesScreen() {

  const { id } = useLocalSearchParams<{ id: string }>();

  const { adicionarProduto } = useCart();



  const [excedente, setExcedente] =

    useState<ExcedenteDetalhes | null>(null);

  const [quantidade, setQuantidade] = useState(1);

  const [carregando, setCarregando] = useState(true);

  const [erro, setErro] = useState('');



  useEffect(() => {

    carregarExcedente();

  }, [id]);



  async function carregarExcedente() {

    try {

      setCarregando(true);

      setErro('');



      if (!id) {

        setExcedente(null);

        return;

      }



      const { data, error } = await supabase

        .from('excedentes')

        .select(`

          id,

          produtor_id,

          produto_id,

          quantidade,

          preco_promocional,

          data_validade,

          observacao,

          ativo,

          produto:produtos!excedentes_produto_id_fkey (

            nome,

            categoria,

            preco,

            unidade,

            imagem_url

          )

        `)

        .eq('id', id)

        .eq('ativo', true)

        .maybeSingle();



      if (error) {

        console.log('Erro ao carregar excedente:', error);

        setErro('Não foi possível carregar este excedente.');

        setExcedente(null);

        return;

      }



      if (!data) {

        setExcedente(null);

        return;

      }



      const produtoRelacao = Array.isArray(data.produto)

        ? data.produto[0]

        : data.produto;



      if (!produtoRelacao) {

        setErro('Não foi possível carregar o produto deste excedente.');

        setExcedente(null);

        return;

      }



      let produtorNome = 'Produtor local';



      const { data: produtoresPublicos, error: produtoresError } =

        await supabase.rpc('listar_produtores_publicos');



      if (produtoresError) {

        console.log('Erro ao carregar produtor:', produtoresError);

      } else {

        const produtorEncontrado = (produtoresPublicos ?? []).find(

          (produtor: any) =>
            String(produtor.id) === String(data.produtor_id)

        );



        if (produtorEncontrado?.nome) {

          produtorNome = String(produtorEncontrado.nome);

        }

      }



      setExcedente({

        id: data.id,

        produtor_id: data.produtor_id,

        produto_id: data.produto_id,

        quantidade: Number(data.quantidade),

        preco_promocional: Number(data.preco_promocional),

        data_validade: data.data_validade,

        observacao: data.observacao,

        ativo: data.ativo,

        produto: {

          nome: produtoRelacao.nome,

          categoria: produtoRelacao.categoria,

          preco: Number(produtoRelacao.preco),

          unidade: produtoRelacao.unidade,

          imagem_url: produtoRelacao.imagem_url,

        },

        produtor_nome: produtorNome,

      });



      setQuantidade(1);

    } catch (e) {

      console.log('Erro inesperado ao carregar excedente:', e);

      setErro('Não foi possível carregar este excedente.');

      setExcedente(null);

    } finally {

      setCarregando(false);

    }

  }



  function diminuirQuantidade() {

    setQuantidade((atual) => Math.max(1, atual - 1));

  }



  function aumentarQuantidade() {

    if (!excedente) {

      return;

    }



    setQuantidade((atual) =>

      Math.min(excedente.quantidade, atual + 1)

    );

  }



  function adicionarAoCarrinho() {

    if (!excedente) {

      return;

    }



    adicionarProduto({

      id: `excedente-${excedente.id}`,

      tipo: 'excedente',

      produto_id: excedente.produto_id,

      excedente_id: excedente.id,

      produtor_id: excedente.produtor_id,

      nome: `${excedente.produto.nome} - Excedente`,

      produtor: excedente.produtor_nome,

      preco: excedente.preco_promocional,

      quantidade,

      quantidade_maxima: excedente.quantidade,

      imagem: excedente.produto.imagem_url

        ? { uri: excedente.produto.imagem_url }

        : null,

    });



    Alert.alert(

      'Adicionado ao carrinho',

      `${quantidade} ${unidade} de ${excedente.produto.nome} foi adicionado ao carrinho.`,

      [

        {

          text: 'Continuar vendo',

          style: 'cancel',

        },

        {

          text: 'Ver carrinho',

          onPress: () => router.push('/carrinho'),

        },

      ]

    );

  }



  if (carregando) {

    return (

      <View style={styles.errorContainer}>

        <ActivityIndicator size="large" color="#004B0A" />

        <Text style={styles.errorTitle}>

          Carregando excedente...

        </Text>

      </View>

    );

  }



  if (!excedente) {

    return (

      <View style={styles.errorContainer}>

        <Ionicons

          name={erro ? 'alert-circle-outline' : 'leaf-outline'}

          size={45}

          color="#004B0A"

        />



        <Text style={styles.errorTitle}>

          {erro || 'Excedente não encontrado'}

        </Text>



        <TouchableOpacity

          style={styles.errorButton}

          onPress={() => router.back()}

        >

          <Text style={styles.errorButtonText}>

            Voltar

          </Text>

        </TouchableOpacity>

      </View>

    );

  }



  const desconto = calcularDesconto(

    excedente.produto.preco,

    excedente.preco_promocional

  );



  const economia =

    excedente.produto.preco - excedente.preco_promocional;



  const unidade = excedente.produto.unidade ?? 'un.';



  return (

    <View style={styles.container}>

      <ScrollView

        showsVerticalScrollIndicator={false}

        contentContainerStyle={styles.scrollContent}

      >

        <View style={styles.imageContainer}>

          {excedente.produto.imagem_url ? (

            <Image

              source={{ uri: excedente.produto.imagem_url }}

              style={styles.image}

              resizeMode="cover"

            />

          ) : (

            <View

              style={[

                styles.image,

                {

                  alignItems: 'center',

                  justifyContent: 'center',

                  backgroundColor: '#E7F1E8',

                },

              ]}

            >

              <Ionicons

                name="image-outline"

                size={50}

                color="#7F9B82"

              />

            </View>

          )}



          <TouchableOpacity

            style={styles.backButton}

            onPress={() => router.back()}

          >

            <Ionicons

              name="chevron-back"

              size={27}

              color="#004B0A"

            />

          </TouchableOpacity>



          {desconto > 0 && (

            <View style={styles.discountBadge}>

              <Text style={styles.discountText}>

                -{desconto}%

              </Text>

            </View>

          )}

        </View>



        <View style={styles.content}>

          <View style={styles.excessBadge}>

            <Ionicons

              name="leaf-outline"

              size={14}

              color="#004B0A"

            />



            <Text style={styles.excessBadgeText}>

              Excedente

            </Text>

          </View>



          <Text style={styles.productName}>

            {excedente.produto.nome}

          </Text>



          {excedente.produto.categoria && (

            <Text

              style={{

                fontSize: 10,

                color: '#777777',

                marginTop: 4,

              }}

            >

              {excedente.produto.categoria}

            </Text>

          )}



          <TouchableOpacity

            style={styles.producerRow}

            onPress={() =>

              router.push(`/produtor/${excedente.produtor_id}`)

            }

          >

            <Ionicons

              name="person-circle-outline"

              size={19}

              color="#004B0A"

            />



            <View style={styles.producerContent}>

              <Text style={styles.producerLabel}>

                Produzido por

              </Text>



              <Text style={styles.producerName}>

                {excedente.produtor_nome}

              </Text>

            </View>



            <Ionicons

              name="chevron-forward"

              size={19}

              color="#004B0A"

            />

          </TouchableOpacity>



          <View style={styles.priceCard}>

            <View>

              <Text style={styles.priceLabel}>

                Preço normal

              </Text>



              <Text style={styles.oldPrice}>

                {formatarPreco(excedente.produto.preco)} / {unidade}

              </Text>

            </View>



            <View style={styles.priceDivider} />



            <View>

              <Text style={styles.priceLabel}>

                Preço do excedente

              </Text>



              <Text style={styles.newPrice}>

                {formatarPreco(excedente.preco_promocional)} / {unidade}

              </Text>

            </View>



            {economia > 0 && (

              <View style={styles.savingBox}>

                <Ionicons

                  name="pricetag-outline"

                  size={17}

                  color="#004B0A"

                />



                <Text style={styles.savingText}>

                  Você economiza {formatarPreco(economia)} por{' '}

                  {unidade.toLowerCase()} ({desconto}%)

                </Text>

              </View>

            )}

          </View>



          <View style={styles.availabilityCard}>

            <View style={styles.availabilityItem}>

              <View style={styles.availabilityIcon}>

                <Ionicons

                  name="cube-outline"

                  size={22}

                  color="#004B0A"

                />

              </View>



              <View>

                <Text style={styles.availabilityLabel}>

                  Disponível

                </Text>



                <Text style={styles.availabilityValue}>

                  {excedente.quantidade} {unidade}

                </Text>

              </View>

            </View>



            <View style={styles.availabilityItem}>

              <View style={styles.availabilityIcon}>

                <Ionicons

                  name="time-outline"

                  size={22}

                  color="#004B0A"

                />

              </View>



              <View style={styles.deadlineContent}>

                <Text style={styles.availabilityLabel}>

                  Validade

                </Text>



                <Text style={styles.availabilityValue}>

                  {formatarValidade(excedente.data_validade)}

                </Text>

              </View>

            </View>

          </View>



          <Text style={styles.sectionTitle}>

            Informações do excedente

          </Text>



          <View style={styles.reasonCard}>

            <Ionicons

              name="information-circle-outline"

              size={22}

              color="#004B0A"

            />



            <Text style={styles.reasonText}>

              {excedente.observacao?.trim() ||

                'O produtor não adicionou uma observação para este excedente.'}

            </Text>

          </View>



          <View style={styles.qualityCard}>

            <View style={styles.qualityIcon}>

              <Ionicons

                name="checkmark-circle"

                size={25}

                color="#004B0A"

              />

            </View>



            <View style={styles.qualityContent}>

              <Text style={styles.qualityTitle}>

                Próprio para consumo

              </Text>



              <Text style={styles.qualityText}>

                Ser um excedente não significa que o alimento está

                estragado. Ele continua adequado para consumo dentro

                das condições e do prazo informados pelo produtor.

              </Text>

            </View>

          </View>



          <Text style={styles.sectionTitle}>

            Quantidade

          </Text>



          <View style={styles.quantityArea}>

            <View style={styles.quantitySelector}>

              <TouchableOpacity

                style={styles.quantityButton}

                onPress={diminuirQuantidade}

              >

                <Ionicons

                  name="remove"

                  size={21}

                  color="#004B0A"

                />

              </TouchableOpacity>



              <View style={styles.quantityCenter}>

                <Text style={styles.quantityValue}>

                  {quantidade}

                </Text>



                <Text style={styles.quantityUnit}>

                  {unidade}

                </Text>

              </View>



              <TouchableOpacity

                style={styles.quantityButton}

                onPress={aumentarQuantidade}

              >

                <Ionicons

                  name="add"

                  size={21}

                  color="#004B0A"

                />

              </TouchableOpacity>

            </View>



            <Text style={styles.totalLabel}>

              Total

            </Text>



            <Text style={styles.totalValue}>

              {formatarPreco(

                excedente.preco_promocional * quantidade

              )}

            </Text>

          </View>



          <TouchableOpacity

            style={styles.cartButton}

            onPress={adicionarAoCarrinho}

          >

            <Ionicons

              name="cart-outline"

              size={21}

              color="#FFFFFF"

            />



            <Text style={styles.cartButtonText}>

              Adicionar ao carrinho

            </Text>

          </TouchableOpacity>



          <View style={styles.impactCard}>

            <Ionicons

              name="heart-outline"

              size={22}

              color="#004B0A"

            />



            <Text style={styles.impactText}>

              Ao comprar este excedente, você ajuda a reduzir o

              desperdício e contribui diretamente com a renda de um

              produtor local.

            </Text>

          </View>

        </View>

      </ScrollView>

    </View>

  );

}



const styles = StyleSheet.create({



  container: {



    flex: 1,



    backgroundColor: '#FFFFFF',



  },







  scrollContent: {



    paddingBottom: 50,



  },







  imageContainer: {



    height: 310,



    position: 'relative',



  },







  image: {



    width: '100%',



    height: '100%',



  },







  backButton: {



    position: 'absolute',



    top: 28,



    left: 18,



    width: 43,



    height: 43,



    borderRadius: 22,



    backgroundColor: '#FFFFFF',



    alignItems: 'center',



    justifyContent: 'center',



  },







  discountBadge: {



    position: 'absolute',



    top: 29,



    right: 18,



    backgroundColor: '#004B0A',



    paddingHorizontal: 13,



    paddingVertical: 8,



    borderRadius: 18,



  },







  discountText: {



    color: '#FFFFFF',



    fontWeight: 'bold',



    fontSize: 13,



  },







  content: {



    padding: 20,



  },







  excessBadge: {



    alignSelf: 'flex-start',



    backgroundColor: '#E7F1E8',



    paddingHorizontal: 10,



    paddingVertical: 6,



    borderRadius: 15,



    flexDirection: 'row',



    alignItems: 'center',



    gap: 5,



  },







  excessBadgeText: {



    fontSize: 10,



    color: '#004B0A',



    fontWeight: 'bold',



  },







  productName: {



    fontSize: 25,



    fontWeight: 'bold',



    marginTop: 10,



  },







  producerRow: {



    marginTop: 14,



    backgroundColor: '#F6F8F6',



    borderRadius: 10,



    padding: 12,



    flexDirection: 'row',



    alignItems: 'center',



  },







  producerContent: {



    flex: 1,



    marginLeft: 8,



  },







  producerLabel: {



    fontSize: 8,



    color: '#777777',



  },







  producerName: {



    fontSize: 12,



    fontWeight: 'bold',



    color: '#004B0A',



    marginTop: 2,



  },







  locationRow: {



    flexDirection: 'row',



    alignItems: 'center',



    marginTop: 10,



  },







  locationText: {



    fontSize: 11,



    color: '#666666',



    marginLeft: 5,



  },







  priceCard: {



    backgroundColor: '#F7F7F7',



    borderRadius: 12,



    padding: 15,



    marginTop: 20,



  },







  priceLabel: {



    fontSize: 9,



    color: '#777777',



  },







  oldPrice: {



    fontSize: 14,



    color: '#888888',



    textDecorationLine: 'line-through',



    marginTop: 3,



  },







  newPrice: {



    fontSize: 21,



    color: '#004B0A',



    fontWeight: 'bold',



    marginTop: 3,



  },







  priceDivider: {



    height: 1,



    backgroundColor: '#E3E3E3',



    marginVertical: 12,



  },







  savingBox: {



    backgroundColor: '#E7F1E8',



    borderRadius: 8,



    padding: 10,



    marginTop: 12,



    flexDirection: 'row',



    alignItems: 'center',



  },







  savingText: {



    fontSize: 10,



    color: '#004B0A',



    fontWeight: '600',



    marginLeft: 7,



  },







  availabilityCard: {



    flexDirection: 'row',



    marginTop: 15,



    gap: 10,



  },







  availabilityItem: {



    flex: 1,



    backgroundColor: '#F7F7F7',



    borderRadius: 10,



    padding: 12,



    flexDirection: 'row',



    alignItems: 'center',



  },







  availabilityIcon: {



    marginRight: 8,



  },







  deadlineContent: {



    flex: 1,



  },







  availabilityLabel: {



    fontSize: 8,



    color: '#777777',



  },







  availabilityValue: {



    fontSize: 10,



    fontWeight: 'bold',



    marginTop: 3,



  },







  sectionTitle: {



    fontSize: 16,



    fontWeight: 'bold',



    marginTop: 25,



    marginBottom: 10,



  },







  reasonCard: {



    backgroundColor: '#F7F7F7',



    borderRadius: 10,



    padding: 13,



    flexDirection: 'row',



    alignItems: 'flex-start',



  },







  reasonText: {



    flex: 1,



    fontSize: 10,



    color: '#555555',



    lineHeight: 16,



    marginLeft: 9,



  },







  qualityCard: {



    backgroundColor: '#E7F1E8',



    borderRadius: 10,



    padding: 13,



    marginTop: 12,



    flexDirection: 'row',



  },







  qualityIcon: {



    marginRight: 9,



  },







  qualityContent: {



    flex: 1,



  },







  qualityTitle: {



    fontSize: 12,



    color: '#004B0A',



    fontWeight: 'bold',



  },







  qualityText: {



    fontSize: 9,



    color: '#555555',



    lineHeight: 14,



    marginTop: 3,



  },







  quantityArea: {



    backgroundColor: '#F7F7F7',



    borderRadius: 10,



    padding: 13,



  },







  quantitySelector: {



    flexDirection: 'row',



    alignItems: 'center',



  },







  quantityButton: {



    width: 42,



    height: 42,



    borderRadius: 8,



    borderWidth: 1,



    borderColor: '#004B0A',



    alignItems: 'center',



    justifyContent: 'center',



  },







  quantityCenter: {



    width: 80,



    alignItems: 'center',



  },







  quantityValue: {



    fontSize: 17,



    fontWeight: 'bold',



  },







  quantityUnit: {



    fontSize: 8,



    color: '#777777',



  },







  totalLabel: {



    fontSize: 9,



    color: '#777777',



    marginTop: 14,



  },







  totalValue: {



    fontSize: 19,



    color: '#004B0A',



    fontWeight: 'bold',



    marginTop: 2,



  },







  cartButton: {



    height: 51,



    backgroundColor: '#004B0A',



    borderRadius: 9,



    marginTop: 15,



    flexDirection: 'row',



    alignItems: 'center',



    justifyContent: 'center',



    gap: 7,



  },







  cartButtonText: {



    color: '#FFFFFF',



    fontWeight: '600',



    fontSize: 13,



  },







  impactCard: {



    backgroundColor: '#E7F1E8',



    borderRadius: 10,



    padding: 13,



    marginTop: 13,



    flexDirection: 'row',



    alignItems: 'flex-start',



  },







  impactText: {



    flex: 1,



    fontSize: 9,



    color: '#555555',



    lineHeight: 14,



    marginLeft: 8,



  },







  errorContainer: {



    flex: 1,



    alignItems: 'center',



    justifyContent: 'center',



    padding: 25,



  },







  errorTitle: {



    fontSize: 18,



    fontWeight: 'bold',



    marginTop: 10,



  },







  errorButton: {



    marginTop: 18,



    backgroundColor: '#004B0A',



    paddingHorizontal: 20,



    paddingVertical: 11,



    borderRadius: 8,



  },







  errorButtonText: {



    color: '#FFFFFF',



  },



});
