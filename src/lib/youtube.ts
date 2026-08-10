export function youtubeEmbedUrl(url: string): string | undefined {
	const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
	return m ? `https://www.youtube.com/embed/${m[1]}` : undefined;
}
