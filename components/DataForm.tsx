import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import BottomButtons from './BottomButtons';

export default function DataForm() {

  // Estados para los campos del formulario
  const [nombreProveedor, setNombreProveedor] = useState('');
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidadBulto, setCantidadBulto] = useState('');
  const [cubicaje, setCubicaje] = useState('');

  // Función para resetear los valores del formulario
  const resetForm = () => {
    console.log('Formulario reiniciado');
    setNombreProveedor('');
    setCodigo('');
    setDescripcion('');
    setPrecio('');
    setCantidadBulto('');
    setCubicaje('');
  };

  return (
    <View>
        <Text style={styles.title}>Datos</Text>
      <ScrollView>
        <View style={{padding: 20, marginBottom: 50}}>
        <Text style={{ color: 'white' }}>Nombre Proveedor</Text>
          <TextInput style={styles.input} placeholder="Ingresa el nombre del proveedor" placeholderTextColor="gray" value={nombreProveedor} onChangeText={setNombreProveedor} />
          
          <Text style={{ color: 'white' }}>Código</Text>
          <TextInput style={styles.input} placeholder="Ingresa el código" placeholderTextColor="gray" keyboardType="numeric" value={codigo} onChangeText={setCodigo}/>
          
          <Text style={{ color: 'white' }}>Descripción</Text>
          <TextInput style={styles.input} placeholder="Ingresa la descripción" placeholderTextColor="gray" value={descripcion} onChangeText={setDescripcion}/>
          
          <Text style={{ color: 'white' }}>Precio</Text>
          <TextInput style={styles.input} placeholder="Ingresa el precio" placeholderTextColor="gray" keyboardType="numeric" value={precio} onChangeText={setPrecio}/>
          
          <Text style={{ color: 'white' }}>Cantidad por bulto</Text>
          <TextInput style={styles.input} placeholder="Ingresa la cantidad por bulto" placeholderTextColor="gray" keyboardType="numeric" value={cantidadBulto} onChangeText={setCantidadBulto}/>
          
          <Text style={{ color: 'white' }}>Cubicaje</Text>
          <TextInput style={styles.input} placeholder="Ingresa el cubicaje" placeholderTextColor="gray" keyboardType="numeric" value={cubicaje} onChangeText={setCubicaje}/>
          
          <BottomButtons resetForm={resetForm}/>
        </View>
        
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  title:{
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: 'rgba(55,55,55,0.5)',
    width: '100%',
    height: 40,
    color: 'white',
    textAlignVertical: 'center',
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 10,
    color: 'white',
    fontSize: 16,
  },
});