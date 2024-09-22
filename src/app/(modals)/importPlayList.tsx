import { colors, screenPadding } from '@/constants/tokens';
import { logError } from '@/helpers/logger';
import myTrackPlayer from '@/helpers/trackPlayerIndex';
import { getPlayListFromQ } from '@/helpers/userApi/getMusicSource';
import { defaultStyles } from '@/styles';
import { Ionicons } from 'react-native-vector-icons/Ionicons';
import { useHeaderHeight } from '@react-navigation/elements';
import React, { useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'react-native-document-picker'; // Use react-native-document-picker

const ImportPlayList = () => {
	const [playlistUrl, setPlaylistUrl] = useState('');
	const [playlistData, setPlaylistData] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const headerHeight = useHeaderHeight();
	const { top } = useSafeAreaInsets();

	const handleImport = async () => {
		setIsLoading(true);
		setError(null);
		try {
			if (!playlistUrl.includes('id=')) throw new Error('Invalid link format');
			if (!playlistUrl) throw new Error('Link cannot be empty');

			const match = playlistUrl.match(/[?&]id=(\d+)/);
			const response = await getPlayListFromQ(match ? match[1] : null);
			setPlaylistData(response);
			myTrackPlayer.addPlayLists(response as IMusic.PlayList);
		} catch (err) {
			setError('Import failed, please check if the link is correct');
			logError('Import error:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const DismissPlayerSymbol = () => (
		<View style={[styles.dismissSymbol, { top: top - 25 }]}>
			<View style={styles.dismissBar} />
		</View>
	);

	return (
		<SafeAreaView style={[styles.modalContainer, { paddingTop: headerHeight }]}>
			<DismissPlayerSymbol />
			<Text style={styles.header}>Import Playlist</Text>
			<View style={styles.inputContainer}>
				<Text style={styles.inputLabel}>Playlist Link</Text>
				<TextInput
					style={styles.input}
					value={playlistUrl}
					onChangeText={setPlaylistUrl}
					placeholder='🔗 Enter the QQ Music playlist link containing "id="'
					placeholderTextColor="#999"
					autoCapitalize="none"
					autoCorrect={false}
				/>
			</View>
			<View style={styles.buttonContainer}>
				<TouchableOpacity
					onPress={handleImport}
					activeOpacity={0.8}
					style={styles.button}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator color="#fff" />
					) : (
						<>
							<Ionicons name={'enter-outline'} size={24} color={colors.primary} />
							<Text style={styles.buttonText}>Import</Text>
						</>
				 )}
			 </TouchableOpacity>
		 </View>
		 {error && <Text style={styles.error}>{error}</Text>}
		 {playlistData && (
			 <Text style={styles.successText}>Import successful! Playlist name: {playlistData.name}</Text>
		 )}
	  </SafeAreaView>
   );
};

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		paddingHorizontal: screenPadding.horizontal,
        backgroundColor: defaultStyles.container.backgroundColor,
    },
	buttonContainer: {
        marginTop: 0,
    },
	dismissSymbol: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        zIndex: 1,
    },
	dismissBar: {
        width: 50,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#c7c7cc',
    },
	inputContainer: {
        marginBottom: 20,
    },
	inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
	header: {
        fontSize: 31,
        fontWeight: 'bold',
        paddingTop: 5,
        color: colors.text,
    },
	input: {
        height: 44,
        backgroundColor: '#1C1C1F',
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 17,
        color: '#999',
    },
	button: {
        padding: 12,
        backgroundColor: 'rgba(47, 47, 47, 0.5)',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
	buttonText:{
       ...defaultStyles.text,
       color: colors.primary,
       fontWeight:'600',
       fontSize:'18',
       textAlign:'center'
    },
	error:{
       color:'#ff3b30',
       marginTop:'10'
    },
	successText:{
       color:'#34c759',
       marginTop:'10'
    }
});

export default ImportPlayList;
