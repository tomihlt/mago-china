import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView, Animated, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import Ionicons from '@expo/vector-icons/Ionicons';
import { saveImage } from '@/services/dataController';
import { useFocusEffect } from 'expo-router';
import { getCode } from '@/services/config';

const requestAllPermissions = async () => {
  try {
    const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
    const galleryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    const writePermission = await MediaLibrary.getPermissionsAsync();

    if (
      cameraPermission.status === 'granted' &&
      galleryPermission.status === 'granted' &&
      writePermission.status === 'granted'
    ) {
      return true;
    }

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: writeStatus } = await MediaLibrary.requestPermissionsAsync();

    if (cameraStatus !== 'granted' || galleryStatus !== 'granted' || writeStatus !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesitan permisos para continuar.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error solicitando permisos:', error);
    return false;
  }
};

export default function App() {
  const [isPressedR, setIsPressedR] = useState(false);
  const [isPressedA, setIsPressedA] = useState(false);
  const [imagePressed, setImagePressed] = useState(false);
  const [takenFromGallery, setTakenFromGallery] = useState(false);
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
    if (!text.startsWith('EM-')) {
      text = 'EM-' + text.replace(/[^0-9]/g, '');
    } else {
      text = 'EM-' + text.substring(3).replace(/[^0-9]/g, '');
    }
    setFormData({ ...formData, codigo: text });
  };

  const pickImageFromGallery = async () => {
    const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar una imagen.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setTakenFromGallery(true);
      setImage(result.assets[0].uri);
    }
  };

  const takePhotoWithCamera = async () => {
    const permission = await ImagePicker.getCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar una foto.');
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setTakenFromGallery(false);
      setImage(result.assets[0].uri);
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

  const saveImageToGallery = async () => {
    if (!image) {
      return;
    }

    if (takenFromGallery) {
      return;
    }
    const asset = await MediaLibrary.createAssetAsync(image);
  };

  const handleAccept = () => {
    const codigoActual = formData.codigo.replace('EM-', '').trim();

    if (!/^\d+$/.test(codigoActual)) {
      Alert.alert('Error', 'El código debe contener al menos un número después de "EM-".');
      return;
    }

    if (!image) {
      Alert.alert('Error', 'No hay una imagen para guardar.');
      return;
    }

    console.log('Datos enviados:', formData);

    saveImageToGallery();
    saveImage({ image: image || '', form: formData });

    setFormData(prevData => {
      const nuevoCodigo = isNaN(parseInt(codigoActual)) ? 1 : parseInt(codigoActual) + 1;

      return {
        ...prevData,
        codigo: `EM-${nuevoCodigo}`,
        descripcion: '',
        precio: '',
        cantidadBulto: '',
        cubicaje: '',
        peso: '',
        obs: '',
      };
    });

    setImage(null);
  };

  const resetForm = () => {
    setFormData((prevData) => ({
      nombreProveedor: '',
      codigo: 'EM-',
      descripcion: '',
      precio: '',
      cantidadBulto: '',
      cubicaje: '',
      peso: '',
      obs: '',
    }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} // Ajusta este valor según sea necesario
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer} // Asegúrate de que el contenido tenga suficiente espacio
        keyboardShouldPersistTaps="handled" // Permite manejar los taps en el teclado
      >
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
        <View style={styles.formContainer}>
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
            style={styles.observationsInput}
            value={formData.obs}
            onChangeText={(text) => setFormData({ ...formData, obs: text })}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            placeholder="Escribe tus observaciones aquí..."
            placeholderTextColor="#888"
          />

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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1, // Asegura que el contenido sea desplazable
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
    height: 100,
    textAlignVertical: 'top',
  },
});