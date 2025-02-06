import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { deleteImage, updateImageData } from '@/services/dataController'; // Asegúrate de tener esta función en tu servicio

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
  const [isEditing, setIsEditing] = useState(false); // Estado para modo edición
  const [formData, setFormData] = useState<FormData>({
    nombreProveedor: '',
    codigo: '',
    descripcion: '',
    precio: '',
    cantidadBulto: '',
    cubicaje: '',
    peso: '',
    obs: '',
  });

  const { image, form, objHash } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  const formString = Array.isArray(form) ? form[0] : form;

  useEffect(() => {
    navigation.setOptions({
      headerShown: false, // Oculta el header
    });

    if (formString) {
      const parsedForm: FormData = JSON.parse(formString);
      setFormData(parsedForm); // Inicializa el estado con los datos del formulario
    }
  }, [navigation, formString]);

  if (!image || !formString || !objHash) {
    return <Text>Los datos de la imagen no están disponibles.</Text>;
  }

  const imageUri = encodeURI(Array.isArray(image) ? image[0] : image);

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

  const handleEdit = () => {
    setIsEditing(true); // Entrar en modo edición
  };

  const handleSave = () => {
    Alert.alert(
      "Guardar Cambios",
      "¿Estás seguro de que deseas guardar los cambios?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Guardar",
          onPress: () => {
            updateImageData(objHash as string, formData, imageUri as string) // Actualiza los datos en el servidor
              .then(() => {
                console.log('Datos actualizados exitosamente');
                setIsEditing(false); // Salir del modo edición
              })
              .catch((error: any) => {
                console.error('Error al actualizar los datos:', error);
              });
          },
        },
      ]
    );
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Image source={{ uri: imageUri }} style={styles.image} />
        <Text style={styles.title}>Detalles de la Imagen</Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.label}>Nombre Proveedor:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.nombreProveedor}
              onChangeText={(text) => handleChange('nombreProveedor', text)}
            />
          ) : (
            <Text style={styles.value}>{formData.nombreProveedor}</Text>
          )}

          <Text style={styles.label}>Código:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.codigo}
              onChangeText={(text) => handleChange('codigo', text)}
            />
          ) : (
            <Text style={styles.value}>{formData.codigo}</Text>
          )}

          {/* Repite este patrón para los demás campos */}
          <Text style={styles.label}>Descripción:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.descripcion}
              onChangeText={(text) => handleChange('descripcion', text)}
            />
          ) : (
            <Text style={styles.value}>{formData.descripcion}</Text>
          )}

          <Text style={styles.label}>Precio:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.precio}
              onChangeText={(text) => handleChange('precio', text)}
            />
          ) : (
            <Text style={styles.value}>{formData.precio}</Text>
          )}

          <Text style={styles.label}>Cantidad por Bulto:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.cantidadBulto}
              onChangeText={(text) => handleChange('cantidadBulto', text)}
            />
          ) : (
            <Text style={styles.value}>{formData.cantidadBulto}</Text>
          )}

          <Text style={styles.label}>Cubicaje:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.cubicaje}
              onChangeText={(text) => handleChange('cubicaje', text)}
            />
          ) : (
            <Text style={styles.value}>{formData.cubicaje}</Text>
          )}

          <Text style={styles.label}>Peso:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.peso}
              onChangeText={(text) => handleChange('peso', text)}
            />
          ) : (
            <Text style={styles.value}>{formData.peso}</Text>
          )}

          <Text style={styles.label}>Observaciones:</Text>
          {isEditing ? (
            <TextInput
              style={styles.input}
              value={formData.obs}
              onChangeText={(text) => handleChange('obs', text)}
            />
          ) : (
            <Text style={styles.value}>{formData.obs}</Text>
          )}
        </View>
      </View>

      {/* Botones */}
      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.buttonIsPressed,
              ]}
              onPress={handleSave}
            >
              <Ionicons name="save" size={20} color="rgb(81, 196, 71)" />
              <Text style={styles.buttonTextSave}>Guardar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonIsPressed,
              ]}
              onPress={() => setIsEditing(false)}
            >
              <Ionicons name="close" size={20} color="rgb(252, 59, 59)" />
              <Text style={styles.buttonTextCancel}>Cancelar</Text>
            </Pressable>
          </>
        ) : (
          <>
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
                styles.editButton,
                pressed && styles.buttonIsPressed,
              ]}
              onPress={handleEdit}
            >
              <Ionicons name="pencil" size={20} color="rgb(255, 192, 75)" />
              <Text style={styles.buttonTextEdit}>Editar</Text>
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
          </>
        )}
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
  input: {
    fontSize: 16,
    color: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderColor: 'rgb(255, 192, 75)',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(81, 196, 71, 0.1)',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderColor: 'rgb(81, 196, 71)',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(81, 196, 71, 0.1)',
  },
  cancelButton: {
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
  buttonTextEdit: {
    color: 'rgb(255, 192, 75)',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  buttonTextSave: {
    color: 'rgb(81, 196, 71)',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  buttonTextCancel: {
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