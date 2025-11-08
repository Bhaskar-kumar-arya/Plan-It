// C:\Users\prith\Desktop\TripIt\frontend\src\components\voice\VoiceChat.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, AlertCircle } from 'lucide-react';

// Simple Peer Connection Manager
class PeerConnectionManager {
  constructor(socket, userId, onStreamReceived, onConnectionStateChange) {
    this.socket = socket;
    this.userId = userId;
    this.onStreamReceived = onStreamReceived;
    this.onConnectionStateChange = onConnectionStateChange;
    this.peers = new Map(); // Map<userId, RTCPeerConnection>
    this.localStream = null;
    
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
      ]
    };
  }

  async startLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }, 
        video: false 
      });
      console.log('✅ Local stream started:', this.localStream.id);
      return this.localStream;
    } catch (error) {
      console.error('❌ Failed to get local stream:', error);
      throw error;
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
      this.localStream = null;
    }
  }

  createPeerConnection(remoteUserId) {
    if (this.peers.has(remoteUserId)) {
      console.log('♻️ Reusing existing peer connection for:', remoteUserId);
      return this.peers.get(remoteUserId);
    }

    console.log('🔗 Creating new peer connection for:', remoteUserId);
    const pc = new RTCPeerConnection(this.configuration);

    // Add local stream tracks to the peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        const sender = pc.addTrack(track, this.localStream);
        console.log('📤 Added local track to peer:', track.kind, track.id);
      });
    } else {
      console.warn('⚠️ No local stream available when creating peer connection');
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('📥 Received remote track from:', remoteUserId, event.streams[0].id);
      if (event.streams && event.streams[0]) {
        this.onStreamReceived(remoteUserId, event.streams[0]);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate to:', remoteUserId);
        this.socket.emit('webrtcSignal', {
          to: remoteUserId,
          signal: {
            type: 'ice-candidate',
            candidate: event.candidate
          }
        });
      }
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE connection state with ${remoteUserId}:`, pc.iceConnectionState);
      this.onConnectionStateChange(remoteUserId, pc.iceConnectionState);
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`📡 Connection state with ${remoteUserId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        console.log('❌ Connection failed/disconnected, removing peer:', remoteUserId);
        this.removePeer(remoteUserId);
      }
    };

    this.peers.set(remoteUserId, pc);
    return pc;
  }

  async createOffer(remoteUserId) {
    console.log('📞 Creating offer for:', remoteUserId);
    const pc = this.createPeerConnection(remoteUserId);
    
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);
      console.log('📤 Sending offer to:', remoteUserId);
      
      this.socket.emit('webrtcSignal', {
        to: remoteUserId,
        signal: {
          type: 'offer',
          sdp: offer
        }
      });
    } catch (error) {
      console.error('❌ Failed to create offer:', error);
    }
  }

  async handleOffer(fromUserId, offer) {
    console.log('📥 Received offer from:', fromUserId);
    const pc = this.createPeerConnection(fromUserId);
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('📤 Sending answer to:', fromUserId);
      
      this.socket.emit('webrtcSignal', {
        to: fromUserId,
        signal: {
          type: 'answer',
          sdp: answer
        }
      });
    } catch (error) {
      console.error('❌ Failed to handle offer:', error);
    }
  }

  async handleAnswer(fromUserId, answer) {
    console.log('📥 Received answer from:', fromUserId);
    const pc = this.peers.get(fromUserId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('✅ Remote description set for:', fromUserId);
      } catch (error) {
        console.error('❌ Failed to handle answer:', error);
      }
    } else {
      console.warn('⚠️ No peer connection found for:', fromUserId);
    }
  }

  async handleIceCandidate(fromUserId, candidate) {
    const pc = this.peers.get(fromUserId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ Added ICE candidate from:', fromUserId);
      } catch (error) {
        console.error('❌ Failed to add ICE candidate:', error);
      }
    } else {
      console.warn('⚠️ No peer connection found for ICE candidate from:', fromUserId);
    }
  }

  removePeer(userId) {
    const pc = this.peers.get(userId);
    if (pc) {
      pc.close();
      this.peers.delete(userId);
      console.log('🗑️ Removed peer:', userId);
    }
  }

  cleanup() {
    console.log('🧹 Cleaning up peer connections');
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.stopLocalStream();
  }
}

// Audio Player Component for Remote Users
const RemoteAudioPlayer = ({ stream, username, userId }) => {
  const audioRef = useRef(null);
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.volume = 1.0;
      
      // Force play
      audioRef.current.play().catch(err => {
        console.error('Failed to play audio:', err);
      });

      console.log('🔊 Audio element configured for:', username, stream.id);

      // Monitor audio levels
      try {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(average);
        };

        const intervalId = setInterval(checkVolume, 100);

        return () => {
          clearInterval(intervalId);
          source.disconnect();
          audioContext.close();
        };
      } catch (err) {
        console.error('Failed to create audio analyzer:', err);
      }
    }
  }, [stream, username]);

  const isActive = volume > 5;

  return (
    <div className="flex items-center gap-2 p-2 bg-background rounded-md">
      <audio ref={audioRef} autoPlay playsInline />
      <div className="flex items-center gap-2 flex-1">
        {isActive ? (
          <Volume2 className="h-4 w-4 text-green-500 animate-pulse" />
        ) : (
          <Volume2 className="h-4 w-4 text-foreground-secondary" />
        )}
        <span className="text-sm text-foreground">{username}</span>
      </div>
      <div className="h-1 w-16 bg-background-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-100"
          style={{ width: `${Math.min(volume * 2, 100)}%` }}
        />
      </div>
    </div>
  );
};

// Main Voice Chat Component
const VoiceChat = ({ socket, liveUsers, currentUserId }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [connectionStates, setConnectionStates] = useState(new Map());
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState([]);
  
  const peerManagerRef = useRef(null);

  const addDebug = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebug(prev => [...prev.slice(-4), `[${timestamp}] ${message}`]);
  };

  // Initialize peer manager
  useEffect(() => {
    if (!socket) return;

    const handleStreamReceived = (userId, stream) => {
      console.log('🎵 Stream received callback for:', userId);
      addDebug(`Stream received from ${userId}`);
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, stream);
        return newMap;
      });
    };

    const handleConnectionStateChange = (userId, state) => {
      setConnectionStates(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, state);
        return newMap;
      });
    };

    peerManagerRef.current = new PeerConnectionManager(
      socket,
      currentUserId,
      handleStreamReceived,
      handleConnectionStateChange
    );

    return () => {
      if (peerManagerRef.current) {
        peerManagerRef.current.cleanup();
      }
    };
  }, [socket, currentUserId]);

  // Listen for WebRTC signals
  useEffect(() => {
    if (!socket || !peerManagerRef.current) return;

    const handleSignal = async ({ from, username, signal }) => {
      const manager = peerManagerRef.current;
      
      console.log('📨 Received signal from:', from, 'type:', signal.type);
      addDebug(`Signal ${signal.type} from ${username || from}`);
      
      if (signal.type === 'offer') {
        await manager.handleOffer(from, signal.sdp);
      } else if (signal.type === 'answer') {
        await manager.handleAnswer(from, signal.sdp);
      } else if (signal.type === 'ice-candidate') {
        await manager.handleIceCandidate(from, signal.candidate);
      }
    };

    socket.on('webrtcSignal', handleSignal);

    return () => {
      socket.off('webrtcSignal', handleSignal);
    };
  }, [socket]);

  // Handle user leaving
  useEffect(() => {
    if (!peerManagerRef.current) return;

    setRemoteStreams(prev => {
      const newStreams = new Map(prev);
      const currentUserIds = new Set(liveUsers.map(u => u._id));
      
      for (const userId of newStreams.keys()) {
        if (!currentUserIds.has(userId) && userId !== currentUserId) {
          newStreams.delete(userId);
          peerManagerRef.current.removePeer(userId);
          addDebug(`User left: ${userId}`);
        }
      }
      
      return newStreams;
    });
  }, [liveUsers, currentUserId]);

  const startCall = async () => {
    setError(null);
    setDebug([]);
    
    try {
      addDebug('Starting call...');
      const manager = peerManagerRef.current;
      await manager.startLocalStream();
      setIsInCall(true);
      addDebug('Local stream started');

      // Small delay to ensure stream is ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create offers to all other users
      const otherUsers = liveUsers.filter(u => u._id !== currentUserId);
      addDebug(`Creating offers to ${otherUsers.length} users`);
      
      for (const user of otherUsers) {
        console.log('📞 Initiating call to:', user.username);
        await manager.createOffer(user._id);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between offers
      }
    } catch (err) {
      console.error('❌ Failed to start call:', err);
      addDebug(`Error: ${err.message}`);
      setError('Failed to access microphone. Please check permissions.');
      setIsInCall(false);
    }
  };

  const endCall = () => {
    addDebug('Ending call');
    const manager = peerManagerRef.current;
    manager.cleanup();
    setIsInCall(false);
    setIsMuted(false);
    setRemoteStreams(new Map());
    setConnectionStates(new Map());
    setDebug([]);
  };

  const toggleMute = () => {
    const manager = peerManagerRef.current;
    if (manager.localStream) {
      const audioTrack = manager.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        addDebug(audioTrack.enabled ? 'Unmuted' : 'Muted');
      }
    }
  };

  const getUsername = (userId) => {
    const user = liveUsers.find(u => u._id === userId);
    return user?.username || 'Unknown User';
  };

  return (
    <div className="fixed bottom-6 right-96 z-50 bg-background-secondary border border-border rounded-lg shadow-xl p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Voice Chat
        </h3>
        <span className="text-xs text-foreground-secondary">
          {liveUsers.length - 1} online
        </span>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-500 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {!isInCall ? (
        <button
          onClick={startCall}
          disabled={liveUsers.length === 1}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Phone className="h-4 w-4" />
          <span>Start Voice Chat</span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={toggleMute}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-background hover:bg-background-secondary text-foreground border border-border'
              }`}
            >
              {isMuted ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span className="text-sm">Unmuted</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span className="text-sm">Mute</span>
                </>
              )}
            </button>
            <button
              onClick={endCall}
              className="flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              title="End call"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          </div>

          {/* Debug Info */}
          {debug.length > 0 && (
            <div className="text-xs text-foreground-secondary bg-background p-2 rounded max-h-20 overflow-y-auto font-mono">
              {debug.map((msg, i) => (
                <div key={i}>{msg}</div>
              ))}
            </div>
          )}

          {/* Remote Users */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {remoteStreams.size === 0 ? (
              <div className="text-xs text-foreground-secondary text-center py-4">
                <p>Waiting for others to join...</p>
                <p className="mt-1">Make sure they click "Start Voice Chat"</p>
              </div>
            ) : (
              Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                <RemoteAudioPlayer
                  key={userId}
                  stream={stream}
                  username={getUsername(userId)}
                  userId={userId}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceChat;