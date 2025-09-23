import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3000"; // Change to your deployed server URL

const App = () => {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [messageStatus, setMessageStatus] = useState({});
  const [quickResponses] = useState([
    "👍", "👎", "✅", "❌", "😊", "😢", "🎉", "👏", "🤔", "💡"
  ]);
  const [copied, setCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioMessages, setAudioMessages] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);

  // New: Network health and holographic AI agent state
  const [socketConnected, setSocketConnected] = useState(false);
  const [rtcConnectionState, setRtcConnectionState] = useState("new");
  const [alerts, setAlerts] = useState([]); // {id, level, text, timestamp}
  const [holoFeed, setHoloFeed] = useState([]); // holographic assistant narration
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [predictiveRisk, setPredictiveRisk] = useState(0); // 0-100
  const [federatedEnabled, setFederatedEnabled] = useState(false);
  const telemetryBufferRef = useRef([]);
  const [satelliteConnected, setSatelliteConnected] = useState(false);
  const [lastStats, setLastStats] = useState({ rttMs: 0, jitterMs: 0, lossPct: 0 });
  const [breakCause, setBreakCause] = useState("Nominal");
  // Live voice chat controls
  const [vuLevel, setVuLevel] = useState(0);
  const [voiceOnly, setVoiceOnly] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState({}); // { [id]: { current, duration, pct } }

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const vuIntervalRef = useRef(null);

  // WebRTC STUN servers
  const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

  useEffect(() => {
    socketRef.current = io(SERVER_URL, { autoConnect: true, reconnection: true });

    socketRef.current.on("connect", () => {
      setSocketConnected(true);
      holoSpeak("Link with Mission Control established. Signal lock confirmed.");
      console.log("Connected to signaling server:", socketRef.current.id);
      // If we were previously joined, re-join the room to restore context
      if (joined && roomId) {
        socketRef.current.emit("join", roomId);
      }
    });

    socketRef.current.on("disconnect", (reason) => {
      setSocketConnected(false);
      pushAlert("warning", `Signaling link lost (${reason}). Attempting auto-reconnect...`);
      holoSpeak("Warning: Signaling channel disrupted. Initiating recovery.");
    });

    socketRef.current.on("reconnect", (attempt) => {
      setSocketConnected(true);
      setReconnectAttempts(0);
      pushAlert("info", `Reconnected to signaling server (attempt ${attempt}).`);
      holoSpeak("Signaling restored. Re-synchronizing peers.");
      // Try to renegotiate if we have a peer
      if (remoteSocketId) {
        safeRenegotiate();
      }
    });

    socketRef.current.on("reconnect_attempt", (attempt) => {
      setReconnectAttempts(attempt);
    });

    socketRef.current.on("connect_error", (err) => {
      pushAlert("error", `Signaling error: ${err.message}`);
    });

    socketRef.current.on("joined", ({ roomId, numClients }) => {
      console.log(`Joined room: ${roomId}, clients: ${numClients}`);
    });

    socketRef.current.on("peer-joined", (peerId) => {
      console.log("Peer joined:", peerId);
      setRemoteSocketId(peerId);
      createOffer(peerId);
    });

    socketRef.current.on("offer", async ({ from, offer }) => {
      console.log("Received offer from", from);
      setRemoteSocketId(from);
      await createAnswer(from, offer);
    });

    socketRef.current.on("answer", async ({ from, answer }) => {
      console.log("Received answer from", from);
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socketRef.current.on("ice-candidate", async ({ from, candidate }) => {
      if (pcRef.current && candidate) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socketRef.current.on("chat", ({ from, text, messageId }) => {
      setMessages((prev) => [...prev, { 
        sender: "Peer", 
        text, 
        id: messageId || Date.now(),
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    socketRef.current.on("typing", ({ from, isTyping }) => {
      setRemoteTyping(isTyping);
    });

    socketRef.current.on("message-status", ({ messageId, status }) => {
      setMessageStatus(prev => ({ ...prev, [messageId]: status }));
    });

    socketRef.current.on("quick-response", ({ from, response }) => {
      setMessages((prev) => [...prev, { 
        sender: "Peer", 
        text: response, 
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        isQuickResponse: true
      }]);
    });

    socketRef.current.on("voice-message", ({ from, audioData, messageId }) => {
      const audioBlob = new Blob([new Uint8Array(audioData)], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioMessages((prev) => [...prev, {
        id: messageId || Date.now(),
        sender: "Peer",
        audioUrl,
        timestamp: new Date().toLocaleTimeString(),
        duration: 0 // Will be updated when audio loads
      }]);
    });

    // New: receive network alerts broadcasted by peers
    socketRef.current.on("network-alert", ({ level, text, timestamp }) => {
      setAlerts(prev => [...prev, { id: Date.now(), level, text, timestamp }]);
      holoSpeak(`Incoming alert: ${text}`);
    });

    return () => {
      try { socketRef.current && socketRef.current.disconnect(); } catch {}
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (vuIntervalRef.current) clearInterval(vuIntervalRef.current);
      try { audioContextRef.current && audioContextRef.current.close(); } catch {}
    };
  }, []);

  // Create PeerConnection
  const createPeerConnection = () => {
    pcRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pcRef.current.onicecandidate = (e) => {
      if (e.candidate && remoteSocketId) {
        socketRef.current.emit("ice-candidate", { to: remoteSocketId, candidate: e.candidate });
      }
    };

    pcRef.current.ontrack = (e) => {
      remoteVideoRef.current.srcObject = e.streams[0];
    };

    // Monitor connection state for break detection and recovery
    pcRef.current.onconnectionstatechange = () => {
      const state = pcRef.current.connectionState;
      setRtcConnectionState(state);
      if (state === "connected") {
        pushAlert("success", "Peer link established.");
        holoSpeak("Peer-to-peer channel active. Streaming stabilized.");
        setReconnectAttempts(0);
        // Optionally clear satellite mode if link is stable and risk is low
        if (satelliteConnected && predictiveRisk < 30) {
          holoSpeak("Primary link stable. Satellite relay on standby.");
          setSatelliteConnected(false);
        }
      } else if (state === "disconnected" || state === "failed") {
        pushAlert("warning", `Peer link ${state}. Attempting auto-recovery...`);
        holoSpeak("Peer link degraded. Rerouting and renegotiating session.");
        scheduleReconnect();
        if (!satelliteConnected) {
          engageSatelliteRelay(`Peer connection ${state}`);
        }
      }
    };

    pcRef.current.oniceconnectionstatechange = () => {
      const ice = pcRef.current.iceConnectionState;
      if (ice === "disconnected" || ice === "failed") {
        pushAlert("warning", `ICE state ${ice}. Rebuilding connection...`);
        scheduleReconnect();
        if (!satelliteConnected) {
          engageSatelliteRelay(`ICE state ${ice}`);
        }
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pcRef.current.addTrack(track, localStreamRef.current);
      });
    }

    // Start stats polling for predictive risk
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    statsIntervalRef.current = setInterval(pollRtcStatsAndPredict, 5000);
  };

  // Start camera & mic
  const startMedia = async () => {
    try {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = localStreamRef.current;
      holoSpeak("Local sensors online: camera and microphone activated.");
      setupAudioAnalyser();
    } catch (err) {
      alert("Could not access camera/mic: " + err.message);
    }
  };

  // Activate microphone only (no camera)
  const startMicOnly = async () => {
    try {
      if (!localStreamRef.current) {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        // If a peer connection exists, attach audio track(s)
        if (pcRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => pcRef.current.addTrack(t, localStreamRef.current));
          safeRenegotiate();
        }
      } else {
        // If stream exists but has no audio, add audio track
        if (localStreamRef.current.getAudioTracks().length === 0) {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStream.getAudioTracks().forEach(t => localStreamRef.current.addTrack(t));
          if (pcRef.current) {
            micStream.getAudioTracks().forEach(t => pcRef.current.addTrack(t, localStreamRef.current));
            safeRenegotiate();
          }
        }
      }
      holoSpeak("Microphone activated for live voice channel.");
      setupAudioAnalyser();
      // Attach audio-only stream to video element for consistency (muted)
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    } catch (err) {
      alert("Could not access microphone: " + err.message);
    }
  };

  // Join a room
  const joinRoom = () => {
    if (!roomId.trim()) {
      alert("Enter a room ID");
      return;
    }
    socketRef.current.emit("join", roomId);
    setJoined(true);
    holoSpeak(`Mission ${roomId} initiated. Awaiting crew synchronization.`);
  };

  // Create Offer
  const createOffer = async (peerId) => {
    createPeerConnection();
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socketRef.current.emit("offer", { roomId, offer, to: peerId });
  };

  // Create Answer
  const createAnswer = async (peerId, offer) => {
    createPeerConnection();
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);
    socketRef.current.emit("answer", { roomId, answer, to: peerId });
  };

  // Self-healing: schedule and perform renegotiation with backoff
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) return; // already scheduled
    const attempt = reconnectAttempts + 1;
    const delay = Math.min(15000, 1000 * Math.pow(2, Math.min(4, attempt - 1))); // 1s,2s,4s,8s,16s cap 15s
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      setReconnectAttempts(attempt);
      safeRenegotiate();
    }, delay);
  };

  const safeRenegotiate = () => {
    try {
      if (pcRef.current) {
        try { pcRef.current.ontrack = null; } catch {}
        try { pcRef.current.close(); } catch {}
      }
      createPeerConnection();
      if (remoteSocketId) {
        createOffer(remoteSocketId);
      }
      pushAlert("info", `Renegotiation attempt #${reconnectAttempts + 1} started.`);
    } catch (e) {
      pushAlert("error", `Renegotiation error: ${e.message}`);
    }
  };

  // Satellite relay simulation: engage when primary link fails or risk high
  const engageSatelliteRelay = (reason = 'High risk detected') => {
    setSatelliteConnected(true);
    const text = `Engaging Satellite Relay Alpha: rerouting traffic due to ${reason}.`;
    pushAlert('warning', text, true);
    holoSpeak("Satellite relay engaged. Attempting session continuity over alternative path.");
    // Try renegotiation as part of failover
    scheduleReconnect();
  };

  // Send Chat
  const sendChat = () => {
    if (chatInput.trim() === "") return;
    const messageId = Date.now();
    const message = {
      sender: "Me", 
      text: chatInput, 
      id: messageId,
      timestamp: new Date().toLocaleTimeString()
    };
    
    socketRef.current.emit("chat", { roomId, text: chatInput, messageId });
    setMessages((prev) => [...prev, message]);
    setMessageStatus(prev => ({ ...prev, [messageId]: "sent" }));
    setChatInput("");
    setIsTyping(false);
    telemetryTrack("chat_sent");
  };

  // Handle typing
  const handleTyping = (e) => {
    setChatInput(e.target.value);
    
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      socketRef.current.emit("typing", { roomId, isTyping: true });
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
      socketRef.current.emit("typing", { roomId, isTyping: false });
    }
  };

  // Send quick response
  const sendQuickResponse = (response) => {
    socketRef.current.emit("quick-response", { roomId, response });
    setMessages((prev) => [...prev, { 
      sender: "Me", 
      text: response, 
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      isQuickResponse: true
    }]);
    telemetryTrack("quick_response");
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  // Generate random room ID
  const generateRoomId = () => {
    const adjectives = ['Happy', 'Bright', 'Swift', 'Cool', 'Smart', 'Quick', 'Bold', 'Sharp', 'Fast', 'Bright'];
    const nouns = ['Tiger', 'Eagle', 'Shark', 'Lion', 'Wolf', 'Bear', 'Fox', 'Hawk', 'Falcon', 'Panther'];
    const numbers = Math.floor(Math.random() * 9999) + 1000;
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective}${noun}${numbers}`;
  };

  // Copy room ID to clipboard
  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room ID:', err);
    }
  };

  // Create new room
  const createNewRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone for voice recording');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Send voice message
  const sendVoiceMessage = (audioBlob) => {
    const messageId = Date.now();
    const reader = new FileReader();
    
    reader.onload = () => {
      const arrayBuffer = reader.result;
      const audioData = Array.from(new Uint8Array(arrayBuffer));
      
      socketRef.current.emit("voice-message", { 
        roomId, 
        audioData, 
        messageId 
      });

      // Add to local audio messages
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioMessages((prev) => [...prev, {
        id: messageId,
        sender: "Me",
        audioUrl,
        timestamp: new Date().toLocaleTimeString(),
        duration: 0
      }]);
      telemetryTrack("voice_message");
    };
    
    reader.readAsArrayBuffer(audioBlob);
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Setup audio analyser for VU meter
  const setupAudioAnalyser = () => {
    try {
      if (!localStreamRef.current) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const source = ctx.createMediaStreamSource(localStreamRef.current);
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 512;
      source.connect(analyserRef.current);
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      if (vuIntervalRef.current) clearInterval(vuIntervalRef.current);
      vuIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        // Compute RMS
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const level = Math.min(100, Math.max(0, Math.round(rms * 140)));
        setVuLevel(level);
      }, 80);
    } catch {}
  };

  // (PTT removed)

  // Voice-only mode: disable video tracks to save bandwidth
  const toggleVoiceOnly = () => {
    const next = !voiceOnly;
    setVoiceOnly(next);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !next);
    }
    if (next) {
      pushAlert('info', 'Voice-only mode enabled. Video paused to prioritize audio.', true);
      holoSpeak('Voice-only mode engaged to stabilize communications.');
    } else {
      pushAlert('info', 'Voice-only mode disabled. Video resumed.', false);
      holoSpeak('Video channel restored.');
    }
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update stored duration for a voice message
  const setAudioMsgDuration = (id, seconds) => {
    setAudioMessages(prev => prev.map(m => m.id === id ? { ...m, duration: seconds } : m));
  };

  const updateVoiceProgress = (id, current, duration) => {
    const d = duration || 0;
    const pct = d ? Math.min(100, Math.max(0, Math.round((current / d) * 100))) : 0;
    setVoiceProgress(prev => ({ ...prev, [id]: { current, duration: d, pct } }));
  };

  // Helper: push alert and optionally broadcast to peers
  const pushAlert = (level, text, broadcast = false) => {
    const entry = { id: Date.now(), level, text, timestamp: new Date().toLocaleTimeString() };
    setAlerts(prev => [...prev, entry]);
    if (broadcast && socketRef.current && roomId) {
      socketRef.current.emit("network-alert", { roomId, level, text, timestamp: entry.timestamp });
    }
  };

  // Helper: holographic narration
  const holoSpeak = (text) => {
    setHoloFeed(prev => [{ id: Date.now(), text, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
  };

  // Telemetry collection for cross-mission learning (stub)
  const telemetryTrack = (event, extras = {}) => {
    const rec = {
      t: Date.now(),
      event,
      rtc: rtcConnectionState,
      risk: predictiveRisk,
      ...extras,
    };
    telemetryBufferRef.current.push(rec);
    // throttle persist
    if (telemetryBufferRef.current.length >= 20) persistTelemetry();
  };

  const persistTelemetry = () => {
    try {
      const key = `mission_telemetry_${roomId || 'global'}`;
      const prior = JSON.parse(localStorage.getItem(key) || '[]');
      const merged = prior.concat(telemetryBufferRef.current);
      localStorage.setItem(key, JSON.stringify(merged.slice(-1000)));
      telemetryBufferRef.current = [];
    } catch {}
  };

  // Predictive risk via RTC stats polling
  const pollRtcStatsAndPredict = async () => {
    try {
      if (!pcRef.current) return;
      const stats = await pcRef.current.getStats(null);
      let rtt = null;
      let jitter = null;
      let packetsLost = 0;
      let packetsSent = 0;
      stats.forEach(report => {
        if (report.type === 'remote-inbound-rtp' || report.type === 'remote-inbound-rtp-stream') {
          if (typeof report.roundTripTime === 'number') rtt = report.roundTripTime;
          if (typeof report.jitter === 'number') jitter = report.jitter;
          if (typeof report.packetsLost === 'number') packetsLost += report.packetsLost;
        }
        if (report.type === 'outbound-rtp') {
          if (typeof report.packetsSent === 'number') packetsSent += report.packetsSent;
        }
      });

      // Simple heuristic: scale rtt/jitter/loss into a 0-100 risk score
      const rttMs = rtt ? rtt * 1000 : 0;
      const jitterMs = jitter ? jitter * 1000 : 0;
      const lossPct = packetsSent > 0 ? Math.min(100, (packetsLost / (packetsSent + packetsLost)) * 100) : 0;
      let score = 0;
      score += Math.min(60, (rttMs / 500) * 20); // 0..20 points up to 500ms
      score += Math.min(20, (jitterMs / 50) * 10); // 0..10 points up to 50ms
      score += Math.min(40, (lossPct / 5) * 20); // 0..20 points at 5% loss
      score = Math.max(0, Math.min(100, Math.round(score)));
      setPredictiveRisk(score);
      setLastStats({ rttMs, jitterMs, lossPct });

      // Update inferred cause
      setBreakCause(inferBreakCause({ rttMs, jitterMs, lossPct, socketConnected }));

      // Proactive alert if risk high
      if (score >= 70) {
        pushAlert("warning", "High risk of link degradation detected. Preparing failover route...", true);
        holoSpeak("Prediction: Link instability rising. Advising reduced bitrate and standby relay.");
        if (!satelliteConnected && score >= 80) {
          engageSatelliteRelay('predicted link instability');
        }
      }
      telemetryTrack("stats", { rttMs, jitterMs, lossPct, score });
    } catch {}
  };

  // Infer likely break cause based on current metrics and signaling state
  const inferBreakCause = ({ rttMs, jitterMs, lossPct, socketConnected }) => {
    if (!socketConnected) return 'Signaling outage or gateway unreachable';
    if (lossPct > 5) return 'RF obstruction/interference or severe congestion (packet loss)';
    if (rttMs > 800 && lossPct < 2) return 'Long propagation/route detour increasing latency';
    if (jitterMs > 30) return 'Network congestion or clock instability (high jitter)';
    if (rttMs > 300) return 'Elevated latency possibly due to relay path changes';
    return 'Nominal';
  };

  return (
    <div className="space-background text-white min-h-screen flex flex-col items-center py-8 px-4">
      {/* Animated Space Elements */}
      <div className="floating-stars"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="shooting-star"></div>
      <div className="planet"></div>
      <div className="planet"></div>
      <div className="planet"></div>

      {!joined ? (
        <div className="w-full max-w-md mb-6 floating-element">
          <div className="space-container p-6">
            <h2 className="text-xl font-semibold mb-4 cosmic-title">🚀 Space Communication Hub</h2>
            
            {/* Room ID Input */}
            <div className="flex space-x-2 mb-3">
              <input
                className="flex-1 px-4 py-2 rounded space-input"
                placeholder="Enter Room ID or create new one"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
              <button
                onClick={createNewRoom}
                className="px-4 py-2 space-button rounded"
                title="Generate new room ID"
              >
                🎲 New
              </button>
            </div>

      {/* Communication Array (Chatbox with Voice Messages) */}
      <div className="mt-6 w-full max-w-6xl space-container p-4 rounded-lg floating-element">
        <h2 className="text-lg font-semibold mb-2 cosmic-title">📡 Communication Array</h2>

        {/* Quick Response Buttons */}
        <div className="mb-3">
          <p className="text-sm text-blue-300 mb-2">⚡ Quick Signals:</p>
          <div className="flex flex-wrap gap-2">
            {quickResponses.map((response, idx) => (
              <button
                key={idx}
                onClick={() => sendQuickResponse(response)}
                className="px-3 py-1 space-button rounded-full text-lg"
                title={`Send ${response}`}
              >
                {response}
              </button>
            ))}
          </div>
        </div>

        {/* Messages List */}
        <div className="h-64 xl:h-96 overflow-y-auto space-container p-3 rounded mb-2">
          {/* Text Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-2 ${msg.sender === "Me" ? "text-right" : "text-left"}`}>
              <div className={`inline-block max-w-xs px-3 py-2 rounded-lg message-bubble ${
                msg.sender === "Me" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-700 text-gray-100"
              } ${msg.isQuickResponse ? "text-2xl" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">{msg.timestamp}</span>
                  {msg.sender === "Me" && messageStatus[msg.id] && (
                    <span className="ml-2 text-xs">
                      {messageStatus[msg.id] === "sent" && "✓"}
                      {messageStatus[msg.id] === "delivered" && "✓✓"}
                      {messageStatus[msg.id] === "read" && "✓✓"}
                    </span>
                  )}
                </div>
                <div className="mt-1">{msg.text}</div>
              </div>
            </div>
          ))}

          {/* Voice Messages with voice bar */}
          {audioMessages.map((audioMsg) => (
            <div key={audioMsg.id} className={`mb-3 ${audioMsg.sender === "Me" ? "text-right" : "text-left"}`}>
              <div className={`inline-block w-full max-w-xs px-3 py-2 rounded-lg message-bubble ${
                audioMsg.sender === "Me" 
                  ? "bg-purple-600 text-white" 
                  : "bg-gray-700 text-gray-100"
              }`}>
                <div className="flex items-center justify-between mb-1 text-xs text-gray-300">
                  <span>{audioMsg.timestamp}</span>
                  <span>🎤 Voice</span>
                </div>
                <audio 
                  controls 
                  className="w-full"
                  src={audioMsg.audioUrl}
                  onLoadedMetadata={(e) => {
                    const dur = Math.round(e.currentTarget.duration || 0);
                    if (!audioMsg.duration && dur) setAudioMsgDuration(audioMsg.id, dur);
                    updateVoiceProgress(audioMsg.id, 0, dur || audioMsg.duration || 0);
                  }}
                  onTimeUpdate={(e) => {
                    const cur = Math.round(e.currentTarget.currentTime || 0);
                    const dur = Math.round(e.currentTarget.duration || audioMsg.duration || 0);
                    updateVoiceProgress(audioMsg.id, cur, dur);
                  }}
                >
                  Your browser does not support the audio element.
                </audio>
                <div className="mt-2">
                  <div className="voice-bar"><div className="voice-progress" style={{ width: `${(voiceProgress[audioMsg.id]?.pct) || 0}%` }}></div></div>
                  <div className="mt-1 flex items-center justify-between voice-time">
                    <span>{formatTime(voiceProgress[audioMsg.id]?.current || 0)}</span>
                    <span>{formatTime(voiceProgress[audioMsg.id]?.duration || audioMsg.duration || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {remoteTyping && (
            <div className="text-left mb-2">
              <div className="inline-block space-container px-3 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              className="flex-1 px-3 py-2 rounded space-input focus:outline-none"
              placeholder="Type a message... (Press Enter to send)"
              value={chatInput}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={sendChat}
              disabled={!chatInput.trim()}
              className="px-4 py-2 space-button rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              📤 Send
            </button>
            <button
              onClick={() => pushAlert('warning', 'Manual alert: Communication link unstable detected by pilot.', true)}
              className="px-3 py-2 space-button rounded"
              title="Broadcast manual link alert"
            >
              🚨 Alert
            </button>
          </div>

          {/* Voice Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isRecording ? (
              <button onClick={startRecording} className="flex items-center space-x-2 px-4 py-2 space-button rounded">
                <span>🎤</span>
                <span>Record Voice Message</span>
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 recording-indicator rounded-full"></div>
                  <span className="text-red-400 font-mono">{formatTime(recordingTime)}</span>
                </div>
                <button onClick={stopRecording} className="px-4 py-2 space-button rounded">⏹️ Stop Recording</button>
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="mt-1 text-xs text-blue-300 text-center">
            {remoteSocketId ? (
              <span className="text-green-400">🟢 Connected to remote station</span>
            ) : (
              <span className="text-yellow-400">🟡 Waiting for crew member to join...</span>
            )}
          </div>
        </div>
      </div>

            {/* Room ID Display and Copy */}
            {roomId && (
              <div className="mb-3 p-3 space-container rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-300">🌌 Mission Code:</p>
                    <p className="font-mono text-lg font-bold text-blue-400 cosmic-glow">{roomId}</p>
                  </div>
                  <button
                    onClick={copyRoomId}
                    className={`px-3 py-1 rounded text-sm space-button ${
                      copied 
                        ? 'bg-green-600 text-white' 
                        : ''
                    }`}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>
            )}

            {/* Join Button */}
            <button
              onClick={joinRoom}
              disabled={!roomId.trim()}
              className="w-full px-4 py-3 space-button rounded disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold"
            >
              {roomId ? `🚀 Launch Mission: ${roomId}` : 'Enter Mission Code to Launch'}
            </button>

            {/* Quick Tips */}
            <div className="mt-3 text-xs text-blue-300">
              <p>🌟 <strong>Mission Briefing:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Click "🎲 New" to generate a random mission code</li>
                <li>Share the mission code with your crew members</li>
                <li>Use the "📋 Copy" button to easily share the code</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 space-container rounded-lg floating-element">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-300">🌌 Active Mission:</p>
              <p className="font-mono text-lg font-bold text-blue-400 cosmic-glow">{roomId}</p>
            </div>
            <button
              onClick={copyRoomId}
              className={`px-3 py-1 rounded text-sm space-button ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : ''
              }`}
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          {/* Connection summary */}
          <div className="mt-2 text-xs text-blue-300 flex flex-wrap gap-3">
            <span>Signaling: {socketConnected ? <span className="text-green-400">Online</span> : <span className="text-red-400">Offline</span>}</span>
            <span>Peer: <span className="text-blue-300">{rtcConnectionState}</span></span>
            <span>Risk: <span className={`${predictiveRisk >= 70 ? 'text-red-400' : predictiveRisk >= 40 ? 'text-yellow-400' : 'text-green-400'}`}>{predictiveRisk}%</span></span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full max-w-6xl">
        <div className="floating-element w-full order-1">
          <h2 className="text-lg mb-2 text-blue-300">🛸 Your Command Center</h2>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full aspect-video rounded-lg space-video" />
          <div className="mt-2 flex space-x-2">
            <button
              onClick={startMedia}
              className="px-4 py-2 space-button rounded"
            >
              📹 Activate Camera
            </button>
            <button
              onClick={toggleMute}
              className={`px-4 py-2 rounded space-button ${
                isMuted 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : ''
              }`}
            >
              {isMuted ? '🔇 Unmute' : '🎤 Mute'}
            </button>
            <button
              onClick={startMicOnly}
              className="px-4 py-2 space-button rounded"
              title="Activate mic without camera"
            >
              🎙️ Activate Mic
            </button>
          </div>
          {/* Live Voice Channel Controls (PTT removed) */}
          <div className="mt-3 space-container p-3 rounded">
            <div className="flex items-center justify-between mb-2 text-xs text-blue-300">
              <div className="flex items-center space-x-2">
                <span>Mic Level</span>
              </div>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={voiceOnly} onChange={toggleVoiceOnly} />
                <span>Voice-only mode</span>
              </label>
            </div>
            <div className="flex items-center">
              <div className="vu-meter w-full"><div className="vu-fill" style={{width: `${vuLevel}%`}}></div></div>
            </div>
          </div>
        </div>

        <div className="floating-element w-full order-2">
          <h2 className="text-lg mb-2 text-blue-300">🌌 Remote Station</h2>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full aspect-video rounded-lg space-video" />
        </div>

        {/* Holographic AI Agent Panel */}
        <div className="floating-element w-full order-4">
          <h2 className="text-lg mb-2 text-blue-300">🧬 Holographic AI Agent</h2>
          <div className="space-container p-3 rounded-lg" style={{ backdropFilter: 'blur(6px)' }}>
            <div className="text-xs text-blue-300 mb-2">Real-time mission narration and insights</div>
            {/* Holographic waves */}
            <div className="mb-3 flex items-center justify-center">
              <div className="holo-waves">
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
              </div>
            </div>
            <div className="h-40 overflow-y-auto space-container p-2 rounded">
              {holoFeed.map(item => (
                <div key={item.id} className="mb-2">
                  <div className="text-[10px] text-blue-400">{item.ts}</div>
                  <div className="text-sm">{item.text}</div>
                </div>
              ))}
              {holoFeed.length === 0 && (
                <div className="text-sm text-blue-300">Standing by for mission events…</div>
              )}
            </div>
            {/* Cross-mission learning controls (stub) */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={federatedEnabled} onChange={(e) => setFederatedEnabled(e.target.checked)} />
                <span>Federated Learning</span>
              </label>
              <button className="px-2 py-1 space-button rounded" onClick={persistTelemetry}>Upload Patterns</button>
            </div>
          </div>
        </div>

        {/* Pattern Recognition Panel */}
        <div className="floating-element w-full order-3 xl:sticky xl:top-4 xl:col-start-3">
          <h2 className="text-lg mb-2 text-blue-300">🧠 Pattern Recognition</h2>
          <div className="space-container p-3 rounded-lg">
            <div className="text-sm mb-2">
              <span className="text-blue-300">Likely Cause:</span>
              <span className="ml-2 font-semibold">{breakCause}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-blue-300">
              <div>RTT: <span className="text-gray-200">{Math.round(lastStats.rttMs)} ms</span></div>
              <div>Jitter: <span className="text-gray-200">{Math.round(lastStats.jitterMs)} ms</span></div>
              <div>Loss: <span className="text-gray-200">{lastStats.lossPct.toFixed(1)}%</span></div>
            </div>
            <div className="mt-2 text-xs text-blue-300">Risk: <span className={`${predictiveRisk >= 70 ? 'text-red-400' : predictiveRisk >= 40 ? 'text-yellow-400' : 'text-green-400'}`}>{predictiveRisk}%</span></div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-blue-300">Satellite Relay: {satelliteConnected ? <span className="text-green-400">Engaged</span> : <span className="text-yellow-400">Standby</span>}</div>
              <div className="space-x-2">
                <button className="px-3 py-1 space-button rounded" onClick={() => engageSatelliteRelay('manual command')}>Engage Satellite</button>
              </div>
            </div>
          </div>
        </div>
        
      </div>

      {/* Alerts ticker */}
      <div className="mt-4 w-full max-w-6xl">
        {alerts.slice(-3).reverse().map(a => (
          <div key={a.id} className={`mb-2 p-2 rounded space-container ${a.level === 'error' ? 'border border-red-500' : a.level === 'warning' ? 'border border-yellow-500' : a.level === 'success' ? 'border border-green-500' : 'border border-blue-500'}`}>
            <div className="text-xs text-blue-300">{a.timestamp}</div>
            <div className="text-sm">{a.text}</div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="text-xs text-blue-300 text-center">No alerts. All systems nominal.</div>
        )}
      </div>
    </div>
  );
};

export default App;
