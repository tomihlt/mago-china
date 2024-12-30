import { Text, View, StyleSheet, Image } from 'react-native';

import ImageViewerAct from '@/components/ImageViewerAct';
import DataForm from '@/components/DataForm';

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageViewerAct/>
      </View>
      <View style={styles.formContainer}>
        <DataForm/>
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
