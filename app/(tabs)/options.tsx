import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View, StyleSheet, Pressable } from 'react-native';

export default function OptionsScreen() {

    return (
        <View style={styles.container}>
          <Pressable style={styles.newProjectContainer}>
          <Ionicons name="caret-forward" size={24} color="white" />
            <Text style={styles.text}> Nuevo proyecto </Text>
          </Pressable>
        </View>
    );

}

const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', backgroundColor: '#25292e', justifyContent: 'flex-start', alignItems: 'flex-start', fontWeight: 'bold' },
    text: { color: '#fff' },
    newProjectContainer:{ flex: 1, flexDirection: 'row' , width: '100%', height: 50, backgroundColor: 'rgba(0, 0, 0, 0.3)', alignItems: 'center' },
  });