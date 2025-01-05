import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView, Animated, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library'; // Importa MediaLibrary
import Ionicons from '@expo/vector-icons/Ionicons';
import { saveImage } from '@/services/dataController';

export default function App() {

  // Efectos
  const [isPressedR, setIsPressedR] = useState(false); // Estado para saber si el botón de reset está presionado
  const [isPressedA, setIsPressedA] = useState(false); // Estado para saber si el botón de aceptar está presionado
  const [imagePressed, setImagePressed] = useState(false); // Estado para saber si la imagen está presionada
  const [takenFromGallery, setTakenFromGallery] = useState(false); // Estado para saber si la imagen fue tomada de la galería


  const [image, setImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombreProveedor: '',
    codigo: '',
    descripcion: '',
    precio: '',
    cantidadBulto: '',
    cubicaje: '',
  });

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar una imagen.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setTakenFromGallery(true);
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al abrir la galería:', error);
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar una foto.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setTakenFromGallery(false);
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al abrir la cámara:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara.');
    }
  };

  const handleImagePick = () => {
    Alert.alert(
      'Seleccionar Imagen',
      '¿Qué acción deseas realizar?',
      [
        { text: 'Tomar Foto', onPress: takePhotoWithCamera },
        { text: 'Elegir de la Galería', onPress: pickImageFromGallery },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };


  // Función para guardar la imagen en la galería
  const saveImageToGallery = async () => {
    if (!image) {
      Alert.alert('Error', 'No hay una imagen para guardar.');
      return;
    }

    try {
      // Solicitar permisos para acceder a la galería
      const { granted } = await MediaLibrary.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permiso requerido', 'Se necesita acceso al almacenamiento para guardar la imagen.');
        return;
      }

      // Guardar la imagen en la galería
      if(takenFromGallery) {
        resetForm();
        return;
      }
      const asset = await MediaLibrary.createAssetAsync(image);
      await MediaLibrary.createAlbumAsync('MyAppImages', asset, false); // cambiar "MyAppImages" por el nombre del proyecto (cuando se implemente, las imagenes de la galaria no estan en ese album)
      Alert.alert('Éxito', 'La imagen se guardó en la galería.');
      resetForm();
    } catch (error) {
      console.error('Error al guardar la imagen:', error);
      Alert.alert('Error', 'No se pudo guardar la imagen.');
    }

  };

  const handleAccept = () => {
    console.log('Datos enviados:');
    console.log('Imagen:', image);
    console.log('Formulario:', formData);

    saveImageToGallery();
    saveImage({ image: image || '', form: formData });

  };

  const resetForm = () => {
    setImage(null);
    setFormData({
      nombreProveedor: '',
      codigo: '',
      descripcion: '',
      precio: '',
      cantidadBulto: '',
      cubicaje: '',
    });
  };

  return (
    <View style={styles.container}>
      {/* Image Viewer */}
      <Pressable onPress={handleImagePick} onPressIn={() => setImagePressed(true)} onPressOut={() => setImagePressed(false)}>
        <View style={[styles.imageContainer, imagePressed && styles.imagePressed]}>
          <Animated.Image
            source={image ? { uri: image } : require('@/assets/images/noPhoto.png')}
            style={styles.image}
          />
        </View>
      </Pressable>

      {/* Formulario */}
      <ScrollView style={styles.formContainer}>
        <Text style={styles.title}>Datos</Text>
        <Text style={styles.label}>Nombre Proveedor</Text>
        <TextInput
          style={styles.input}
          value={formData.nombreProveedor}
          onChangeText={(text) => setFormData({ ...formData, nombreProveedor: text })}
        />
        <Text style={styles.label}>Código</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.codigo}
          onChangeText={(text) => setFormData({ ...formData, codigo: text })}
        />
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={styles.input}
          value={formData.descripcion}
          onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
        />

        <Text style={styles.label}>Precio</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.precio}
          onChangeText={(text) => setFormData({ ...formData, precio: text })}
        />

        <Text style={styles.label}>Cantidad por Bulto</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.cantidadBulto}
          onChangeText={(text) => setFormData({ ...formData, cantidadBulto: text })}
        />

        <Text style={styles.label}>Cubicaje</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.cubicaje}
          onChangeText={(text) => setFormData({ ...formData, cubicaje: text })}
        />
        {/* Otros campos similares */}

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <Pressable style={[styles.resetButton, isPressedR && styles.buttonIsPressed]} onPress={resetForm} onPressIn={() => setIsPressedR(true)} onPressOut={() => setIsPressedR(false)}>
            <Ionicons name="reload" size={20} color="rgb(255, 192, 75)" />
            <Text style={styles.buttonTextReset}>Resetear</Text>
          </Pressable>
          <Pressable style={[styles.acceptButton, isPressedA && styles.buttonIsPressed]} onPress={handleAccept} onPressIn={() => setIsPressedA(true)} onPressOut={() => setIsPressedA(false)}>
            <Ionicons name="checkmark" size={20} color="rgb(81, 196, 71)" />
            <Text style={styles.buttonTextAccept}>Aceptar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#25292e' },
  imageContainer: { position: 'relative', width: Dimensions.get('window').width - 40, height: 300, margin: 'auto', },
  image: { width: Dimensions.get('window').width - 40, height: 300, resizeMode: 'contain', margin:'auto' },
  imagePressed: { backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 10, }, // Opcional: para que tenga bordes redondeados
  formContainer: { padding: 20 },
  title: { color: '#fff', fontSize: 20, marginTop: 10,marginBottom: 10, textAlign: 'center', margin: 'auto', backgroundColor: 'rgba(24, 24, 24, 0.64)', width: '100%'},
  label: { color: '#fff', marginBottom: 5 },
  input: { backgroundColor: '#333', color: '#fff', marginBottom: 10, padding: 10, borderRadius: 5 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 40 },
  resetButton: { flexDirection: 'row', alignItems: 'center', padding: 10, borderColor: 'rgb(255, 192, 75)', borderWidth: 1 },
  acceptButton: { flexDirection: 'row', alignItems: 'center', padding: 10, borderColor: 'rgb(81, 196, 71)', borderWidth: 1 },
  buttonTextReset: { color: 'rgb(255, 192, 75)', marginLeft: 5 },
  buttonTextAccept: { color: 'rgb(81, 196, 71)', marginLeft: 5 },
  buttonIsPressed: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
});
