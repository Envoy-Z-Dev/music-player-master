import { PlaylistsListModal } from '@/components/PlaylistsListModal';
import { screenPadding } from '@/constants/tokens';
import myTrackPlayer from '@/helpers/trackPlayerIndex';
import { useFavorites } from '@/store/library';
import { defaultStyles } from '@/styles';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation, useRoute } from '@react-navigation/native'; // Use react-navigation for navigation
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Track } from 'react-native-track-player';

const AddToPlaylistModal = () => {
	const navigation = useNavigation();
	const route = useRoute();

	const track: IMusic.IMusicItem = {
		title: route.params.title as string,
		album: route.params.album as string,
		artwork: route.params.artwork as string,
		artist: route.params.artist as string,
		id: route.params.id as string,
		url: (route.params.url as string) || 'Unknown',
		platform: (route.params.platform as string) || 'tx',
		duration: typeof route.params.duration === 'string' ? parseInt(route.params.duration, 10) : 0,
	};

	const headerHeight = useHeaderHeight();

	const { favorites, toggleTrackFavorite } = useFavorites();

	if (!track) {
		return null;
	}

	const handlePlaylistPress = async (playlist: IMusic.PlayList) => {
		if (playlist.id === 'favorites') {
			if (favorites.find((item) => item.id === track.id)) {
				console.log('Already favorited');
			} else {
				toggleTrackFavorite(track as Track);
			}
		} else {
			myTrackPlayer.addSongToStoredPlayList(playlist, track);
		}

		navigation.goBack();
		Alert.alert('Success', 'Added successfully');
	};

	return (
		<SafeAreaView style={[styles.modalContainer, { paddingTop: headerHeight }]}>
			<PlaylistsListModal onPlaylistPress={handlePlaylistPress} />
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		paddingHorizontal: screenPadding.horizontal,
		backgroundColor: defaultStyles.container.backgroundColor,
	},
});

export default AddToPlaylistModal;
