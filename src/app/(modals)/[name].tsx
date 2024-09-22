import { SingerTracksList } from '@/components/SingerTracksList';
import { colors, screenPadding } from '@/constants/tokens';
import { getSingerDetail } from '@/helpers/userApi/getMusicSource';
import { defaultStyles } from '@/styles';
import { useRoute } from '@react-navigation/native'; // Use react-navigation for navigation
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Track } from 'react-native-track-player';

const SingerListScreen = () => {
	const route = useRoute();
	const playlistName = route.params.name as string; // Get the singer's name from route params
	const [singerListDetail, setSingerListDetail] = useState<{ musicList: Track[] } | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchSingerListDetail = async () => {
			const detail = await getSingerDetail(playlistName);
			setSingerListDetail(detail);
			setLoading(false);
		};
		fetchSingerListDetail();
	}, [playlistName]);

	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: colors.background,
				}}
			>
				<ActivityIndicator size="large" color="#fff" />
			</View>
		);
	}

	const DismissPlayerSymbol = () => {
		const { top } = useSafeAreaInsets();

		return (
			<View
				style={{
					position: 'absolute',
					top: top - 28,
					left: 0,
					right: 0,
					flexDirection: 'row',
					justifyContent: 'center',
				}}
			>
				<View
					style={{
						width: 65,
						height: 8,
						borderRadius: 8,
						backgroundColor: '#fff',
						opacity: 0.7,
					}}
				/>
			</View>
		);
	};

	return (
		<SafeAreaView style={defaultStyles.container}>
			<DismissPlayerSymbol />
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{ paddingHorizontal: screenPadding.horizontal }}
			>
				<SingerTracksList playlist={singerListDetail} tracks={singerListDetail?.musicList} />
			</ScrollView>
		</SafeAreaView>
	);
};

export default SingerListScreen;
