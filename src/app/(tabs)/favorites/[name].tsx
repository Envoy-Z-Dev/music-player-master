import { PlaylistTracksList } from '@/components/PlaylistTracksList';
import { screenPadding } from '@/constants/tokens';
import myTrackPlayer, { playListsStore } from '@/helpers/trackPlayerIndex';
import { Playlist } from '@/helpers/types';
import { defaultStyles } from '@/styles';
import { useNavigation, useRoute } from '@react-navigation/native'; // Use react-navigation for navigation
import React, { useCallback, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Track } from 'react-native-track-player';

const PlaylistScreen = () => {
	const route = useRoute();
	const navigation = useNavigation();
	const { name: playlistID } = route.params as { name: string };
	const playlists = playListsStore.useValue() as Playlist[] | null;

	const playlist = useMemo(() => {
		return playlists?.find((p) => p.id === playlistID);
	}, [playlistID, playlists]);

	const songs = useMemo(() => {
		return playlist?.tracks || [];
	}, [playlist]);

	const handleDeleteTrack = useCallback(
		(trackId: string) => {
			myTrackPlayer.deleteSongFromStoredPlayList(playlist as Playlist, trackId);
		},
		[playlist],
	);

	if (!playlist) {
		console.warn(`Playlist ${playlistID} was not found!`);
		navigation.navigate('favorites'); // Redirect to favorites screen
		return null; // Return null to prevent rendering
	}

	return (
		<View style={defaultStyles.container}>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{ paddingHorizontal: screenPadding.horizontal }}
			>
				<PlaylistTracksList
					playlist={playlist as Playlist}
					tracks={songs as Track[]}
					allowDelete={true}
					onDeleteTrack={handleDeleteTrack}
				/>
			</ScrollView>
		</View>
	);
};

export default PlaylistScreen;
