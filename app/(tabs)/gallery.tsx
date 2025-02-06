import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Animated, Pressable, Dimensions, Text } from 'react-native';
import { loadImages, deleteImage } from '@/services/dataController';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Importar íconos

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

      // Reiniciar el estado cuando se pierde el foco
      return () => {
        setSelectedImages([]); // Deseleccionar todas las imágenes
        setIsDeleteMode(false); // Salir del modo de eliminación
      };
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

  // Función para seleccionar o deseleccionar todas las imágenes
  const toggleSelectAll = () => {
    if (selectedImages.length === images.length) {
      // Si todas las imágenes ya están seleccionadas, deseleccionar todas
      setSelectedImages([]);
      setIsDeleteMode(false); // Salir del modo de eliminación
    } else {
      // Seleccionar todas las imágenes
      setSelectedImages(images.map(image => image.objHash));
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
      {/* Ícono de tacho de basura para imágenes seleccionadas */}
      {isDeleteMode && selectedImages.includes(item.objHash) && (
        <View style={styles.trashIconContainer}>
          <Ionicons name="trash" size={24} color="red" />
        </View>
      )}
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
        <View style={styles.deleteModeContainer}>
          <Pressable
            style={styles.selectAllButton}
            onPress={toggleSelectAll}
          >
            <Text style={styles.selectAllText}>
              {selectedImages.length === images.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.deleteButton}
            onPress={handleDeleteSelectedImages}
          >
            <Ionicons name="trash" size={24} color="white" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const numColumns = 4;
const screenWidth = Dimensions.get('window').width;
const margin = 5; // Margen entre imágenes
const padding = 10; // Padding del contenedor principal
const totalMargin = (numColumns - 1) * margin; // Margen total entre las imágenes
const imageSize = (screenWidth - 2 * padding - totalMargin) / numColumns; // Calcula el tamaño de la imagen

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#25292e', padding: padding },
  imageContainer: {
    width: imageSize, // Usa el tamaño calculado
    height: imageSize, // Usa el tamaño calculado
    marginRight: margin, // Margen derecho entre imágenes
    marginBottom: margin, // Margen inferior entre imágenes
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // Mantiene la proporción sin deformarse
    borderRadius: 5, // Bordes redondeados para las imágenes
  },
  selectedImage: {
    opacity: 0.7, // Efecto de nitidez (opacidad reducida)
    borderWidth: 2, // Borde para resaltar
    borderColor: 'rgba(255, 255, 255, 0.8)', // Borde semi-transparente
  },
  trashIconContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  deleteModeContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  selectAllButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'red',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  flatList: {
    flex: 1,
  },
});