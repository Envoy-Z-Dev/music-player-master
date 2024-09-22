import GlobalButton from '@/components/GlobalButton';
import { StackScreenWithSearchBar } from '@/constants/layout';
import { defaultStyles } from '@/styles';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native'; 
import { View } from 'react-native';

const Stack = createNativeStackNavigator();

const SongsScreenLayout = () => {
	return (
		<NavigationContainer>
			<View style={defaultStyles.container}>
				<Stack.Navigator>
					<Stack.Screen
						name="index"
						options={{
							...StackScreenWithSearchBar,
							headerTitle: 'Songs',
							headerRight: () => <GlobalButton />,
						}}
					/>
				</Stack.Navigator>
			</View>
		</NavigationContainer>
	);
};

export default SongsScreenLayout;
