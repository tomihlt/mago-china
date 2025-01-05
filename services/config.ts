import AsyncStorage from '@react-native-async-storage/async-storage';

const setId = async (id: number) => {
    try {
        await AsyncStorage.setItem('last-id', id.toString());
    } catch (e) {
        // saving error
    }
};

const getId = async () => {
    try {
        const value = await AsyncStorage.getItem('last-id');
        if (value !== null) {
            return value;
        }
    } catch (e) {
        // error reading value
    }
}