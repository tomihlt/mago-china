import { Text, View, StyleSheet, Image } from 'react-native';

import ImageViewerAct from '@/components/ImageViewerAct';

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageViewerAct/>
      </View>
      <View style={styles.formContainer}>
        <Text>Form</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  text: {
    color: '#fff',
    marginTop: 50,
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
  imageContainer: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    
  },
  formContainer: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
    marginTop: 20,
    width: '100%',
    flex:5
  },
});
