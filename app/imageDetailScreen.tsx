import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Animated } from 'react-native';

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
  const { image, form, objHash } = useLocalSearchParams();

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#25292e', alignItems: 'center', padding: 20 },
  image: { width: 300, height: 300, resizeMode: 'contain', marginBottom: 20},
  title: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 10 },
  text: { fontSize: 16, color: '#fff', marginBottom: 5 },
});
