import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Animated } from 'react-native';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert } from 'react-native';
import { deleteImage } from '@/services/dataController';

type FormData = {
  nombreProveedor: string;
  codigo: string;
  descripcion: string;
  precio: string;
  cantidadBulto: string;
  cubicaje: string;
  peso: string;
  obs: string;
};

export default function ImageDetailScreen() {
  // Efectos
  const [isPressedD, setIsPressedD] = useState(false); // Estado para saber si el botón de reset está presionado
  const [isPressedA, setIsPressedA] = useState(false); // Estado para saber si el botón de aceptar está presionado

  const { image, form, objHash } = useLocalSearchParams();
  const router = useRouter();

  // Asegurar que form es un string
  const formString = Array.isArray(form) ? form[0] : form;  

  if (!image || !formString || !objHash) {
    return <Text>Los datos de la imagen no están disponibles.</Text>;
  }

  // const imageUri = Array.isArray(image) ? image[0] : image;
  const imageUri = encodeURI(Array.isArray(image) ? image[0] : image);
  const parsedForm: FormData = JSON.parse(formString);
  console.log('image:', image);
  console.log('form:', form);
  console.log('objHash:', objHash);


  const handleDelete = () => {
    Alert.alert(
      "Eliminar Imagen",
      "¿Estás seguro de que deseas eliminar esta imagen?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Eliminar", 
          onPress: () => {
            deleteImage(objHash as string)
              .then(() => {
                // Aquí puedes agregar lógica adicional después de eliminar la imagen, como navegar a otra pantalla
                console.log('Imagen eliminada exitosamente');
                router.back();
              })
              .catch((error) => {
                console.error('Error al eliminar la imagen:', error);
              });
          }
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      {/* <Animated.Image source={{ uri: imageUri }} style={styles.image} /> */}
      <Text style={styles.title}>Detalles de la Imagen</Text>
      <Text style={styles.text}>Nombre Proveedor: {parsedForm.nombreProveedor}</Text>
      <Text style={styles.text}>Código: {parsedForm.codigo}</Text>
      <Text style={styles.text}>Descripción: {parsedForm.descripcion}</Text>
      <Text style={styles.text}>Precio: {parsedForm.precio}</Text>
      <Text style={styles.text}>Cantidad por Bulto: {parsedForm.cantidadBulto}</Text>
      <Text style={styles.text}>Cubicaje: {parsedForm.cubicaje}</Text>
      <Text style={styles.text}>Peso: {parsedForm.peso}</Text>
      <Text style={styles.text}>Observaciones: {parsedForm.obs}</Text>

      {/* Botones */}
      <View style={styles.buttonContainer}>
          <Pressable style={[styles.deleteButton, isPressedD && styles.buttonIsPressed]} onPress={handleDelete} onPressIn={() => setIsPressedD(true)} onPressOut={() => setIsPressedD(false)}>
            <Ionicons name="trash" size={20} color="rgb(252, 59, 59)" />
            <Text style={styles.buttonTextDelete}>Eliminar</Text>
          </Pressable>
          <Pressable style={[styles.acceptButton, isPressedA && styles.buttonIsPressed]} onPress={() => router.back()} onPressIn={() => setIsPressedA(true)} onPressOut={() => setIsPressedA(false)}>
            <Ionicons name="checkmark" size={20} color="rgb(81, 196, 71)" />
            <Text style={styles.buttonTextAccept}>Aceptar</Text>
          </Pressable>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', flexGrow: 1, backgroundColor: '#25292e', alignItems: 'center', padding: 20 },
  image: { width: 300, height: 300, resizeMode: 'contain', marginBottom: 20},
  title: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  text: { fontSize: 16, color: '#fff', marginBottom: 5 },
  buttonContainer: { width: 300, flexDirection: 'row', flex: 1, justifyContent: 'space-between', alignItems:'flex-end', marginTop: 10, marginBottom: 40 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', padding: 10, borderColor: 'rgb(252, 59, 59)', borderWidth: 1 },
  acceptButton: { flexDirection: 'row', alignItems: 'center', padding: 10, borderColor: 'rgb(81, 196, 71)', borderWidth: 1 },
  buttonTextDelete: { color: 'rgb(252, 59, 59)', marginLeft: 5 },
  buttonTextAccept: { color: 'rgb(81, 196, 71)', marginLeft: 5 },
  buttonIsPressed: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
});
