const search = await ytSearch(query);
const video = search.videos[0];

if (!video) {
  return interaction.editReply("❌ No results found.");
}

const stream = ytdl(video.url, {
  filter: "audioonly",
  quality: "highestaudio"
});
