import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type BottomButtonsProps = {
  onPress?: () => void; // 'onPress' es una función que no recibe parámetros y no devuelve nada
};

export default function BottomButtons({ resetForm } : { resetForm : BottomButtonsProps['onPress'] }) {
  const [isPressedReset, setIsPressedReset] = useState(false);
  const [isPressedAccept, setIsPressedAccept] = useState(false);

  const handleButton1Press = () => {
    console.log('Botón 1 presionado');
  };

  const handleButton2Press = () => {
    console.log('Botón 2 presionado');
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.buttonReset,
          isPressedReset && styles.buttonPressed, // Estilo dinámico
        ]}
        onPress={resetForm}
        onPressIn={() => setIsPressedReset(true)} // Activa el efecto al presionar
        onPressOut={() => setIsPressedReset(false)} // Desactiva el efecto al soltar
      >
        <Ionicons
          name={'reload'}
          size={20}
          style={{ marginRight: 10, color: 'rgb(255, 192, 75)' }}
        />
        <Text style={styles.buttonTextReload}>Resetear</Text>
      </Pressable>

      <Pressable
        style={[
          styles.buttonAccept,
          isPressedAccept && styles.buttonPressed, // Estilo dinámico
        ]}
        onPress={handleButton2Press}
        onPressIn={() => setIsPressedAccept(true)} // Activa el efecto al presionar
        onPressOut={() => setIsPressedAccept(false)} // Desactiva el efecto al soltar
      >
        <Ionicons
          name={'checkmark'}
          size={24}
          style={{ marginRight: 10, color: 'rgb(81, 196, 71)' }}
        />
        <Text style={styles.buttonTextAccept}>Aceptar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // Coloca los botones en fila
    justifyContent: 'space-between', // Espacio entre botones
    alignItems: 'center', // Centra verticalmente
    paddingHorizontal: 20, // Espaciado horizontal interno
    marginTop: 20,
    marginBottom: 20,
  },
  buttonReset: {
    //flex: 1,
    flexDirection: 'row',
    backgroundColor: '#25292e',
    //marginHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgb(255, 192, 75)',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 150,
  },
  buttonAccept: {
    //flex: 1,
    flexDirection: 'row',
    backgroundColor: '#25292e',
    //marginHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgb(81, 196, 71)',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 150,
  },
  buttonPressed: {
    backgroundColor: '#1b1f23', // Color más oscuro para el efecto de presionado
  },
  buttonTextReload: {
    color: 'rgb(255, 192, 75)',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextAccept: {
    color: 'rgb(81, 196, 71)',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
