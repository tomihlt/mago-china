import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { exportToExcel } from '@/services/excel';

export default function OptionsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleExport = async () => {
    if (!fileName) {
      Alert.alert('Error', 'Debes ingresar un nombre para el archivo.');
      return;
    }

    try {
      await exportToExcel(fileName); // Llama a la función para exportar a Excel
      setModalVisible(false); // Cierra el modal después de exportar
      setFileName(''); // Limpia el nombre del archivo
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo Excel.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Botón para nuevo proyecto */}
      {/* <Pressable style={styles.newProjectContainer}>
        <Ionicons name="caret-forward" size={24} color="white" />
        <Text style={styles.text}> Nuevo proyecto </Text>
      </Pressable> */}

      {/* Botón para exportar a Excel */}
      <Pressable style={styles.exportButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="document-text-outline" size={24} color="white" />
        <Text style={styles.text}> Exportar a Excel </Text>
      </Pressable>

      {/* Modal para pedir el nombre del archivo */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Guardar archivo Excel</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa el nombre del archivo"
              value={fileName}
              onChangeText={setFileName}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.modalButton} onPress={handleExport}>
                <Text style={styles.modalButtonText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#25292e',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    fontWeight: 'bold',
    padding: 10,
  },
  text: {
    color: '#fff',
    marginLeft: 10,
  },
  newProjectContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  exportButton: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    backgroundColor: '#444',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});