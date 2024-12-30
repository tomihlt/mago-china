import { StyleSheet, View, ImageStyle, Pressable, Alert } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

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
  
      if (result.canceled) {
        console.log('El usuario canceló la acción de la cámara.');
        return;
      }
  
      if (result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al abrir la cámara:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara.');
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
