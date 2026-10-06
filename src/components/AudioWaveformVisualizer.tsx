import React, { useEffect, useRef, useState } from 'react';
import { Mic, Activity, Volume2, Sparkles } from 'lucide-react';

export type VoiceVisualizerState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface AudioWaveformVisualizerProps {
  voiceState: VoiceVisualizerState;
  barCount?: number;
  className?: string;
  onVolumeChange?: (volume: number) => void;
  showDbMeter?: boolean;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  voiceState,
  barCount = 32,
  className = '',
  onVolumeChange,
  showDbMeter = true,
}) => {
  const [bars, setBars] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 12)
  );
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isVoiceDetected, setIsVoiceDetected] = useState<boolean>(false);
  const [hasRealMic, setHasRealMic] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Initialize Web Audio API Analyser when microphone is active ('listening')
  useEffect(() => {
    let isCancelled = false;

    async function setupMicrophoneStream() {
      if (voiceState !== 'listening') {
        cleanupAudio();
        return;
      }

      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setHasRealMic(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        mediaStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.78;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        setHasRealMic(true);
      } catch (err) {
        // Fallback to organic harmonic simulation if user rejects mic stream or in restrictive iframe
        console.log('[AudioWaveformVisualizer] Fallback to synthetic organic waveform generator:', err);
        setHasRealMic(false);
      }
    }

    setupMicrophoneStream();

    return () => {
      isCancelled = true;
      cleanupAudio();
    };
  }, [voiceState]);

  function cleanupAudio() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    setHasRealMic(false);
  }

  // Animation Loop (Real frequency analysis + smooth fallback harmonic synthesis)
  useEffect(() => {
    let phase = 0;

    const renderLoop = () => {
      phase += 0.055;
      const newHeights: number[] = new Array(barCount);
      let calculatedVolume = 0;

      if (voiceState === 'listening' && analyserRef.current && dataArrayRef.current) {
        // Real-time microphone audio frequency processing
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const data = dataArrayRef.current;
        let sum = 0;

        for (let i = 0; i < data.length; i++) {
          sum += data[i];
        }
        const avg = sum / data.length;
        calculatedVolume = Math.min(100, Math.round((avg / 255) * 100));
        setIsVoiceDetected(calculatedVolume > 14);

        // Map frequency bins symmetrically from center outward
        const half = Math.floor(barCount / 2);
        for (let i = 0; i < half; i++) {
          const freqIndex = Math.floor((i / half) * (data.length * 0.75));
          const val = data[freqIndex] || 0;
          // Scale to 8px to 64px height with organic bass presence
          const scaled = 8 + (val / 255) * 56 + Math.sin(phase + i * 0.4) * 4;
          const clamped = Math.max(8, Math.min(68, Math.round(scaled)));

          // Symmetrical placement: left half mirrors right half
          newHeights[half - 1 - i] = clamped;
          newHeights[half + i] = clamped;
        }
      } else if (voiceState === 'listening') {
        // High-fidelity synthetic listening waveform (modulated sine wave harmonics)
        const half = Math.floor(barCount / 2);
        const baseAmp = 20 + Math.sin(phase * 1.5) * 6;
        calculatedVolume = Math.round(35 + Math.sin(phase * 2) * 15);
        setIsVoiceDetected(calculatedVolume > 38);

        for (let i = 0; i < half; i++) {
          const distFromCenter = 1 - i / half;
          const wave1 = Math.sin(phase * 2.8 + i * 0.35);
          const wave2 = Math.cos(phase * 1.9 - i * 0.28);
          const wave3 = Math.sin(phase * 4.2 + i * 0.6) * 0.5;

          const composite = (wave1 + wave2 + wave3) / 2.5;
          const h = Math.max(
            8,
            Math.min(64, Math.round(8 + (baseAmp * distFromCenter * (1 + composite * 0.85))))
          );

          newHeights[half - 1 - i] = h;
          newHeights[half + i] = h;
        }
      } else if (voiceState === 'speaking') {
        // Lively vocal cadence waveform for AURA's speech output
        const half = Math.floor(barCount / 2);
        calculatedVolume = 65;
        for (let i = 0; i < half; i++) {
          const dist = 1 - (i / half) * 0.7;
          const oscillation =
            Math.sin(phase * 3.5 + i * 0.5) * 18 +
            Math.cos(phase * 2.1 - i * 0.3) * 14;
          const h = Math.max(8, Math.min(66, Math.round(14 + Math.abs(oscillation) * dist)));
          newHeights[half - 1 - i] = h;
          newHeights[half + i] = h;
        }
      } else if (voiceState === 'thinking') {
        // Slow pulsing cosmic ripple
        calculatedVolume = 15;
        setIsVoiceDetected(false);
        const half = Math.floor(barCount / 2);
        for (let i = 0; i < half; i++) {
          const pulse = Math.sin(phase * 1.8 + i * 0.25) * 10;
          const h = Math.max(6, Math.min(32, Math.round(10 + Math.abs(pulse))));
          newHeights[half - 1 - i] = h;
          newHeights[half + i] = h;
        }
      } else {
        // Idle quiescent state: gentle minimal breathing pulse
        calculatedVolume = 0;
        setIsVoiceDetected(false);
        for (let i = 0; i < barCount; i++) {
          newHeights[i] = Math.max(6, Math.round(8 + Math.sin(phase + i * 0.2) * 3));
        }
      }

      setBars(newHeights);
      setMicVolume(calculatedVolume);
      if (onVolumeChange) {
        onVolumeChange(calculatedVolume);
      }

      // Draw glowing smooth wave on canvas
      drawCanvasWave(newHeights, calculatedVolume, phase);

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [voiceState, barCount, onVolumeChange]);

  // Canvas continuous smooth wave curve drawing with glow
  const drawCanvasWave = (heights: number[], volume: number, t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    if (voiceState === 'listening') {
      // Background subtle electric glow behind wave
      const glowGrad = ctx.createRadialGradient(
        width / 2,
        centerY,
        10,
        width / 2,
        centerY,
        width / 2
      );
      glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
      glowGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.12)');
      glowGrad.addColorStop(1, 'rgba(3, 7, 18, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw primary smooth curved waveform path
      ctx.beginPath();
      ctx.lineWidth = isVoiceDetected ? 2.5 : 1.8;
      ctx.strokeStyle = isVoiceDetected
        ? 'rgba(56, 189, 248, 0.95)'
        : 'rgba(6, 182, 212, 0.75)';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = isVoiceDetected ? 14 : 8;

      const step = width / (heights.length - 1);
      ctx.moveTo(0, centerY);

      for (let i = 0; i < heights.length - 1; i++) {
        const x1 = i * step;
        const amp = (heights[i] - 8) * 0.45;
        const y1 = centerY - (i % 2 === 0 ? amp : -amp * 0.85);

        const x2 = (i + 1) * step;
        const amp2 = (heights[i + 1] - 8) * 0.45;
        const y2 = centerY - ((i + 1) % 2 === 0 ? amp2 : -amp2 * 0.85);

        const xc = (x1 + x2) / 2;
        const yc = (y1 + y2) / 2;
        ctx.quadraticCurveTo(x1, y1, xc, yc);
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }
  };

  return (
    <div
      id="audio-waveform-container"
      className={`w-full flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Waveform Visualization Canvas & Multi-Bar Frequency Equalizer */}
      <div className="relative w-full max-w-md h-24 flex items-center justify-center overflow-hidden rounded-2xl bg-[#060A14]/70 border border-cyan-500/20 shadow-inner shadow-cyan-950/40 p-2">
        {/* Canvas ambient wave backdrop */}
        <canvas
          ref={canvasRef}
          width={400}
          height={96}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
        />

        {/* Ambient listening soundwave ripple rings when microphone is active */}
        {voiceState === 'listening' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`absolute w-16 h-16 rounded-full border border-cyan-400/40 transition-all duration-700 ${
                isVoiceDetected ? 'scale-150 opacity-0 animate-ping' : 'scale-110 opacity-30 animate-pulse'
              }`}
            />
            <div
              className={`absolute w-28 h-28 rounded-full border border-blue-500/25 transition-all duration-1000 ${
                isVoiceDetected ? 'scale-125 opacity-20' : 'scale-100 opacity-15'
              }`}
            />
          </div>
        )}

        {/* Dynamic Responsive Waveform Bars */}
        <div className="relative z-10 flex items-center justify-center space-x-1 sm:space-x-1.5 h-full px-2 w-full">
          {bars.map((height, idx) => {
            const isCenter = idx >= barCount * 0.35 && idx <= barCount * 0.65;
            return (
              <div
                key={idx}
                style={{
                  height: `${height}px`,
                  transition: 'height 0.08s cubic-bezier(0.2, 0.8, 0.4, 1)',
                }}
                className={`w-1 sm:w-1.5 rounded-full transition-all ${
                  voiceState === 'listening'
                    ? isVoiceDetected
                      ? 'bg-gradient-to-t from-cyan-600 via-cyan-400 to-blue-200 shadow-sm shadow-cyan-300'
                      : isCenter
                      ? 'bg-gradient-to-t from-cyan-700 via-cyan-500 to-cyan-300 shadow-sm shadow-cyan-500/60'
                      : 'bg-gradient-to-t from-cyan-900 to-cyan-500/70'
                    : voiceState === 'thinking'
                    ? 'bg-gradient-to-t from-purple-700 via-purple-500 to-pink-300 shadow-sm shadow-purple-500/40'
                    : voiceState === 'speaking'
                    ? 'bg-gradient-to-t from-indigo-600 via-cyan-400 to-pink-400 shadow-md shadow-indigo-500/40'
                    : 'bg-white/10'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Real-time State and Sensitivity Pill */}
      <div className="mt-3 flex items-center justify-between w-full max-w-md px-1">
        {voiceState === 'listening' ? (
          <div className="flex items-center space-x-2 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-sm shadow-cyan-300"></span>
            </span>
            <span className="font-semibold text-cyan-300 tracking-wide flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              {isVoiceDetected ? 'Voice detected &middot; Listening...' : 'Listening... Speak naturally'}
            </span>
          </div>
        ) : voiceState === 'thinking' ? (
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span>AURA is reasoning & checking context...</span>
          </div>
        ) : voiceState === 'speaking' ? (
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-300">
            <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>AURA is speaking...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Activity className="w-3.5 h-3.5 text-gray-500" />
            <span>Microphone idle &middot; Click to talk</span>
          </div>
        )}

        {/* Dynamic Audio Level Meter when mic is active */}
        {showDbMeter && voiceState === 'listening' && (
          <div className="flex items-center space-x-1.5 bg-[#090F1F] border border-cyan-500/30 px-2.5 py-1 rounded-full text-[10px]">
            <span className="text-gray-400 uppercase tracking-wider font-mono">Mic</span>
            <div className="flex items-center space-x-0.5">
              <div
                className={`w-1 h-2 rounded-full transition-colors ${
                  micVolume > 5 ? 'bg-cyan-400 shadow-xs shadow-cyan-300' : 'bg-gray-700'
                }`}
              />
              <div
                className={`w-1 h-2.5 rounded-full transition-colors ${
                  micVolume > 20 ? 'bg-cyan-400 shadow-xs shadow-cyan-300' : 'bg-gray-700'
                }`}
              />
              <div
                className={`w-1 h-3 rounded-full transition-colors ${
                  micVolume > 40 ? 'bg-blue-400 shadow-xs shadow-blue-300' : 'bg-gray-700'
                }`}
              />
              <div
                className={`w-1 h-3.5 rounded-full transition-colors ${
                  micVolume > 65 ? 'bg-emerald-400 shadow-xs shadow-emerald-300' : 'bg-gray-700'
                }`}
              />
            </div>
            <span className="text-cyan-300 font-mono font-medium">
              {hasRealMic ? `${micVolume}%` : 'LIVE'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
