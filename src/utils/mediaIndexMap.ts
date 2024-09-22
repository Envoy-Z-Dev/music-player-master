interface IIndexMap {
    getIndexMap: () => Record<string, Record<string, number>>;
    getIndex: (musicItem: ICommon.IMediaBase) => number;
    has: (mediaItem: ICommon.IMediaBase) => boolean;
}

export function createMediaIndexMap(
    mediaItems: ICommon.IMediaBase[],
): IIndexMap {
    const indexMap: Record<string, Record<string, number>> = {};

    mediaItems.forEach((item, index) => {
        // If the platform does not exist in the map
        if (!indexMap[item.platform]) {
            indexMap[item.platform] = {
                [item.id]: index,
            };
        } else {
            // Update the mapping
            indexMap[item.platform][item.id] = index;
        }
    });

    function getIndexMap() {
        return indexMap;
    }

    function getIndex(mediaItem: ICommon.IMediaBase) {
        if (!mediaItem) {
            return -1;
        }
        return indexMap[mediaItem.platform]?.[mediaItem.id] ?? -1;
    }

    function has(mediaItem: ICommon.IMediaBase) {
        if (!mediaItem) {
            return false;
        }

        return indexMap[mediaItem.platform]?.[mediaItem.id] !== undefined;
    }

    return {
        getIndexMap,
        getIndex,
        has,
    };
}
