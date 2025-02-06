import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  const [isPressedD, setIsPressedD] = useState(false);
  const [isPressedA, setIsPressedA] = useState(false);

  const { image, form, objHash } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  const formString = Array.isArray(form) ? form[0] : form;

  useEffect(() => {
    navigation.setOptions({
      headerShown: false, // Oculta el header
    });
  }, [navigation]);


  if (!image || !formString || !objHash) {
    return <Text>Los datos de la imagen no están disponibles.</Text>;
  }

  const imageUri = encodeURI(Array.isArray(image) ? image[0] : image);
  const parsedForm: FormData = JSON.parse(formString);

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Imagen",
      "¿Estás seguro de que deseas eliminar esta imagen?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: () => {
            deleteImage(objHash as string)
              .then(() => {
                console.log('Imagen eliminada exitosamente');
                router.back();
              })
              .catch((error) => {
                console.error('Error al eliminar la imagen:', error);
              });
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <Text style={styles.title}>Detalles de la Imagen</Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.label}>Nombre Proveedor:</Text>
          <Text style={styles.value}>{parsedForm.nombreProveedor}</Text>

          <Text style={styles.label}>Código:</Text>
          <Text style={styles.value}>{parsedForm.codigo}</Text>

          <Text style={styles.label}>Descripción:</Text>
          <Text style={styles.value}>{parsedForm.descripcion}</Text>

          <Text style={styles.label}>Precio:</Text>
          <Text style={styles.value}>{parsedForm.precio}</Text>

          <Text style={styles.label}>Cantidad por Bulto:</Text>
          <Text style={styles.value}>{parsedForm.cantidadBulto}</Text>

          <Text style={styles.label}>Cubicaje:</Text>
          <Text style={styles.value}>{parsedForm.cubicaje}</Text>

          <Text style={styles.label}>Peso:</Text>
          <Text style={styles.value}>{parsedForm.peso}</Text>

          <Text style={styles.label}>Observaciones:</Text>
          <Text style={styles.value}>{parsedForm.obs}</Text>
        </View>
      </View>

      {/* Botones */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.buttonIsPressed,
          ]}
          onPress={handleDelete}
          onPressIn={() => setIsPressedD(true)}
          onPressOut={() => setIsPressedD(false)}
        >
          <Ionicons name="trash" size={20} color="rgb(252, 59, 59)" />
          <Text style={styles.buttonTextDelete}>Eliminar</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.acceptButton,
            pressed && styles.buttonIsPressed,
          ]}
          onPress={() => router.back()}
          onPressIn={() => setIsPressedA(true)}
          onPressOut={() => setIsPressedA(false)}
        >
          <Ionicons name="checkmark" size={20} color="rgb(81, 196, 71)" />
          <Text style={styles.buttonTextAccept}>Aceptar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginBottom: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailsContainer: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 15,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderColor: 'rgb(252, 59, 59)',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(252, 59, 59, 0.1)',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderColor: 'rgb(81, 196, 71)',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(81, 196, 71, 0.1)',
  },
  buttonTextDelete: {
    color: 'rgb(252, 59, 59)',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  buttonTextAccept: {
    color: 'rgb(81, 196, 71)',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  buttonIsPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});