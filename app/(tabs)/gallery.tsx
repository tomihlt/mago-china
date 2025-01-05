import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, Animated, Pressable, Dimensions } from 'react-native';
import { loadImages } from '@/services/saveImage'; // Asegúrate de que esta función cargue todas las imágenes.
import { useFocusEffect } from '@react-navigation/native'; // Importa el hook

export default function GalleryScreen() {
  const [images, setImages] = useState<{ image: string; form: any }[]>([]);

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

  // useEffect para cargar las imágenes y datos al montar el componente
  {/*useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadImageAndForm(); // Cargar todas las imágenes y sus datos
        if (data) {
          setImages(data); // Asumiendo que 'data' es un arreglo de objetos con las imágenes y datos
        }
      } catch (error) {
        console.error('Error al cargar las imágenes:', error);
      }
    };

    fetchData(); // Llamada a la función asíncrona
  }, []); // Solo ejecutarse una vez al montar el componente*/}

  // Función para renderizar cada imagen en la lista
  const renderItem = ({ item }: { item: { image: string; form: any } }) => (
    <Pressable style={styles.imageContainer} onPress={() => console.log(item.form.nombreProveedor)}>
      <Animated.Image source={{ uri: item.image }} style={styles.image} />
      {/*<Text style={styles.text}>Nombre: {item.form.nombreProveedor}</Text>
      <Text style={styles.text}>Código: {item.form.codigo}</Text>*/}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={images} // El arreglo de imágenes que quieres mostrar
        renderItem={renderItem} // Función para renderizar cada imagen
        keyExtractor={(item, index) => index.toString()} // Usamos el índice como clave única (puedes usar un ID si lo tienes)
        horizontal={ false }
        style={styles.flatList}
        numColumns={4} // Número de columnas
        showsVerticalScrollIndicator={false} // Ocultar barra de desplazamiento vertical

      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#25292e', padding: 10 },
  imageContainer: { marginBottom: 20, alignItems: 'center', width: Dimensions.get('window').width/4 },
  image: { height: 100, width: 100, resizeMode: 'contain' },
  text: { color: '#fff', textAlign: 'center' },
  flatList: { },
});
