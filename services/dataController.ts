import AsyncStorage from '@react-native-async-storage/async-storage';
import objectHash from 'object-hash';

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

type Props = {
  image: string;
  form: FormData;
  objHash: string;
};

const getAllKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys(); // Obtén todas las claves
    console.log('Claves almacenadas:', keys);
  } catch (error) {
    console.error('Error al obtener las claves:', error);
  }
};

export const saveImage = async ({ image, form }: {image: string, form: FormData}) => {
  try {
    const objHash = objectHash({image, form}); // Genera un hash único para el objeto
    const jsonValue = JSON.stringify({image, form, objHash }); // el hash sera el id
    await AsyncStorage.setItem(objHash, jsonValue);
  } catch (e) {
    console.error('Error al guardar la imagen en AsyncStorage:', e);
  }
};

export const loadImages = async (): Promise<Props[]> => {
  try {
    // Obtiene todas las claves almacenadas
    const keys = await AsyncStorage.getAllKeys();
    
    // Si no hay claves, devuelve un array vacío
    if (!keys.length) {
      console.log('No hay datos almacenados');
      return [];
    }

    // Obtén todos los valores correspondientes a las claves
    const result = await AsyncStorage.multiGet(keys);

    // Filtra y parsea los valores válidos
    const images = result
      .map(([key, value]) => {
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (parsed.image && parsed.form && parsed.objHash) {
              return parsed as Props; // Aseguramos el tipo Props
            }
          } catch (error) {
            console.error(`Error al parsear el valor con clave ${key}:`, error);
          }
        }
        return null;
      })
      .filter(Boolean) as Props[]; // Filtra los valores nulos o inválidos

    console.log('Datos cargados:', images);
    return images; // Devuelve todas las imágenes y formularios
  } catch (e) {
    console.error('Error al cargar los datos de AsyncStorage:', e);
    return [];
  }
};

export const deleteImage = async ( objHash : string ) => {

  try {
    //const objHash = objectHash({image, form}); // Genera un hash único para el objeto
    await AsyncStorage.removeItem(objHash);
    console.log('Imagen eliminada:', objHash);
  } catch (e) {
    console.error('Error al eliminar la imagen en AsyncStorage:', e);
  }

};