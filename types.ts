export interface SubtitleSettings {
  fontSize: number;
  fontFamily: string;
  textColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  delay: number;
  encoding: string;
}

export interface VideoSettings {
  aspectRatio: string;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  gamma: number;
  hardwareAcceleration: boolean;
}

export interface AudioSettings {
  delay: number;
  channel: 'stereo' | 'mono' | 'surround';
  device: string;
  track: string;
}

export interface AppSettings {
  autoNext: boolean;
  subtitle: SubtitleSettings;
  video: VideoSettings;
  audio: AudioSettings;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  subtitleUrl?: string;
  duration: number;
  type: 'audio' | 'video';
}

export enum PlayerState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  LOADING = 'LOADING'
}