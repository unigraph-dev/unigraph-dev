const query = await unigraph.runExecutable('$/executable/get-next-events', 
    {
        current: true, start: (new Date((new Date()).getTime() + 1000*60*60*8)).getTime(), 
        greaterThanNow: true, allEnd: true
    }
);
const events = (await unigraph.getQueries([query]))?.[0].filter(el => el?.type?.['unigraph.id'] !== "$/schema/time_frame");
return events?.length > 0