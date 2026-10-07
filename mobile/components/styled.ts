// Componenti di terze parti avvolti una sola volta per il supporto a className (regola Uniwind:
// mai avvolgere quelli di react-native o Reanimated, che lo hanno già).
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { withUniwind } from 'uniwind';

export const Image = withUniwind(ExpoImage);
export const LinearGradient = withUniwind(ExpoLinearGradient);
