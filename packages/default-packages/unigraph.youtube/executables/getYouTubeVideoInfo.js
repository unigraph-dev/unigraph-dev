const { youtube_id } = context.params;

const Innertube = require('youtubei.js');

const youtube = await new Innertube();
const video = await youtube.getDetails(youtube_id);

return video;
