// C:\Users\prith\Desktop\TripIt\frontend\src\components\voice\VoiceChat.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';

// Simple Peer Connection Manager
class PeerConnectionManager {
  constructor(socket, userId, onStreamReceived) {
    this.socket = socket;
    this.userId = userId;
    this.onStreamReceived = onStreamReceived;
    this.peers = new Map(); // Map<userId, RTCPeerConnection>
    this.localStream = null;
    
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
  }

  async startLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      return this.localStream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw error;
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  createPeerConnection(remoteUserId) {
    if (this.peers.has(remoteUserId)) {
      return this.peers.get(remoteUserId);
    }

    const pc = new RTCPeerConnection(this.configuration);

    // Add local stream tracks to the peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received remote track from:', remoteUserId);
      this.onStreamReceived(remoteUserId, event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtcSignal', {
          to: remoteUserId,
          signal: {
            type: 'ice-candidate',
            candidate: event.candidate
          }
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${remoteUserId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.removePeer(remoteUserId);
      }
    };

    this.peers.set(remoteUserId, pc);
    return pc;
  }

  async createOffer(remoteUserId) {
    const pc = this.createPeerConnection(remoteUserId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      this.socket.emit('webrtcSignal', {
        to: remoteUserId,
        signal: {
          type: 'offer',
          sdp: offer
        }
      });
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  }

  async handleOffer(fromUserId, offer) {
    const pc = this.createPeerConnection(fromUserId);
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      this.socket.emit('webrtcSignal', {
        to: fromUserId,
        signal: {
          type: 'answer',
          sdp: answer
        }
      });
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  }

  async handleAnswer(fromUserId, answer) {
    const pc = this.peers.get(fromUserId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Failed to handle answer:', error);
      }
    }
  }

  async handleIceCandidate(fromUserId, candidate) {
    const pc = this.peers.get(fromUserId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Failed to add ICE candidate:', error);
      }
    }
  }

  removePeer(userId) {
    const pc = this.peers.get(userId);
    if (pc) {
      pc.close();
      this.peers.delete(userId);
    }
  }

  cleanup() {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.stopLocalStream();
  }
}

// Audio Player Component for Remote Users
const RemoteAudioPlayer = ({ stream, username, isMuted }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="flex items-center gap-2 p-2 bg-background rounded-md">
      <audio ref={audioRef} autoPlay playsInline />
      <div className="flex items-center gap-2 flex-1">
        {isMuted ? (
          <VolumeX className="h-4 w-4 text-foreground-secondary" />
        ) : (
          <Volume2 className="h-4 w-4 text-green-500" />
        )}
        <span className="text-sm text-foreground">{username}</span>
      </div>
    </div>
  );
};

// Main Voice Chat Component
const VoiceChat = ({ socket, liveUsers, currentUserId }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // Map<userId, stream>
  const [error, setError] = useState(null);
  
  const peerManagerRef = useRef(null);

  // Initialize peer manager
  useEffect(() => {
    if (!socket) return;

    const handleStreamReceived = (userId, stream) => {
      setRemoteStreams(prev => new Map(prev).set(userId, stream));
    };

    peerManagerRef.current = new PeerConnectionManager(
      socket,
      currentUserId,
      handleStreamReceived
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

    const handleSignal = async ({ from, signal }) => {
      const manager = peerManagerRef.current;
      
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

    // Remove streams for users who left
    setRemoteStreams(prev => {
      const newStreams = new Map(prev);
      const currentUserIds = new Set(liveUsers.map(u => u._id));
      
      for (const userId of newStreams.keys()) {
        if (!currentUserIds.has(userId) && userId !== currentUserId) {
          newStreams.delete(userId);
          peerManagerRef.current.removePeer(userId);
        }
      }
      
      return newStreams;
    });
  }, [liveUsers, currentUserId]);

  const startCall = async () => {
    setError(null);
    try {
      const manager = peerManagerRef.current;
      await manager.startLocalStream();
      setIsInCall(true);

      // Create offers to all other users
      const otherUsers = liveUsers.filter(u => u._id !== currentUserId);
      for (const user of otherUsers) {
        await manager.createOffer(user._id);
      }
    } catch (err) {
      console.error('Failed to start call:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const endCall = () => {
    const manager = peerManagerRef.current;
    manager.cleanup();
    setIsInCall(false);
    setIsMuted(false);
    setRemoteStreams(new Map());
  };

  const toggleMute = () => {
    const manager = peerManagerRef.current;
    if (manager.localStream) {
      const audioTrack = manager.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Get usernames for remote streams
  const getUsername = (userId) => {
    const user = liveUsers.find(u => u._id === userId);
    return user?.username || 'Unknown User';
  };

  return (
    <div className="fixed bottom-6 right-96 z-50 bg-background-secondary border border-border rounded-lg shadow-xl p-4 w-72">
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
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-500">
          {error}
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
                  : 'bg-background hover:bg-background-secondary text-foreground'
              }`}
            >
              {isMuted ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span className="text-sm">Unmute</span>
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
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {remoteStreams.size === 0 ? (
              <p className="text-xs text-foreground-secondary text-center py-2">
                Waiting for others to join...
              </p>
            ) : (
              Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                <RemoteAudioPlayer
                  key={userId}
                  stream={stream}
                  username={getUsername(userId)}
                  isMuted={false}
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