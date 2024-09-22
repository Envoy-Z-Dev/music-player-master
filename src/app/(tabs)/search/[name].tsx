import { screenPadding } from '@/constants/tokens';
import { usePlaylists } from '@/store/library';
import { defaultStyles } from '@/styles';
import { useNavigation, useRoute } from '@react-navigation/native'; // Use react-navigation for navigation
import { ScrollView, View } from 'react-native';
import { Track } from 'react-native-track-player';

const PlaylistScreen = () => {
	const route = useRoute();
	const navigation = useNavigation();
	const { name: playlistName } = route.params as { name: string };

	const { playlists } = usePlaylists();

	const playlist = playlists.find((playlist) => playlist.name === playlistName);

	if (!playlist) {
		console.warn(`Playlist ${playlistName} was not found!`);
		navigation.navigate('search'); // Redirect to search screen
		return null; // Return null to prevent rendering
	}

	return (
		<View style={defaultStyles.container}>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{ paddingHorizontal: screenPadding.horizontal }}
			>
				{/* Render playlist details here */}
			</ScrollView>
		</View>
	);
};

export default PlaylistScreen;
