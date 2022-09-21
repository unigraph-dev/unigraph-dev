const quickStemmer = (text: string) => (text || '').toLowerCase().replace(/[-/.]/g, ' ').trim();

export const quickTitleSearch = (
    key: string,
    callback: (res: any[], top: boolean) => void,
    topThreshold = 5,
    totalThreshold = 10,
) => {
    const names = (window.unigraph as any).getCache('searchTitles');
    const results = (names || []).filter((el: any) => quickStemmer(el?.name).includes(quickStemmer(key)));
    if (key?.length)
        callback(
            results
                .filter((it: any) => it.incoming >= 5)
                .sort((a: any, b: any) => b.incoming - a.incoming)
                .slice(0, topThreshold),
            true,
        );

    callback(
        results
            .sort((a: any, b: any) => new Date(b._updatedAt || 0).getTime() - new Date(a._updatedAt || 0).getTime())
            .slice(0, totalThreshold),
        false,
    );
};
