import type { Session } from '@supabase/supabase-js';
import { Stack, router, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';

import { AfiliacaoProvider } from '../context/AfiliacaoContext';
import { CartProvider } from '../context/CartContext';
import { NotificacoesProvider } from '../context/NotificacoesContext';
import { ProdutorProvider } from '../context/ProdutorContext';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const segments = useSegments();
  const [sessao, setSessao] = useState<Session | null>(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregarSessao() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.log('Erro ao verificar sessão:', error);
        if (ativo) setSessao(data.session);
      } catch (error) {
        console.log('Erro inesperado ao verificar sessão:', error);
      } finally {
        if (ativo) setVerificandoSessao(false);
      }
    }

    carregarSessao();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, novaSessao) => {
        if (ativo) setSessao(novaSessao);
      }
    );

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    async function buscarRole() {
      if (!sessao?.user) {
        setRole(null);
        return;
      }

      setRole(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', sessao.user.id)
          .single();

        if (error) {
          console.log('Erro ao buscar perfil:', error);
          return;
        }
        if (ativo) setRole(data?.role ?? null);
      } catch (error) {
        console.log('Erro inesperado ao buscar perfil:', error);
      }
    }

    buscarRole();
    return () => { ativo = false; };
  }, [sessao?.user.id]);

  useEffect(() => {
    if (verificandoSessao || !sessao?.user || !role) return;

    const primeiraRota = segments[0];
    const estaEmRotaPublica =
      !primeiraRota ||
      primeiraRota === 'login' ||
      primeiraRota === 'cadastro';

    if (!estaEmRotaPublica) return;

    if (role === 'produtor') {
      router.replace('/area-produtor/inicio');
    } else if (role === 'comprador') {
      router.replace('/inicio');
    }
  }, [verificandoSessao, sessao?.user.id, role, segments]);

  return (
    <NotificacoesProvider>
      <AfiliacaoProvider>
        <CartProvider>
          <ProdutorProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </ProdutorProvider>
        </CartProvider>
      </AfiliacaoProvider>
    </NotificacoesProvider>
  );
}
