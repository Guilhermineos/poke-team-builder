import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

export default function Pokedex() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [genSelecionada, setGenSelecionada] = useState<number>(0);

  // NOVOS ESTADOS PARA O MODAL (Janela flutuante)
  const [modalVisible, setModalVisible] = useState(false);
  const [pokemonSelecionado, setPokemonSelecionado] = useState<Pokemon | null>(null);
  const [listaDeTimes, setListaDeTimes] = useState<TimePokemon[]>([]);

  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=1025')
      .then(response => response.json())
      .then(data => {
        const formatData = data.results.map((item: any, index: number) => ({
          id: index + 1,
          name: item.name,
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png`
        }));
        setPokemon(formatData);
        setLoading(false);
      })
      .catch(error => console.error("Erro ao buscar Pokémon:", error));
  }, []);

  // 1. Ao clicar em capturar, abrimos o Modal e carregamos os times
  const prepararCaptura = async (pokemonClicado: Pokemon) => {
    try {
      const timesSalvos = await AsyncStorage.getItem('@meustimes');
      
      if (!timesSalvos) {
        Alert.alert('Atenção', 'Vá até a aba "Meu Time" e crie um time primeiro!');
        return;
      }

      const timesParsed: TimePokemon[] = JSON.parse(timesSalvos);
      if (timesParsed.length === 0) {
        Alert.alert('Atenção', 'Vá até a aba "Meu Time" e crie um time primeiro!');
        return;
      }

      setListaDeTimes(timesParsed);
      setPokemonSelecionado(pokemonClicado);
      setModalVisible(true); // Abre a janela flutuante
    } catch (error) {
      console.error("Erro ao preparar captura:", error);
    }
  };

  // 2. Quando o usuário clica em um time dentro do Modal
  const confirmarCaptura = async (timeId: string) => {
    if (!pokemonSelecionado) return;

    try {
      const indexTime = listaDeTimes.findIndex(t => t.id === timeId);
      if (indexTime === -1) return;

      // Verifica se O TIME ESCOLHIDO já tem 6 Pokémon
      if (listaDeTimes[indexTime].pokemons.length >= 6) {
        Alert.alert('Time Cheio!', `O time "${listaDeTimes[indexTime].nome}" já tem 6 Pokémon.`);
        return;
      }

      // Salva no time e atualiza o AsyncStorage
      listaDeTimes[indexTime].pokemons.push(pokemonSelecionado);
      await AsyncStorage.setItem('@meustimes', JSON.stringify(listaDeTimes));
      
      Alert.alert('Sucesso!', `${pokemonSelecionado.name.toUpperCase()} adicionado ao time "${listaDeTimes[indexTime].nome}"!`);
      
      // Fecha o Modal e limpa a seleção
      setModalVisible(false);
      setPokemonSelecionado(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const getGenRange = (gen: number) => {
    switch(gen) {
      case 1: return { min: 1, max: 151 };
      case 2: return { min: 152, max: 251 };
      case 3: return { min: 252, max: 386 };
      case 4: return { min: 387, max: 493 };
      case 5: return { min: 494, max: 649 };
      case 6: return { min: 650, max: 721 };
      case 7: return { min: 722, max: 809 };
      case 8: return { min: 810, max: 905 };
      case 9: return { min: 906, max: 1025 };
      default: return { min: 1, max: 1025 };
    }
  };

  const pokemonFiltrados = pokemon.filter(p => {
    const matchBusca = p.name.toLowerCase().includes(searchText.toLowerCase());
    const { min, max } = getGenRange(genSelecionada);
    const matchGen = genSelecionada === 0 ? true : (p.id >= min && p.id <= max);
    return matchBusca && matchGen;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e3350d" />
        <Text style={{ marginTop: 10 }}>Carregando Pokédex...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Pesquisar Pokémon por nome..."
        value={searchText}
        onChangeText={setSearchText}
      />

      <View style={{ height: 50, marginBottom: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(gen => (
            <TouchableOpacity 
              key={gen} 
              style={[styles.genBtn, genSelecionada === gen && styles.genBtnAtivo]} 
              onPress={() => setGenSelecionada(gen)}
            >
              <Text style={[styles.genText, genSelecionada === gen && styles.genTextAtivo]}>
                {gen === 0 ? 'Todas' : `Gen ${gen}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={pokemonFiltrados}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.name}>{item.name.toUpperCase()}</Text>
            
            {/* AGORA ELE CHAMA O prepararCaptura EM VEZ DE SALVAR DIRETO */}
            <TouchableOpacity style={styles.button} onPress={() => prepararCaptura(item)}>
              <Text style={styles.buttonText}>Capturar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* COMPONENTE DO MODAL (Janela de Escolher o Time) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Fecha no botão "Voltar" do Android
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolha o Time</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubTitle}>
              Onde deseja colocar o {pokemonSelecionado?.name.toUpperCase()}?
            </Text>

            <FlatList
              data={listaDeTimes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.timeOptionBtn} 
                  onPress={() => confirmarCaptura(item.id)}
                >
                  <Text style={styles.timeOptionText}>{item.nome} ({item.pokemons.length}/6)</Text>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#888" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0', padding: 5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginHorizontal: 5, marginTop: 5, marginBottom: 10, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  genBtn: { paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 5, borderRadius: 20, backgroundColor: '#ddd', justifyContent: 'center', height: 40 },
  genBtnAtivo: { backgroundColor: '#e3350d' },
  genText: { fontWeight: 'bold', color: '#555' },
  genTextAtivo: { color: '#fff' },
  card: { flex: 1, backgroundColor: '#fff', margin: 5, padding: 15, borderRadius: 10, alignItems: 'center', elevation: 3 },
  image: { width: 90, height: 90 },
  name: { fontWeight: 'bold', marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#e3350d', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  
  // ESTILOS DO MODAL
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalSubTitle: { fontSize: 16, color: '#555', marginBottom: 15 },
  timeOptionBtn: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  timeOptionText: { fontSize: 18, fontWeight: 'bold', color: '#333' }
});