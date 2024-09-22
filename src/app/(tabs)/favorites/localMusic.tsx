import localImage from '@/assets/local.png';
import { PlaylistTracksList } from '@/components/PlaylistTracksList';
import { unknownTrackImageUri } from '@/constants/images';
import { screenPadding } from '@/constants/tokens';
import { logError, logInfo } from '@/helpers/logger';
import myTrackPlayer, { importedLocalMusicStore } from '@/helpers/trackPlayerIndex';
import { Playlist } from '@/helpers/types';
import { searchMusicInfoByName } from '@/helpers/userApi/getMusicSource';
import { defaultStyles } from '@/styles';
import MusicInfo from '@/utils/musicInfo';
import * as DocumentPicker from 'react-native-document-picker'; // Use react-native-document-picker
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { Track } from 'react-native-track-player';

const LocalMusicScreen = () => {
	const localTracks = importedLocalMusicStore.useValue();
	const [isLoading, setIsLoading] = useState(false);
	const playListItem = {
		name: 'Local',
		id: 'local',
		tracks: [],
		title: 'Local Songs',
		coverImg: Image.resolveAssetSource(localImage).uri,
		description: 'Songs available locally',
	};

	const importLocalMusic = async () => {
		try {
			setIsLoading(true);
			const result = await DocumentPicker.pick({
				type: [DocumentPicker.types.audio],
				multiple: true,
			});

			if (result.length === 0) {
				logInfo('User canceled file selection');
				setIsLoading(false);
				return;
			}

			if (result.length > 50) {
				Alert.alert('Warning', 'You can import a maximum of 50 songs at a time');
				setIsLoading(false);
				return;
			}

			const newTracks: IMusic.IMusicItem[] = await Promise.all(
				result
					.filter((file) => !myTrackPlayer.isExistImportedLocalMusic(file.name))
					.map(async (file) => {
						const metadata = await MusicInfo.getMusicInfoAsync(file.uri, {
							title: true,
							artist: true,
							album: true,
							genre: true,
							picture: true,
						});

						return {
							id: file.uri,
							title: metadata?.title || file.name || 'Unknown Title',
							artist: metadata?.artist || 'Unknown Artist',
							album: metadata?.album || 'Unknown Album',
							artwork: unknownTrackImageUri,
							url: file.uri,
							platform: 'local',
							duration: 0,
							genre: file.name || '',
						};
					}),
			);

			if (newTracks.length === 0) {
				console.log('No new tracks imported');
				setIsLoading(false);
				return;
			}

			const processedTracks = await Promise.all(
				newTracks.map(async (track) => {
					if (track.title !== 'Unknown Title') {
						try {
							const searchResult = await searchMusicInfoByName(track.title);
							logInfo('Search result:', searchResult);
							if (searchResult != null) {
								return {
									...track,
									id: searchResult.songmid || track.id,
									artwork: searchResult.artwork || track.artwork,
									album: searchResult.albumName || track.album,
								};
							} else {
								logError('No matching song found');
							}
						} catch (error) {
							logError(`Error fetching info for song "${track.title}":`, error);
						}
					}
					return track;
				}),
			);

			myTrackPlayer.addImportedLocalMusic(processedTracks);
		} catch (err) {
			logError('Error importing local music:', err);
		} finally {
			setIsLoading(false);
		}
	};

	function deleteLocalMusic(trackId: string): void {
        myTrackPlayer.deleteImportedLocalMusic(trackId);
    }

	return (
		<View style={defaultStyles.container}>
			{isLoading && (
				<View style={styles.loadingOverlay}>
					<ActivityIndicator size="large" color="#fff" />
				</View>
		 )}
		 <ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{ paddingHorizontal: screenPadding.horizontal }}
		 >
			 <PlaylistTracksList
				 playlist={playListItem as Playlist}
				 tracks={localTracks as Track[]}
				 showImportMenu={true}
				 onImportTrack={importLocalMusic}
				 allowDelete={true}
				 onDeleteTrack={deleteLocalMusic}
			 />
		 </ScrollView>
	  </View>
  );
};

const styles = StyleSheet.create({
 loadingOverlay: {
     position: 'absolute',
     left: 0,
     right: 0,
     top: 0,
     bottom: 0,
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: 'rgba(0,0,0,0.5)',
     zIndex: 1000,
 },
});

export default LocalMusicScreen;
