import { StyleSheet, View, ImageStyle, Pressable, Alert, Animated } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Dimensions } from 'react-native';

// Usa require para cargar la imagen local
const noPhoto = require('@/assets/images/noPhoto.png');

type Props = {
  imgUrl?: ImageSource;
  style?: ImageStyle;
  onPress?: () => void;
};

export default function ImageViewerAct({ imgUrl, style, onPress }: Props) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [opacity] = useState(new Animated.Value(1)); // Control de opacidad

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

  // Manejo de opacidad al presionar
  const handlePressIn = () => {
    Animated.timing(opacity, {
      toValue: 0.3,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View>
      <Pressable
        onPress={onPress || handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={{ opacity }}>
          <Image 
            source={photoUri ? { uri: photoUri } : imgUrl ? { uri: imgUrl } : noPhoto}
            style={[styles.imgStyle, style]}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  imgStyle: {
    resizeMode: 'contain',
    width: Dimensions.get('window').width - 40,
    height: 300,
  },
});
