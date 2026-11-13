import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#e3350d' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pokédex',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="pokeball" size={24} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="time"
        options={{
          title: 'Meu Time',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="star-circle" size={24} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Treinador',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={24} color={color as string} />,
        }}
      />
    </Tabs>
  );
}