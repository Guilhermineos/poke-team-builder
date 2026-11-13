import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, Share, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

interface Pokemon {
  id: number;
  name: string;
  image: string;
}

interface TimePokemon {
  id: string;
  nome: string;
  pokemons: Pokemon[];
}

export default function Time() {
  const [times, setTimes] = useState<TimePokemon[]>([]);
  const [timeAtivoId, setTimeAtivoId] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState(''); 

  useFocusEffect(
    useCallback(() => {
      carregarTimes();
    }, [])
  );

  const carregarTimes = async () => {
    try {
      const timesSalvos = await AsyncStorage.getItem('@meustimes');
      const ativoSalvo = await AsyncStorage.getItem('@timeAtivoId');
      
      if (timesSalvos) {
        const dados = JSON.parse(timesSalvos);
        setTimes(dados);
        
        if (ativoSalvo && dados.find((t: TimePokemon) => t.id === ativoSalvo)) {
          setTimeAtivoId(ativoSalvo);
        } else if (dados.length > 0) {
          selecionarTime(dados[0].id);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar times:", error);
    }
  };

  const selecionarTime = async (id: string) => {
    setTimeAtivoId(id);
    await AsyncStorage.setItem('@timeAtivoId', id);
  };

  const criarTime = async () => {
    if (novoNome.trim() === '') {
      Alert.alert('Erro', 'Digite um nome para o time!');
      return;
    }

    const novoTime: TimePokemon = {
      id: Date.now().toString(),
      nome: novoNome,
      pokemons: []
    };

    const novaLista = [...times, novoTime];
    setTimes(novaLista);
    setNovoNome('');
    
    await AsyncStorage.setItem('@meustimes', JSON.stringify(novaLista));
    selecionarTime(novoTime.id); 
  };

  const excluirTimeAtual = async () => {
    const novaLista = times.filter(t => t.id !== timeAtivoId);
    setTimes(novaLista);
    await AsyncStorage.setItem('@meustimes', JSON.stringify(novaLista));
    
    if (novaLista.length > 0) {
      selecionarTime(novaLista[0].id);
    } else {
      setTimeAtivoId(null);
      await AsyncStorage.removeItem('@timeAtivoId');
    }
  };

  const soltarPokemon = async (indexRemover: number) => {
    const novaLista = times.map(time => {
      if (time.id === timeAtivoId) {
        return {
          ...time,
          pokemons: time.pokemons.filter((_, index) => index !== indexRemover)
        };
      }
      return time;
    });
    setTimes(novaLista);
    await AsyncStorage.setItem('@meustimes', JSON.stringify(novaLista));
  };

  const compartilharTime = async () => {
    const timeAtual = times.find(t => t.id === timeAtivoId);
    if (!timeAtual || timeAtual.pokemons.length === 0) {
      Alert.alert('Time Vazio', 'Você precisa de Pokémon no time para compartilhar!');
      return;
    }

    const nomes = timeAtual.pokemons.map(p => p.name.toUpperCase()).join(', ');
    const mensagem = `Dá uma olhada no meu time "${timeAtual.nome}": ${nomes}!`;

    try {
      await Share.share({ message: mensagem, title: timeAtual.nome });
    } catch (error) {}
  };

  const timeAtual = times.find(t => t.id === timeAtivoId);

  return (
    <View style={styles.container}>
      <View style={styles.criarTimeContainer}>
        <TextInput
          style={styles.inputNome}
          placeholder="Nome do time..."
          value={novoNome}
          onChangeText={setNovoNome}
        />
        <TouchableOpacity style={styles.btnCriar} onPress={criarTime}>
          <Text style={styles.btnCriarTexto}>Criar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.abasContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {times.map(t => (
            <TouchableOpacity 
              key={t.id} 
              style={[styles.aba, timeAtivoId === t.id && styles.abaAtiva]}
              onPress={() => selecionarTime(t.id)}
            >
              <Text style={[styles.abaTexto, timeAtivoId === t.id && styles.abaTextoAtivo]}>
                {t.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {!timeAtual ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nenhum time criado.</Text>
          <Text style={styles.emptySubText}>Digite um nome acima e clique em Criar!</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.timeHeader}>
            <Text style={styles.timeNome}>{timeAtual.nome} ({timeAtual.pokemons.length}/6)</Text>
            <TouchableOpacity style={styles.btnExcluir} onPress={excluirTimeAtual}>
              <Text style={styles.btnExcluirTexto}>Excluir Time</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={timeAtual.pokemons}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2}
            renderItem={({ item, index }) => (
              <View style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <Text style={styles.name}>{item.name.toUpperCase()}</Text>
                <TouchableOpacity style={styles.buttonRemove} onPress={() => soltarPokemon(index)}>
                  <Text style={styles.buttonText}>Soltar</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          
          <TouchableOpacity style={styles.buttonShare} onPress={compartilharTime}>
            <Text style={styles.buttonShareText}>Compartilhar Time</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  criarTimeContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff' },
  inputNome: { flex: 1, backgroundColor: '#eee', padding: 10, borderRadius: 5, marginRight: 10 },
  btnCriar: { backgroundColor: '#e3350d', padding: 10, borderRadius: 5, justifyContent: 'center' },
  btnCriarTexto: { color: '#fff', fontWeight: 'bold' },
  abasContainer: { backgroundColor: '#fff', paddingBottom: 10, borderBottomWidth: 1, borderColor: '#ccc' },
  aba: { paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 5, borderRadius: 20, backgroundColor: '#eee' },
  abaAtiva: { backgroundColor: '#333' },
  abaTexto: { fontWeight: 'bold', color: '#666' },
  abaTextoAtivo: { color: '#fff' },
  timeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  timeNome: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  btnExcluir: { backgroundColor: '#ff4444', padding: 8, borderRadius: 5 },
  btnExcluirTexto: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#555' },
  emptySubText: { fontSize: 14, color: '#888', marginTop: 10, textAlign: 'center' },
  card: { flex: 1, backgroundColor: '#fff', margin: 5, padding: 15, borderRadius: 10, alignItems: 'center', elevation: 3 },
  image: { width: 90, height: 90 },
  name: { fontWeight: 'bold', marginBottom: 15, fontSize: 16 },
  buttonRemove: { backgroundColor: '#333', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  buttonShare: { backgroundColor: '#25D366', padding: 15, borderRadius: 10, margin: 10, alignItems: 'center' },
  buttonShareText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});