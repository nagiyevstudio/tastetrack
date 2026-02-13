import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface DetectedBarcode {
  rawValue?: string;
}

interface BarcodeDetectorLike {
  detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

interface ScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function Scanner({ onScan, onClose }: ScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('Requesting camera access...');
  const [manualCode, setManualCode] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const detectInProgressRef = useRef(false);
  const detectedRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current !== null) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [onClose, stopCamera]);

  const choosePreferredDevice = useCallback((list: MediaDeviceInfo[]) => {
    if (list.length === 0) return null;
    const rear = list.find(d => /back|rear|environment/i.test(d.label));
    return rear?.deviceId ?? list[0].deviceId;
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const all = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = all.filter(d => d.kind === 'videoinput');
    setDevices(videoInputs);
    return videoInputs;
  }, []);

  const tryScan = useCallback(async () => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || detectedRef.current || detectInProgressRef.current) return;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    detectInProgressRef.current = true;
    try {
      const results = await detector.detect(video);
      const code = results.find(item => item.rawValue && item.rawValue.trim().length > 0)?.rawValue?.trim();
      if (!code) return;
      detectedRef.current = true;
      stopCamera();
      onScan(code);
    } catch {
      // Ignore transient detector errors and continue scanning.
    } finally {
      detectInProgressRef.current = false;
    }
  }, [onScan, stopCamera]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setHasPermission(false);
      setErrorMessage('Camera API is not supported in this browser.');
      return;
    }

    setHasPermission(null);
    setErrorMessage('');
    setStatusMessage('Requesting camera access...');
    detectedRef.current = false;
    stopCamera();

    const baseConstraints: MediaTrackConstraints = selectedDeviceId
      ? { deviceId: { exact: selectedDeviceId } }
      : { facingMode: { ideal: 'environment' } };

    const constraints: MediaStreamConstraints = {
      video: {
        ...baseConstraints,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false
    };

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (initialError) {
      if (!selectedDeviceId) throw initialError;
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
    }

    streamRef.current = stream;
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    await new Promise<void>((resolve) => {
      const timeout = window.setTimeout(() => resolve(), 1200);
      video.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        resolve();
      };
    });

    await video.play();
    await new Promise(resolve => window.setTimeout(resolve, 300));

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      throw new Error('Camera opened, but no video frames are available.');
    }

    setHasPermission(true);

    const videoInputs = await refreshDevices();
    if (!selectedDeviceId && videoInputs.length > 0) {
      const preferred = choosePreferredDevice(videoInputs);
      const activeTrack = stream.getVideoTracks()[0];
      const activeId = activeTrack?.getSettings().deviceId ?? null;
      if (preferred && activeId && preferred !== activeId) {
        setStatusMessage('Switching to rear camera...');
        setSelectedDeviceId(preferred);
        return;
      }
    }

    if (window.BarcodeDetector) {
      detectorRef.current = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code']
      });
      setStatusMessage('Point camera at a barcode');
      scanIntervalRef.current = window.setInterval(() => {
        void tryScan();
      }, 300);
    } else {
      detectorRef.current = null;
      setStatusMessage('Camera is on. Auto barcode detection is unavailable in this browser (e.g. Safari).');
    }
  }, [choosePreferredDevice, refreshDevices, selectedDeviceId, stopCamera, tryScan]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await startCamera();
      } catch (error) {
        if (cancelled) return;
        setHasPermission(false);
        const message = error instanceof Error ? error.message : 'Failed to access camera.';
        setErrorMessage(message);
      }
    };

    void run();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const submitManualCode = () => {
    const value = manualCode.trim();
    if (!value) return;
    stopCamera();
    onScan(value);
  };

  const switchCamera = () => {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const next = devices[(currentIndex + 1 + devices.length) % devices.length];
    setSelectedDeviceId(next.deviceId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div className="absolute top-4 right-4 z-50">
        <button onClick={handleClose} className="p-2 bg-white/20 rounded-full text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {hasPermission === null ? (
          <div className="text-white">{statusMessage}</div>
        ) : hasPermission ? (
          <>
            <div className="relative w-64 h-40 border-2 border-white/50 rounded-lg overflow-hidden mb-8">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>
              <div className="w-full h-0.5 bg-red-500 absolute top-1/2 animate-pulse"></div>

              <video
                ref={videoRef}
                className="w-full h-full object-cover bg-black"
                autoPlay
                muted
                playsInline
              />
            </div>
            
            <p className="text-white mb-8 text-center px-4">
              {statusMessage}
            </p>

            <div className="w-full max-w-xs px-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => void startCamera()}
                  className="w-full bg-white/20 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Restart Camera
                </button>
                <button
                  onClick={switchCamera}
                  disabled={devices.length < 2}
                  className="w-full bg-white/20 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-40"
                >
                  Switch Camera
                </button>
              </div>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter barcode manually"
                className="w-full rounded-lg px-3 py-2 bg-white text-black"
              />
              <button
                onClick={submitManualCode}
                className="w-full bg-white text-black px-4 py-2 rounded-lg font-semibold active:scale-95 transition-transform"
              >
                Use Code
              </button>
            </div>
          </>
        ) : (
          <div className="text-white text-center p-4">
            <p>Camera permission denied or unavailable.</p>
            {errorMessage ? <p className="mt-2 text-sm text-red-300">{errorMessage}</p> : null}
            <button onClick={handleClose} className="mt-4 block mx-auto underline">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
