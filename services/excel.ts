import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import { loadImages } from './dataController';
import { Alert, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher'; // Para abrir el archivo en Android

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

type ImageData = {
  image: string;
  form: FormData;
  objHash: string;
  timestamp: string;
};

export const exportToExcel = async (fileName: string) => {
  try {
    // Cargar todas las imágenes y datos
    const images: ImageData[] = await loadImages();

    // Verificar si hay datos para exportar
    if (images.length === 0) {
      Alert.alert('Info', 'No hay datos para exportar.');
      return;
    }

    // Crear un array de objetos con los datos que queremos exportar
    const data = images.map((item) => ({
      'Nombre Proveedor': item.form.nombreProveedor,
      'Código': item.form.codigo,
      'Descripción': item.form.descripcion,
      'Precio': item.form.precio,
      'Cantidad por Bulto': item.form.cantidadBulto,
      'Cubicaje': item.form.cubicaje,
      'Peso': item.form.peso,
      'Observaciones': item.form.obs,
      'Fecha y hora de la imagen': item.timestamp,
    }));

    // Crear una hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(data);

    // Crear un libro de trabajo y añadir la hoja de cálculo
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');

    // Generar un archivo binario de Excel
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    // Asegurarse de que el nombre del archivo tenga la extensión .xlsx
    const fullFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

    if (Platform.OS === 'android') {
      // Guardar en la carpeta de Documentos en Android usando SAF
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        Alert.alert('Error', 'Se necesitan permisos para guardar el archivo.');
        return;
      }

      const uri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fullFileName,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert('Éxito', `El archivo se ha guardado en Documentos como: ${fullFileName}`);
    } else if (Platform.OS === 'ios') {
      // Guardar en la carpeta de documentos de la aplicación en iOS
      const uri = FileSystem.documentDirectory + fullFileName;
      await FileSystem.writeAsStringAsync(uri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert('Éxito', `El archivo se ha guardado en Documentos como: ${fullFileName}`);
    }
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    Alert.alert('Error', 'No se pudo exportar el archivo Excel.');
  }
};