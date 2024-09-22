import { MovingText } from '@/components/MovingText';
import { PlayerControls } from '@/components/PlayerControls';
import { PlayerProgressBar } from '@/components/PlayerProgressbar';
import { PlayerRepeatToggle } from '@/components/PlayerRepeatToggle';
import { PlayerVolumeBar } from '@/components/PlayerVolumeBar';
import { ShowPlayerListToggle } from '@/components/ShowPlayerListToggle';
import { unknownTrackImageUri } from '@/constants/images';
import { colors, fontSize, screenPadding } from '@/constants/tokens';
import { nowLyricState } from '@/helpers/trackPlayerIndex';
import { getSingerMidBySingerName } from '@/helpers/userApi/getMusicSource';
import { usePlayerBackground } from '@/hooks/usePlayerBackground';
import { useTrackPlayerFavorite } from '@/hooks/useTrackPlayerFavorite';
import usePlayerStore from '@/store/usePlayerStore';
import { defaultStyles } from '@/styles';
import { Entypo, MaterialCommunityIcons } from 'react-native-vector-icons';
import LinearGradient from 'react-native-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Linking,
	Share,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { Lyric } from 'react-native-lyric';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
	useActiveTrack,
	usePlaybackState,
	useProgress,
} from 'react-native-track-player';
import { NavigationContainer } from '@react-navigation/native'; 
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
	return (
		<NavigationContainer>
			<Stack.Navigator>
				<Stack.Screen name="Player" component={PlayerScreenContent} />
			</Stack.Navigator>
		</NavigationContainer>
	);
};

const PlayerScreenContent = () => {
	const { top, bottom } = useSafeAreaInsets();
	const { isFavorite, toggleFavorite } = useTrackPlayerFavorite();
	const [showLyrics, setShowLyrics] = useState(false);
	const { duration, position } = useProgress(250);
	const lyricsOpacity = useSharedValue(0);
	const lyricsTranslateY = useSharedValue(50);
	const artworkScale = useSharedValue(1);

	const playbackState = usePlaybackState();
	const isPlaying = playbackState.state === 'playing';

	const lyricsAnimatedStyle = useAnimatedStyle(() => ({
		opacity: lyricsOpacity.value,
		transform: [{ translateY: lyricsTranslateY.value }],
	}));

	const artworkAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: artworkScale.value }],
	}));

	const handleLyricsToggle = () => {
		const newShowLyrics = !showLyrics;
		setShowLyrics(newShowLyrics);
		if (newShowLyrics) {
			lyricsOpacity.value = withTiming(1, { duration: 300 });
			lyricsTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
		} else {
			lyricsOpacity.value = withTiming(0, { duration: 300 });
			lyricsTranslateY.value = withSpring(50, { damping: 15, stiffness: 100 });
		}
	};

	useEffect(() => {
		if (isPlaying) {
			artworkScale.value = withSpring(1, {
				damping: 9,
				stiffness: 180,
				mass: 1,
				velocity: 0,
			});
		} else {
			artworkScale.value = withTiming(0.7, {
				duration: 300,
				easing: Easing.linear,
			});
		}
	}, [isPlaying]);

	const {
        isLoading,
        isInitialized,
        prevTrack,
        activeTrack,
        setLoading,
        setInitialized,
        setPrevTrack,
        setActiveTrack,
    } = usePlayerStore();

	const nowLyric =
        nowLyricState.getValue() || '[00:00.00] No lyrics available';
	const currentActiveTrack = useActiveTrack();

	const { imageColors } =
        usePlayerBackground(currentActiveTrack?.artwork ?? unknownTrackImageUri);

	const lineRenderer = useCallback(
        ({ lrcLine: { millisecond, content }, index, active }) => (
            <Text
                style={[
                    styles.lyricText,
                    {
                        color: active ? 'white' : 'gray',
                        fontWeight: active ? '700' : '500',
                        fontSize: active ? 27 : 19,
                        opacity: active ? 1 : 0.6,
                    },
                ]}
            >
                {content}
            </Text>
        ),
        [],
    );

	const handleViewArtist = (artist) => {
        if (!artist.includes('Unknown')) {
            getSingerMidBySingerName(artist).then((singerMid) => {
                if (singerMid) {
                    console.log(`Navigate to artist ${singerMid}`);
                } else {
                    console.log('No matching artist found');
                }
            });
        }
    };

    const handleArtistSelection = (artists) => {
        artists = artists.trim();
        const artistArray = artists.split('、');
        if (artistArray.length === 1) {
            return (
                <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => handleViewArtist(artists)}
                    accessibilityRole="button"
                    accessibilityHint={`View artist ${artists}`}
                >
                    <Text numberOfLines={1} style={[styles.trackArtistText, { marginTop: 6 }]}>
                        {artists}
                    </Text>
                </TouchableOpacity>
            );
        } else {
            return (
                <MenuView
                    title="Select Artist"
                    onPressAction={({ nativeEvent }) => {
                        handleViewArtist(nativeEvent.event);
                    }}
                    actions={artistArray.map((artist) => ({
                        id: artist,
                        title: artist,
                    }))}>
                    <TouchableOpacity
                        activeOpacity={0.6}
                        accessibilityRole="button"
                        accessibilityHint={`View artist ${artists}`}>
                        <Text numberOfLines={1} style={[styles.trackArtistText, { marginTop: 6 }]}>
                            {artists}
                        </Text>
                    </TouchableOpacity>
                </MenuView>
            );
        }
    };

    useEffect(() => {
        const checkTrackLoading = async () => {
            if (!isInitialized) {
                setInitialized(true);
                setActiveTrack(currentActiveTrack);
                setPrevTrack(currentActiveTrack);
            } else if (!currentActiveTrack && !prevTrack) {
                setLoading(true);
            } else if (currentActiveTrack && currentActiveTrack.id !== prevTrack.id) {
                setLoading(true);
                await new Promise((resolve) => setTimeout(resolve, 50));
                setLoading(false);
                setPrevTrack(currentActiveTrack);
            }
            setActiveTrack(currentActiveTrack);
        };
        if (currentActiveTrack !== undefined) {
            checkTrackLoading();
        }
    }, [currentActiveTrack]);

    const trackToDisplay = activeTrack || prevTrack;

    const [currentLyricTime, setCurrentLyricTime] = useState(position * 1000);

    const handleSeek = (newPosition) => {
        setCurrentLyricTime(newPosition * 1000);
    };

    const handleFavorite = () => {
        toggleFavorite();
    };

    const handleShowAlbum = () => {};

    const handleShowLyrics = () => {
        handleLyricsToggle();
    };

    const handleAddToPlaylist = () => {
        const track = trackToDisplay;
        console.log('track', track);
        console.log(`Navigate to add to playlist for ${track.title}`);
    };

    const handleDownload = async () => {
        if (trackToDisplay?.url) {
            try {
                const supported = await Linking.canOpenURL(trackToDisplay.url);

                if (supported) {
                    await Linking.openURL(trackToDisplay.url);
                } else {
                    console.log("Don't know how to open this URL: " + trackToDisplay.url);
                }
            } catch (error) {
                console.error('An error occurred while trying to open the URL:', error);
            }
        } else {
            console.log('No URL available for this track');
        }
    };

    const handleShare = async () => {
        try {
            const result = await Share.share({
                title: trackToDisplay?.title,
                message: `Song: ${trackToDisplay?.title} by ${trackToDisplay?.artist}`,
                url: trackToDisplay?.url,
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    console.log(`Shared via ${result.activityType}`);
                } else {
                    console.log('Shared');
                }
            } else if (result.action === Share.dismissedAction) {
                console.log('Share dismissed');
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    const menuActions = [
        {
            id: 'favorite',
            title: isFavorite ? 'Unfavorite' : 'Favorite',
            titleColor: isFavorite ? colors.primary : undefined,
            image: isFavorite ? 'heart.fill' : 'heart',
        },
        { id: 'album', title: 'Show Album', image: 'music.note.list' },
        { id: 'lyrics', title: 'View Lyrics', image: 'text.quote' },
        { id: 'playlist', title: 'Add to Playlist', image: 'plus.circle' },
        { id: 'share', title: 'Share Song', image: 'square.and.arrow.up' },
    ];

    if (trackToDisplay?.platform !== 'local') {
        menuActions.splice(4, 0, { id: 'download', title: 'Download', image: 'arrow.down.circle' });
    }

    useEffect(() => {
        setCurrentLyricTime(position * 1000);
    }, [position]);

	return (
	    <LinearGradient
	        style={{ flex: 1 }}
	        colors={imageColors ? [imageColors.background, imageColors.primary] : [colors.background]}>
	        <View style={styles.overlayContainer}>
	            <DismissPlayerSymbol />
	            {showLyrics ? (
	                <Animated.View style={[styles.lyricContainer, lyricsAnimatedStyle]}>
	                    <TouchableOpacity style={{ backgroundColor: 'transparent', flex: 1 }} onPress={handleLyricsToggle}>
	                        <Lyric
								style={styles.lyric}
								lrc={nowLyric}
								currentTime={currentLyricTime}
								autoScroll
								autoScrollAfterUserScroll={500}
								lineHeight={50}
								activeLineHeight={65}
								height={850}
								lineRenderer={lineRenderer}
							/>
	                    </TouchableOpacity>
	                </Animated.View>
	            ) : (
	                <View style={{ flex: 1, marginTop: top + 70, marginBottom: bottom }}>
	                    <Animated.View style={[styles.artworkImageContainer, artworkAnimatedStyle]}>
	                        <TouchableOpacity style={styles.artworkTouchable} onPress={handleLyricsToggle}>
                                <FastImage
                                    source={{
                                        uri: trackToDisplay?.artwork ?? unknownTrackImageUri,
                                        priority: FastImage.priority.high,
                                    }}
                                    resizeMode="cover"
                                    style={styles.artworkImage}
                                />
                            </TouchableOpacity>
	                    </Animated.View>
	                    <View style={{ flex: 1 }}>
	                        <View style={{ marginTop:'auto' }}>
                                <View style={{ height:'60' }}>
                                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                                        <View style={styles.trackTitleContainer}>
                                            <MovingText text={trackToDisplay?.title ?? ''} animationThreshold={30} style={styles.trackTitleText} />
                                        </View>

                                        <MenuView
                                            title="Song Options"
                                            onPressAction={({ nativeEvent }) => {
                                                switch (nativeEvent.event) {
                                                    case "favorite":
                                                        handleFavorite();
                                                        break;
                                                    case "album":
                                                        handleShowAlbum();
                                                        break;
                                                    case "lyrics":
                                                        handleShowLyrics();
                                                        break;
                                                    case "playlist":
                                                        handleAddToPlaylist();
                                                        break;
                                                    case "download":
                                                        handleDownload();
                                                        break;
                                                    case "share":
                                                        handleShare();
                                                        break;
                                                }
                                            }}
                                            actions={menuActions}>
                                            <TouchableOpacity style={styles.menuButton}>
                                                <Entypo name="dots-three-horizontal" size={18} color={colors.icon} />
                                            </TouchableOpacity>
                                        </MenuView>
                                    </View>

                                    {trackToDisplay?.artist && handleArtistSelection(trackToDisplay.artist)}
                                </View>

                                <PlayerProgressBar style={{ marginTop:'32' }} onSeek={handleSeek} />

                                <PlayerControls style={{ marginTop:'40'}} />
                            </View>

                            <PlayerVolumeBar style={{ marginTop:'auto', marginBottom:'30'}} />

                            <View style={styles.container}>
                                <View style={styles.leftItem}>
                                    <MaterialCommunityIcons name="tooltip-minus-outline" size={27} color="white" onPress={handleLyricsToggle} style={{ marginBottom:'2'}} />
                                </View>
                                <View style={styles.centeredItem}>
                                    <PlayerRepeatToggle size={30} style={{ marginBottom:'6'}} />
                                </View>
                                <View style={styles.rightItem}>
                                    <ShowPlayerListToggle size={30} style={{ marginBottom:'6'}} />
                                </View>
                            </View>
                        </View>
                    </View>
	            )}

	            {isLoading && (
	                <View style={styles.loaderOverlay}>
	                    <ActivityIndicator size="large" color="#fff" />
	                </View>
	            )}
	        </View>
	    </LinearGradient>
   );
};

const DismissPlayerSymbol = () => {
	const { top } = useSafeAreaInsets();

	return (
	    <View
	        style={{
	            position:'absolute',
	            top:(top +8),
	            left:'0',
	            right:'0',
	            flexDirection:'row',
	            justifyContent:'center',
	        }}>
	        <View
	            accessible='false'
	            style={{
	                width:'50',
	                height:'8',
	                borderRadius:'8',
	                backgroundColor:'#fff',
	                opacity:'0.7',
	            }} />
	    </View>
   );
};

const styles= StyleSheet.create({
	menuButton:{
	    width:'32',
	    height:'32',
	    borderRadius:'16',
	    backgroundColor:'rgba(128,128,128,0.3)',
	    justifyContent:'center',
	    alignItems:'center',
   },
   overlayContainer:{
       ...defaultStyles.container,
       paddingHorizontal:`${screenPadding.horizontal}`,
       backgroundColor:'rgba(0,0,0,0.5)',
   },
   artworkImageContainer:{
       aspectRatio:'1',
       width:'100%',
       maxHeight:`50%`,
       alignSelf:'center',
       borderRadius:`12`,
       overflow:'hidden',
       backgroundColor:'grey',
       shadowColor:'#000',
       shadowOffset:{
           width:`0`,
           height:`8`,
       },
       shadowOpacity:`0.44`,
       shadowRadius:`11.0`,
       elevation:`16`,
   },
   artworkTouchable:{
       width:`100%`,
       height:`100%`,
   },
   artworkImage:{
       width:`100%`,
       height:`100%`,
       resizeMode:`cover`,
       borderRadius:`12`,
       backgroundColor:`transparent`,
   },
   trackTitleContainer:{
       flex:`1`,
       overflow:`hidden`,
   },
   trackTitleText:{
       ...defaultStyles.text,
       fontSize:`22`,
       fontWeight:`700`,
   },
   trackArtistText:{
       ...defaultStyles.text,
       fontSize:`${fontSize.base}`,
       opacity:`0.8`,
       maxWidth:`90%`,
   },
   loaderOverlay:{
       position:`absolute`,
       top:`0`,
       bottom:`0`,
       left:`0`,
       right:`0`,
       justifyContent:`center`,
       alignItems:`center`,
       backgroundColor:`rgba(0,0,0,0.3)`, 
   },
   lyricText:{
      ...defaultStyles.text,
      textAlign:`center`,
   },
   lyric:{},
   container:{
      flexDirection:`row`,
      alignItems:`center`,
      justifyContent:`space-between`,
      paddingHorizontal:`16`,
   },
   leftItem:{
      flex:`1`,
      alignItems:`flex-start`,
   },
   centeredItem:{
      flex:`1`,
      alignItems:`center`,
   },
   rightItem:{
      flex:`1`,
      alignItems:`flex-end`,
   },
   lyricContainer:{
      flex:`1`, 
   },
});

export default AppNavigator;
