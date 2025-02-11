import AsyncStorage from '@react-native-async-storage/async-storage';

export const setCode = async (code: number) => {

    try {
        await AsyncStorage.setItem('last-code', code.toString());
    } catch (e) {
        // saving error
    }

};

export const getCode = async (): Promise<number> => {

    try {
        const code = await AsyncStorage.getItem('last-code');
        return code === null ? 0 : parseInt(code);
    } catch (e) {
        // error reading value
        return 0;
    }

}

export const updateCode = async (code: number) => {
    try {
        await AsyncStorage.setItem('last-code', code.toString());
    } catch (e) {
        // saving error
    }
}