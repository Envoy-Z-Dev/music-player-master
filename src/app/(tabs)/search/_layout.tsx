import { StackScreenWithSearchBar } from '@/constants/layout';
import { colors } from '@/constants/tokens';
import { defaultStyles } from '@/styles';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native'; 
import { View } from 'react-native';

const Stack = createNativeStackNavigator();

const PlaylistsScreenLayout = () => {
	return (
		<NavigationContainer>
			<View style={defaultStyles.container}>
				<Stack.Navigator>
					<Stack.Screen
						name="index"
						options={{
							...StackScreenWithSearchBar,
							headerTitle: 'Search',
						}}
					/>
					<Stack.Screen
						name="[name]"
						options={{
							headerTitle: '',
							headerBackVisible: true,
							headerStyle: {
								backgroundColor: colors.background,
							},
							headerTintColor: colors.primary,
						}}
					/>
				</Stack.Navigator>
			</View>
		</NavigationContainer>
	);
};

export default PlaylistsScreenLayout;
