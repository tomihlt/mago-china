import AsyncStorage from '@react-native-async-storage/async-storage';
import objectHash from 'object-hash';

type FormData = {
  nombreProveedor: string;
  codigo: string;
  descripcion: string;
  precio: string;
  cantidadBulto: string;
  cubicaje: string;
};

type Props = {
  image: string;
  form: FormData;
};

const getAllKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys(); // Obtén todas las claves
    console.log('Claves almacenadas:', keys);
  } catch (error) {
    console.error('Error al obtener las claves:', error);
  }
};

export const saveImage = async ({ image, form }: Props) => {
  try {
    const objHash = objectHash({image, form}); // Genera un hash único para el objeto
    const jsonValue = JSON.stringify({image, form });
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
            if (parsed.image && parsed.form) {
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

  
