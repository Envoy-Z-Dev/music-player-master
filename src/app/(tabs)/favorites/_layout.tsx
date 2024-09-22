import AddPlayListButton from '@/components/AddPlayListButton';
import { StackScreenWithSearchBar } from '@/constants/layout';
import { colors } from '@/constants/tokens';
import { defaultStyles } from '@/styles';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native'; 
import { View } from 'react-native';

const Stack = createNativeStackNavigator();

const FavoritesScreenLayout = () => {
	return (
		<NavigationContainer>
			<View style={defaultStyles.container}>
				<Stack.Navigator>
					<Stack.Screen
						name="index"
						options={{
							...StackScreenWithSearchBar,
							headerTitle: 'Favorites',
							headerRight: () => <AddPlayListButton />,
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
					<Stack.Screen
						name="favoriteMusic"
						options={{
							headerTitle: '',
							headerBackVisible: true,
							headerStyle: {
								backgroundColor: colors.background,
							},
							headerTintColor: colors.primary,
						}}
					/>
					<Stack.Screen
						name="localMusic"
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

export default FavoritesScreenLayout;
