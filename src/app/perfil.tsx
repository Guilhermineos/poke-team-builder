import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Perfil() {
  const [image, setImage] = useState<string | null>(null);
  const [nome, setNome] = useState('Treinador');

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      const fotoSalva = await AsyncStorage.getItem('@fotoperfil');
      const nomeSalvo = await AsyncStorage.getItem('@nomeperfil');
      if (fotoSalva) setImage(fotoSalva);
      if (nomeSalvo) setNome(nomeSalvo);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  };

  const salvarNome = async (novoNome: string) => {
    setNome(novoNome);
    await AsyncStorage.setItem('@nomeperfil', novoNome);
  };

  const escolherImagem = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Pega só imagens
      allowsEditing: true, // Permite cortar a foto
      aspect: [1, 1], // Deixa o corte quadrado 
      quality: 0.8, // Comprime um pouco para otimizar a memória
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      await AsyncStorage.setItem('@fotoperfil', uri); // Salva a foto na memória
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardPerfil}>
        <Text style={styles.title}>Cartão de Treinador</Text>
        
        <TouchableOpacity onPress={escolherImagem} style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>Add Foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Nome do Treinador:</Text>
        <TextInput 
          style={styles.input} 
          value={nome} 
          onChangeText={salvarNome}
          placeholder="Digite seu nome"
          maxLength={15}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0', padding: 20, justifyContent: 'center' },
  cardPerfil: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  imageContainer: { marginBottom: 20 },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75, // Deixa a imagem redonda
    borderWidth: 3,
    borderColor: '#e3350d',
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#aaa',
  },
  avatarText: { color: '#666', fontWeight: 'bold' },
  label: { alignSelf: 'flex-start', fontSize: 16, color: '#555', marginBottom: 5, marginLeft: 10 },
  input: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});