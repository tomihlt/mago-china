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
    codigo: 'EM-',
    descripcion: '',
    precio: '',
    cantidadBulto: '',
    cubicaje: '',
    peso: '',
    obs: '',
  });

  const handleCodeChange = (text: string) => {
    // Asegura que el prefijo EM- siempre esté presente
    if (!text.startsWith('EM-')) {
      text = 'EM-' + text.replace(/[^0-9]/g, ''); // Añade el prefijo si no está presente y elimina caracteres no numéricos
    } else {
      // Si el prefijo está presente, solo permite números después de EM-
      text = 'EM-' + text.substring(3).replace(/[^0-9]/g, '');
    }

    setFormData({ ...formData, codigo: text });
  };

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
        //aspect: [1, 1],
        quality: 1,
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
        //aspect: [1, 1],
        quality: 1,
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
      codigo: 'EM-',
      descripcion: '',
      precio: '',
      cantidadBulto: '',
      cubicaje: '',
      peso: '',
      obs: '',
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
          // onChangeText={(text) => setFormData({ ...formData, codigo: text })}
          onChangeText={handleCodeChange}
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

        <Text style={styles.label}>Peso</Text>
        <TextInput
          style={styles.input}
          value={formData.peso}
          onChangeText={(text) => setFormData({ ...formData, peso: text })}
        />

      <Text style={styles.label}>Observaciones</Text>
      <TextInput
        style={styles.observationsInput} // Nuevo estilo para el campo de observaciones
        value={formData.obs}
        onChangeText={(text) => setFormData({ ...formData, obs: text })}
        multiline={true} // Permite múltiples líneas
        numberOfLines={4} // Número inicial de líneas visibles
        textAlignVertical="top" // Alinea el texto en la parte superior
        placeholder="Escribe tus observaciones aquí..."
        placeholderTextColor="#888" // Color del texto de placeholder
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
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    width: Dimensions.get('window').width - 40,
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imagePressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(24, 24, 24, 0.64)',
    padding: 10,
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderColor: 'rgb(255, 192, 75)',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 192, 75, 0.1)',
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
  buttonTextReset: {
    color: 'rgb(255, 192, 75)',
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
  observationsInput: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    height: 100, // Altura fija para el campo de observaciones
    textAlignVertical: 'top', // Alinea el texto en la parte superior
  },
});
