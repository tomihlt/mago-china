import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Animated, Pressable, Dimensions, Button } from 'react-native';
import { loadImages, deleteImage } from '@/services/dataController';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

export default function GalleryScreen() {
  const [images, setImages] = useState<{ image: string; form: any; objHash: string }[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // Estado para rastrear las imágenes seleccionadas
  const [isDeleteMode, setIsDeleteMode] = useState(false); // Estado para activar/desactivar el modo de eliminación
  const router = useRouter();

  // Cargar las imágenes cada vez que la pantalla gana foco
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          const data = await loadImages(); // Cargar todas las imágenes y sus datos
          if (data) {
            setImages(data);
          }
        } catch (error) {
          console.error('Error al cargar las imágenes:', error);
        }
      };

      fetchData(); // Llamada a la función asíncrona

      return () => {};
    }, [])
  );

  // Función para activar el modo de eliminación y seleccionar la imagen inicial
  const activateDeleteMode = (objHash: string) => {
    setIsDeleteMode(true); // Activar el modo de eliminación
    setSelectedImages([objHash]); // Seleccionar la imagen que se mantuvo presionada
  };

  // Función para manejar la selección/deselección de imágenes
  const toggleImageSelection = (objHash: string) => {
    if (isDeleteMode) {
      setSelectedImages(prevSelected => {
        const updatedSelection = prevSelected.includes(objHash)
          ? prevSelected.filter(hash => hash !== objHash) // Deseleccionar
          : [...prevSelected, objHash]; // Seleccionar

        // Si no hay imágenes seleccionadas, salir del modo de eliminación
        if (updatedSelection.length === 0) {
          setIsDeleteMode(false);
        }

        return updatedSelection;
      });
    } else {
      // Si no está en modo de eliminación, abre el panel de detalles
      const selectedImage = images.find(image => image.objHash === objHash);
      if (selectedImage) {
        router.push({
          pathname: '/imageDetailScreen',
          params: {
            image: selectedImage.image,
            form: JSON.stringify(selectedImage.form),
            objHash: selectedImage.objHash,
          },
        });
      }
    }
  };

  // Función para eliminar las imágenes seleccionadas
  const handleDeleteSelectedImages = async () => {
    try {
      // Eliminar cada imagen seleccionada del almacenamiento
      await Promise.all(selectedImages.map(hash => deleteImage(hash)));

      // Actualizar el estado para reflejar la eliminación
      const updatedImages = images.filter(image => !selectedImages.includes(image.objHash));
      setImages(updatedImages);

      // Limpiar la lista de selección y desactivar el modo de eliminación
      setSelectedImages([]);
      setIsDeleteMode(false);
    } catch (error) {
      console.error('Error al eliminar las imágenes:', error);
    }
  };

  // Función para renderizar cada imagen en la lista
  const renderItem = ({ item }: { item: { image: string; form: any; objHash: string } }) => (
    <Pressable
      style={styles.imageContainer}
      onPress={() => toggleImageSelection(item.objHash)} // Clic normal
      onLongPress={() => activateDeleteMode(item.objHash)} // Mantener presionado durante 500 ms
      delayLongPress={500} // Tiempo para activar onLongPress (500 ms)
    >
      <Animated.Image
        source={{ uri: item.image }}
        style={[
          styles.image,
          isDeleteMode && selectedImages.includes(item.objHash) && styles.selectedImage, // Estilo para imágenes seleccionadas
        ]}
      />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal={false}
        style={styles.flatList}
        numColumns={4}
        showsVerticalScrollIndicator={false}
      />
      {isDeleteMode && (
        <Button
          title={`Eliminar (${selectedImages.length})`}
          onPress={handleDeleteSelectedImages}
          color="red"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#25292e', padding: 10 },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
    width: Dimensions.get('window').width / 4,
  },
  image: {
    height: 100,
    width: 100,
    resizeMode: 'stretch',
    opacity: 1, // Opacidad normal
  },
  selectedImage: {
    opacity: 0.7, // Efecto de nitidez (opacidad reducida)
    borderWidth: 2, // Borde para resaltar
    borderColor: 'rgba(255, 255, 255, 0.8)', // Borde semi-transparente
  },
  flatList: {},
});