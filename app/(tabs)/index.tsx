import { useState } from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';

import ImageViewerAct from '@/components/ImageViewerAct';
import DataForm from '@/components/DataForm';
const noPhoto = require('@/assets/images/noPhoto.png');

export default function Index() {

  const [image, setImage] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageViewerAct img={image} setImage={setImage}/>
      </View>
      <View style={styles.formContainer}>
        <DataForm setImage={setImage}/>
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
    borderWidth: 1,
    borderColor: 'rgb(58, 58, 58)',
    width: '100%',
    alignItems: 'center',
  },
  formContainer: {
    borderWidth: 1,
    borderColor: 'rgb(58, 58, 58)',
    width: '100%',
    flex: 1,
  },
});
