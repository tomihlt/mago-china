import { View, Text, StyleSheet, ScrollView } from 'react-native';
import BottomButtons from './BottomButtons';

export default function DataForm() {
  return (
    <View>
        <Text style={styles.title}>Datos</Text>
      <ScrollView>
        <View style={{padding: 20, marginBottom: 50}}>
          <Text style={{color: 'white'}}>Nombre</Text>
          <Text style={{color: 'white'}}>Apellido</Text>
          <Text style={{color: 'white'}}>DNI</Text>
          <Text style={{color: 'white'}}>Fecha de nacimiento</Text>
          <Text style={{color: 'white'}}>Sexo</Text>
          <Text style={{color: 'white'}}>Dirección</Text>
          <Text style={{color: 'white'}}>Localidad</Text>
          <Text style={{color: 'white'}}>Provincia</Text>
          <Text style={{color: 'white'}}>Código postal</Text>
          <Text style={{color: 'white'}}>Teléfono</Text>
          <Text style={{color: 'white'}}>Email</Text>
        </View>
        <BottomButtons/>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  title:{
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(55,55,55,0.5)',
    width: '100%',
    height: 40,
    color: 'white',
    textAlignVertical: 'center',
  },
});