import { StyleSheet, View, ImageStyle, Pressable, Alert } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { useState } from 'react';
import ImagePicker from 'expo-image-picker';

// Usa require para cargar la imagen local
const noPhoto = require('@/assets/images/noPhoto.png');

type Props = {
  imgUrl?: ImageSource;
  style?: ImageStyle;
  onPress?: () => void;
};

export default function ImageViewerAct({ imgUrl, style, onPress }: Props) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handlePress = async () => {
    // Pide permisos para usar la cámara
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar una foto.');
      return;
    }

    // Abre la cámara
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Relación de aspecto cuadrada
      quality: 0.7,  // Calidad de la imagen
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri); // Actualiza el estado con la URI de la foto
    }
  };

  return (
    <View>
      <Pressable onPress={onPress || handlePress}>
        <Image 
          source={photoUri ? { uri: photoUri } : imgUrl ? { uri: imgUrl } : noPhoto}
          style={[styles.imgStyle, style]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  imgStyle: {
    resizeMode: 'cover',
    width: 300,
    height: 300,
  },
});
