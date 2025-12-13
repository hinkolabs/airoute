export const TASK_CATEGORIES = [
  {
    id: "image-design",
    title: "Image & Design",
    description: "Logo, poster, UI design",
    icon: "🖼️",
  },
  {
    id: "writing",
    title: "Writing",
    description: "Blog, copy, scripts",
    icon: "✏️",
  },
  {
    id: "video",
    title: "Video",
    description: "Edit, generate videos",
    icon: "🎬",
  },
  {
    id: "audio",
    title: "Audio",
    description: "Music, podcast, BGM",
    icon: "🎵",
  },
  {
    id: "voice",
    title: "Voice",
    description: "TTS, dubbing, cloning",
    icon: "🎙️",
  },
  {
    id: "coding",
    title: "Coding",
    description: "Code assist, debug",
    icon: "💻",
  },
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];


