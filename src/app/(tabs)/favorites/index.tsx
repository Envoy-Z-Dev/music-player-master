import localImage from '@/assets/local.png';
import { PlaylistsList } from '@/components/PlaylistsList';
import { screenPadding } from '@/constants/tokens';
import { playListsStore } from '@/helpers/trackPlayerIndex';
import { Playlist } from '@/helpers/types';
import { useNavigationSearch } from '@/hooks/useNavigationSearch';
import { defaultStyles } from '@/styles';
import { useNavigation } from '@react-navigation/native'; // Use react-navigation for navigation
import { useMemo } from 'react';
import { Image, ScrollView, View } from 'react-native';

const FavoritesScreen = () => {
	const navigation = useNavigation();
	const search = useNavigationSearch({
		searchBarOptions: {
			placeholder: 'Find in favorites',
		},
	});

	const favoritePlayListItem = {
		name: 'Favorites',
		id: 'favorites',
		tracks: [],
		title: 'Favorite Songs',
		coverImg: 'https://y.qq.com/mediastyle/global/img/cover_like.png?max_age=2592000',
		description: 'Favorite Songs',
	};

	const localPlayListItem = {
		name: 'Local',
		id: 'local',
		tracks: [],
		title: 'Local Songs',
		coverImg: Image.resolveAssetSource(localImage).uri,
		description: 'Songs available locally',
	};

	const storedPlayLists = playListsStore.useValue() || [];
	const playLists = [favoritePlayListItem, localPlayListItem, ...storedPlayLists];

	const filteredPlayLists = useMemo(() => {
		if (!search) return playLists as Playlist[];

		return playLists.filter((playlist: Playlist) =>
			playlist.name.toLowerCase().includes(search.toLowerCase()),
		) as Playlist[];
	}, [search, playLists]);

	const handlePlaylistPress = (playlist: Playlist) => {
		if (playlist.name === 'Favorites') {
			navigation.navigate('favorites/favoriteMusic'); // Use navigation to go to favorite music
		} else if (playlist.name === 'Local') {
			navigation.navigate('favorites/localMusic'); // Use navigation to go to local music
		} else {
			navigation.navigate(`favorites/${playlist.id}`); // Use navigation for other playlists
		}
	};

	return (
		<View style={defaultStyles.container}>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{
					paddingHorizontal: screenPadding.horizontal,
				}}
			>
				<PlaylistsList
					scrollEnabled={false}
					playlists={filteredPlayLists as Playlist[]}
					onPlaylistPress={handlePlaylistPress}
				/>
			</ScrollView>
		</View>
	);
};

export default FavoritesScreen;
