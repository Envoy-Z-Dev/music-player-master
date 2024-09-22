import { PlaylistsList } from '@/components/PlaylistsList';
import { screenPadding } from '@/constants/tokens';
import { playlistNameFilter, trackTitleFilter } from '@/helpers/filter';
import { Playlist } from '@/helpers/types';
import { useNavigationSearch } from '@/hooks/useNavigationSearch';
import { usePlaylists } from '@/store/library';
import { defaultStyles } from '@/styles';
import { useNavigation } from '@react-navigation/native'; // Use react-navigation for navigation
import { useEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { getTopListDetail, getTopLists } from '@/helpers/userApi/getMusicSource';
import { Track } from 'react-native-track-player';
import { RadioList } from '@/components/RadioList';

const RadiolistsScreen = () => {
	const navigation = useNavigation();

	const search = useNavigationSearch({
		searchBarOptions: {
			placeholder: 'Find in Radio',
		},
	});

	const { playlists, setPlayList } = usePlaylists();
	const filteredPlayLists = useMemo(() => {
		if (!search) return playlists;
		return playlists.filter(playlistNameFilter(search));
	}, [search, playlists]);

	const handlePlaylistPress = (playlist: Playlist) => {
		navigation.navigate(`/(tabs)/radio/${playlist.title}`);
	};

	return (
		<View style={defaultStyles.container}>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{
					paddingHorizontal: screenPadding.horizontal,
				}}
			>
				<RadioList
					scrollEnabled={false}
					playlists={filteredPlayLists}
					onPlaylistPress={handlePlaylistPress}
				/>
			</ScrollView>
		</View>
	);
};

export default RadiolistsScreen;
