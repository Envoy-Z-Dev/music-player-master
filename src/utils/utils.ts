import musicSdk from '@/components/utils/musicSdk';
import { requestMsg } from '@/components/utils/message';
import { toOldMusicInfo } from '@/components/utils';
import player from '@/app/player';

export const getOnlineOtherSourceMusicUrl = async ({
	musicInfos,
	quality,
	onToggleSource,
	isRefresh,
	retryedSource = [],
}: {
	musicInfos: LX.Music.MusicInfoOnline[];
	quality?: LX.Quality;
	onToggleSource: (musicInfo?: LX.Music.MusicInfoOnline) => void;
	isRefresh: boolean;
	retryedSource?: LX.OnlineSource[];
}): Promise<{
	url: string;
	musicInfo: LX.Music.MusicInfoOnline;
	quality: LX.Quality;
	isFromCache: boolean;
}> => {
	if (!await global.lx.apiInitPromise[0]) throw new Error('source init failed');

	let musicInfo: LX.Music.MusicInfoOnline | null = null;
	let itemQuality: LX.Quality | null = null;

	while (musicInfo = musicInfos.shift()!) {
		if (retryedSource.includes(musicInfo.source)) continue;
		retryedSource.push(musicInfo.source);
		itemQuality = quality ?? '128k'; // Default quality

		if (!musicInfo.meta._qualitys[itemQuality]) continue;

		console.log('Trying to toggle to:', musicInfo.source, musicInfo.name, musicInfo.singer, musicInfo.interval);
		onToggleSource(musicInfo);
		break;
	}

	if (!musicInfo || !itemQuality) throw new Error(global.i18n.t('toggle_source_failed'));

	let reqPromise;

	try {
		reqPromise = musicSdk[musicInfo.source].getMusicUrl(toOldMusicInfo(musicInfo), itemQuality).promise;
	} catch (err: any) {
		reqPromise = Promise.reject(err);
	}

	return reqPromise.then(({ url, type }: { url: string; type: LX.Quality }) => {
		return { musicInfo, url, quality: type, isFromCache: false };
	}).catch((err: any) => {
		if (err.message === requestMsg.tooManyRequests) throw err;
		console.log(err);
		return getOnlineOtherSourceMusicUrl({ musicInfos, quality, onToggleSource, isRefresh, retryedSource });
	});
};
