import { playbackService } from '@/constants/playbackService';
import { colors } from '@/constants/tokens';
import { useLogTrackPlayerState } from '@/hooks/useLogTrackPlayerState';
import { useSetupTrackPlayer } from '@/hooks/useSetupTrackPlayer';
import { StatusBar } from 'react-native-status-bar';
import { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TrackPlayer from 'react-native-track-player';
import { NavigationContainer } from '@react-navigation/native'; 
import { createNativeStackNavigator } from '@react-navigation/native-stack';

TrackPlayer.registerPlaybackService(() => playbackService);

const Stack = createNativeStackNavigator();

const App = () => {
	const handleTrackPlayerLoaded = useCallback(() => {
		setTimeout(() => {}, 1500);
	}, []);

	useSetupTrackPlayer({
		onLoad: handleTrackPlayerLoaded,
	});

	useLogTrackPlayerState();

	return (
		<SafeAreaProvider>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<RootNavigation />
				<StatusBar style="auto" />
			</GestureHandlerRootView>
		</SafeAreaProvider>
	);
};

const RootNavigation = () => {
	return (
		<NavigationContainer>
			<Stack.Navigator>
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				<Stack.Screen
					name="player"
					options={{
						presentation: 'card',
						gestureEnabled: true,
						gestureDirection: 'vertical',
						animationDuration: 400,
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="(modals)/playList"
					options={{
						presentation: 'modal',
						gestureEnabled: true,
						gestureDirection: 'vertical',
						animationDuration: 400,
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="(modals)/addToPlaylist"
					options={{
						presentation: 'modal',
						headerStyle: {
							backgroundColor: colors.background,
						},
						headerTitle: 'Add to Playlist',
						headerTitleStyle: {
							color: colors.text,
						},
					}}
				/>
				<Stack.Screen
					name="(modals)/settingModal"
					options={{
						presentation: 'modal',
						headerShown: false,
						gestureEnabled: true,
						gestureDirection: 'vertical',
					}}
				/>
				<Stack.Screen
					name="(modals)/importPlayList"
					options={{
						presentation: 'modal',
						headerShown: false,
						gestureEnabled: true,
						gestureDirection: 'vertical',
					}}
				/>
				<Stack.Screen
					name="(modals)/[name]"
					options={{
						presentation: 'modal',
						headerShown: false,
						gestureEnabled: true,
						gestureDirection: 'vertical',
					}}
				/>
				<Stack.Screen
					name="(modals)/logScreen"
					options={{
						presentation: 'modal',
						headerShown: true,
						gestureEnabled: true,
						gestureDirection: 'vertical',
						headerTitle: 'Application Log',
						headerStyle: {
							backgroundColor: colors.background,
						},
						headerTitleStyle: {
							color: colors.text,
						},
					}}
				/>
			</Stack.Navigator>
		</NavigationContainer>
    );
};

export default App;
