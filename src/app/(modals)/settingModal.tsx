import { colors } from '@/constants/tokens';
import { logError, logInfo } from '@/helpers/logger';
import myTrackPlayer, {
	musicApiSelectedStore,
	musicApiStore,
	nowApiState,
	useCurrentQuality,
} from '@/helpers/trackPlayerIndex';
import { MenuView } from '@react-native-menu/menu';
import { Buffer } from 'buffer';
import * as DocumentPicker from 'react-native-document-picker'; // Use react-native-document-picker
import { useNavigation } from '@react-navigation/native'; // Use react-navigation for navigation
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Image,
	Linking,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import RNFS from 'react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const QUALITY_OPTIONS = ['128k', '320k', 'flac'];
const CURRENT_VERSION = '1.0.0'; // Replace with your version logic

const MusicQualityMenu = ({ currentQuality, onSelectQuality }) => {
	const handlePressAction = async (id: string) => {
		if (QUALITY_OPTIONS.includes(id)) {
			onSelectQuality(id);
		}
	};

	return (
		<MenuView
			onPressAction={({ nativeEvent: { event } }) => handlePressAction(event)}
			actions={QUALITY_OPTIONS.map((quality) => ({
				id: quality,
				title: quality,
				state: currentQuality === quality ? 'on' : 'off',
			}))}
		>
			<TouchableOpacity style={styles.menuTrigger}>
				<Text style={styles.menuTriggerText}>{currentQuality}</Text>
			</TouchableOpacity>
		</MenuView>
	);
};

const MusicSourceMenu = ({ isDelete, onSelectSource }) => {
	const [sources, setSources] = useState([]);
	const selectedApi = musicApiSelectedStore.useValue();
	const musicApis = musicApiStore.useValue();

	useEffect(() => {
		if (musicApis && Array.isArray(musicApis)) {
			setSources(
				musicApis.map((api) => ({
					id: api.id,
					title: api.name,
				})),
			);
		} else {
			setSources([]);
		}
	}, [musicApis]);

	const handlePressAction = async (id: string) => {
		onSelectSource(id);
	};

	return (
		<MenuView
			onPressAction={({ nativeEvent: { event } }) => handlePressAction(event)}
			actions={sources.map((source) => ({
				id: source.id,
				title: isDelete ? `Delete ${source.title}` : source.title,
				state: isDelete ? 'off' : selectedApi && selectedApi.id === source.id ? 'on' : 'off',
				attributes: isDelete ? { destructive: true } : undefined,
			}))}
		>
			<TouchableOpacity style={styles.menuTrigger}>
				<Text style={styles.menuTriggerText}>
					{isDelete ? 'Select to Delete' : selectedApi ? selectedApi.name : 'Select Source'}
				</Text>
		 </TouchableOpacity>
	  </MenuView>
   );
};

const importMusicSourceFromUrl = async () => {
    Alert.prompt(
        'Import Music Source',
        'Enter the source URL',
        [
            {
                text: 'Cancel',
                onPress: () => logInfo('Import canceled'),
                style: 'cancel',
            },
            {
                text: 'OK',
                onPress: async (url) => {
                    if (!url) {
                        Alert.alert('Error', 'URL cannot be empty');
                        return;
                    }

                    try {
                        const response = await fetch(url);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const sourceCode = await response.text();
                        const utf8SourceCode = Buffer.from(sourceCode, 'utf8').toString('utf8');

                        logInfo('Fetched source code:', utf8SourceCode);

                        const module = { exports: {} };
                        const require = () => {};
                        const moduleFunc = new Function('module', 'exports', 'require', utf8SourceCode);
                        moduleFunc(module, module.exports, require);

                        const musicApi = {
                            id: module.exports.id || '',
                            platform: 'tx',
                            author: module.exports.author || '',
                            name: module.exports.name || '',
                            version: module.exports.version || '',
                            srcUrl: module.exports.srcUrl || '',
                            script: utf8SourceCode,
                            isSelected: false,
                            getMusicUrl: module.exports.getMusicUrl,
                        };

                        myTrackPlayer.addMusicApi(musicApi);
                    } catch (error) {
                        logError('Failed to import music source:', error);
                        Alert.alert('Error', 'Failed to import music source. Please check the URL and try again.');
                    }
                },
            },
        ],
        'plain-text',
    );
};

const importMusicSourceFromFile = async () => {
	try {
        const result = await DocumentPicker.pick({
            type: [DocumentPicker.types.allFiles],
            copyToCacheDirectory: false,
        });

        if (result.canceled === true) {
            logInfo('User canceled document picker');
            return;
        }

        const fileUri = decodeURIComponent(result.uri);
        const fileContents = await RNFS.readFile(fileUri, 'utf8');
        logInfo('File contents:', fileContents);

        const module = { exports: {} };
        const require = () => {};
        const moduleFunc = new Function('module', 'exports', 'require', fileContents);
        moduleFunc(module, module.exports, require);

        const musicApi = {
            id: module.exports.id || '',
            platform: 'tx',
            author: module.exports.author || '',
            name: module.exports.name || '',
            version: module.exports.version || '',
            srcUrl: module.exports.srcUrl || '',
            script: fileContents,
            isSelected: false,
            getMusicUrl: module.exports.getMusicUrl,
        };

        myTrackPlayer.addMusicApi(musicApi);
    } catch (err) {
        logError('Error importing music source:', err);
        Alert.alert('Import Failed', 'Unable to import the music source. Please check the file format and try again.');
    }
};

const SettingModal = () => {
	const navigation = useNavigation();
	const [currentQuality, setCurrentQuality] = useCurrentQuality();
	const [isLoading, setIsLoading] = useState(false);
	const apiState = nowApiState.useValue();

	const settingsData = [
	    {
	        title: 'Application Info',
	        data: [
	            { id: '1', title: 'CyMusic', type: 'link', icon: require('@/assets/144.png') },
	            { id: '2', title: 'Version Number', type: 'value', value: CURRENT_VERSION },
	            { id: '3', title: 'Check for Updates', type: 'value' },
	            { id: '5', title: 'Project Link', type: 'value', value: '' },
	            { id: '13', title: 'View Logs', type: 'link' },
	        ],
	    },
	    {
	        title: 'Audio Settings',
	        data: [{ id: '6', title: "Clear Playlist", type:'link' }],
	    },
	    {
	        title:'Custom Sources',
	        data:[
	            { id:'11', title:'Switch Source', type:'custom' },
	            { id:'7', title:'Source Status', type:'value', value:''},
	            { id:'12', title:'Delete Source', type:'value'},
	            { id:'8', title:'Import Source', type:'value'},
	        ],
	    },
	    {
	        title:'Audio Quality Selection',
	        data:[{id:'10', title:'Current Quality', type:'value'}],
	    }
    ];

	const importMusicSourceMenu = (
	    <MenuView
	        onPressAction={({ nativeEvent:{event}}) => {
	            switch(event){
	                case "file":
	                    importMusicSourceFromFile();
	                    break;
	                case "url":
	                    importMusicSourceFromUrl();
	                    break;
	            }
	        }}
	        actions={[
	            {id:"file",title:"Import from File"},
	            {id:"url",title:"Import from URL"},
	        ]}
	    >
	        <TouchableOpacity style={styles.menuTrigger}>
	            <Text style={styles.menuTriggerText}>Import Source</Text>
	        </TouchableOpacity>
	    </MenuView>
    );

	return (
	    <View style={styles.container}>
	        <Text style={styles.header}>Settings</Text>
	        <ScrollView style={styles.scrollView}>
	            {settingsData.map((section, index) => (
	                <View key={index} style={styles.section}>
	                    <Text style={styles.sectionTitle}>{section.title}</Text>
	                    <View style={styles.sectionContent}>
	                        {/* Render each item in the section */}
	                    </View>
	                </View>
	            ))}
	        </ScrollView>
	        {isLoading && (
	            <View style={styles.loadingOverlay}>
	                <ActivityIndicator size="large" color="#fff" />
	            </View>
	        )}
	    </View>
    );
};

const styles = StyleSheet.create({
    container:{
        flexDirection:'column',
        flexGrow : 1
    },
    header:{
        fontSize : 30
    },
    scrollView:{
        flexGrow : 1
    },
    section:{
        marginBottom : 20
    },
    sectionTitle:{
        fontSize : 18
    },
    loadingOverlay:{
        position : "absolute",
        left : 0,
        right : 0,
        top : 0,
        bottom : 0,
        alignItems : "center",
        justifyContent : "center",
    }
});

export default SettingModal;
