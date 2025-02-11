import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { exportToExcel } from '@/services/excel';
import { getCode, updateCode } from '@/services/config'; // Importar las funciones de config.ts
import { useFocusEffect } from 'expo-router';

export default function OptionsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [fileName, setFileName] = useState('');
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [savedCode, setSavedCode] = useState(0);

  const fetchSavedCode = async () => {
    const code = await getCode();
    setSavedCode(code);
    setCodeInput(`EM-${code}`);
  };

  // Cargar el código guardado cuando el modal se abre
  useEffect(() => {
    if (codeModalVisible) {
      fetchSavedCode();
    }
  }, [codeModalVisible]);

  const handleExport = async () => {
    if (!fileName) {
      Alert.alert('Error', 'Debes ingresar un nombre para el archivo.');
      return;
    }

    try {
      await exportToExcel(fileName);
      setModalVisible(false);
      setFileName('');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      Alert.alert('Error', 'No se pudo exportar el archivo Excel.');
    }
  };

  const handleCodeChange = (text: string) => {
    // Permite borrar todo el texto sin forzarlo de inmediato
    if (text === '' || text === 'EM-') {
      setCodeInput('EM-'); // Mantiene el prefijo pero permite borrado
      return;
    }
  
    // Si el usuario intenta eliminar el prefijo, lo restaura
    if (!text.startsWith('EM-')) {
      setCodeInput('EM-');
      return;
    }
  
    // Extraer solo los números después de "EM-"
    const numericValue = text.slice(3).replace(/[^0-9]/g, '');
  
    // Permitir que el usuario edite normalmente
    setCodeInput(`EM-${numericValue}`);
  };

  const handleSaveCode = async () => {
    if (!codeInput.startsWith('EM-')) {
      Alert.alert('Error', 'El código debe comenzar con "EM-"');
      return;
    }
  
    const numericPart = codeInput.replace('EM-', '').trim();
    if (numericPart === '') {
      Alert.alert('Error', 'Debes ingresar un número después de "EM-"');
      return;
    }
  
    const newCode = parseInt(numericPart, 10);
    await updateCode(newCode);
    setSavedCode(newCode);
    setCodeModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Botón para cambiar el código */}
      <Pressable style={styles.newProjectContainer} onPress={() => setCodeModalVisible(true)}>
        <Ionicons name="caret-forward" size={24} color="white" />
        <Text style={styles.text}> Cambiar código </Text>
      </Pressable>

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

      {/* Modal para cambiar el código */}
      <Modal
        visible={codeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCodeModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar código</Text>
            <TextInput
              style={styles.input}
              placeholder="EM-"
              value={codeInput}
              onChangeText={handleCodeChange}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButton} onPress={() => setCodeModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.modalButton} onPress={handleSaveCode}>
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