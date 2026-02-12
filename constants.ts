
import { Track, AppSettings } from './types';

export const MOCK_PLAYLIST: Track[] = [];

// Move DEFAULT_SETTINGS here so it can be accessed by both App and SettingsModal
export const DEFAULT_SETTINGS: AppSettings = {
  autoNext: true,
  subtitle: {
    fontSize: 20,
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    textColor: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 60,
    delay: 0,
    encoding: 'Auto'
  },
  video: {
    aspectRatio: 'Default',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    gamma: 100,
    hardwareAcceleration: true
  },
  audio: {
    delay: 0,
    channel: 'stereo',
    device: 'Default',
    track: 'Internal'
  }
};
