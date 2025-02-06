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

export const updateImageData = async (objHash: string, newFormData: FormData, imageUri: string): Promise<boolean> => {
  try {
    // Obtén el valor actual almacenado con la clave objHash
    const currentValue = await AsyncStorage.getItem(objHash);

    if (currentValue) {
      // Parsea el valor actual
      const parsedValue: Props = JSON.parse(currentValue);

      // Genera un nuevo hash con la URI de la imagen y el nuevo formulario
      const newObjHash = objectHash({ image: imageUri, form: newFormData });

      // Crea el nuevo objeto con los datos actualizados y el nuevo hash
      const updatedData = {
        image: imageUri, // Mantén la misma URI de la imagen o actualízala si es necesario
        form: newFormData,
        objHash: newObjHash, // Usa el nuevo hash
      };

      // Elimina la entrada antigua de AsyncStorage
      await AsyncStorage.removeItem(objHash);

      // Guarda los datos actualizados con el nuevo hash
      await AsyncStorage.setItem(newObjHash, JSON.stringify(updatedData));

      console.log('Datos actualizados exitosamente con nuevo hash:', updatedData);
      return true; // Indica que la actualización fue exitosa
    } else {
      console.error('No se encontró la imagen con el hash proporcionado:', objHash);
      return false; // Indica que no se encontró la imagen
    }
  } catch (e) {
    console.error('Error al actualizar la imagen en AsyncStorage:', e);
    return false; // Indica que hubo un error
  }
};