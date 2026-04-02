import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { getSocket } from '../socket';

/**
 * VideoCall Component - PeerJS + Socket.IO + ExpressTURN
 * 
 * Features:
 * - Camera and microphone access
 * - Peer-to-peer connection via PeerJS
 * - Signaling via Socket.IO
 * - TURN server support (ExpressTURN)
 */

export default function VideoCall({ 
  user, 
  friendId, 
  friendName,
  onClose,
  autoStart = false, // New prop to auto-start call
  incomingPeerId = null // Peer ID of incoming caller
}) {
  const [peer, setPeer] = useState(null);
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerId, setPeerId] = useState(null);
  const [calling, setCalling] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteVideoOff, setRemoteVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const currentCallRef = useRef(null);
  const hasAnsweredRef = useRef(false);
  const localStreamRef = useRef(null); // Keep track of current stream
  const remoteStreamRef = useRef(null); // Keep track of remote stream

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketConnection = getSocket(user.uid, user.displayName || 'User');
    setSocket(socketConnection);

    // Listen for incoming call signals
    const handleCallSignal = ({ from, peerId: remotePeerId }) => {
      console.log(`📞 Incoming call from ${from}, peer ID: ${remotePeerId}`);
      // Auto-answer if it's from the friend we're chatting with
      if (from === friendId && peer && !connected && !calling) {
        answerCall(remotePeerId);
      }
    };

    // Listen for call ended signal
    const handleCallEnded = ({ from }) => {
      console.log(`📴 Call ended by ${from}, cleaning up...`);
      
      // Stop all local media tracks using ref
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('🛑 Stopped local track on call-ended:', track.kind);
        });
        localStreamRef.current = null;
      }
      
      // Stop all remote media tracks using ref
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('🛑 Stopped remote track on call-ended:', track.kind);
        });
        remoteStreamRef.current = null;
      }
      
      // Close peer connection
      if (currentCallRef.current) {
        currentCallRef.current.close();
        currentCallRef.current = null;
      }
      
      // Reset state
      setLocalStream(null);
      setRemoteStream(null);
      setConnected(false);
      setCalling(false);
      setError(null);
      hasAnsweredRef.current = false;
      
      // Close the video call modal
      if (onClose) {
        onClose();
      }
    };

    // Listen for media status changes
    const handleMediaStatus = ({ from, isMuted: remoteMutedStatus, isVideoOff: remoteVideoStatus }) => {
      if (from === friendId) {
        console.log(`📡 Media status from ${from}: muted=${remoteMutedStatus}, video=${remoteVideoStatus}`);
        setRemoteMuted(remoteMutedStatus);
        setRemoteVideoOff(remoteVideoStatus);
      }
    };

    socketConnection.on('call-signal', handleCallSignal);
    socketConnection.on('call-ended', handleCallEnded);
    socketConnection.on('media-status', handleMediaStatus);

    return () => {
      socketConnection.off('call-signal', handleCallSignal);
      socketConnection.off('call-ended', handleCallEnded);
      socketConnection.off('media-status', handleMediaStatus);
    };
  }, [user.uid, friendId, peer, connected, calling, onClose]);

  // Initialize PeerJS with ExpressTURN
  useEffect(() => {
    // ExpressTURN configuration - ONLY using ExpressTURN (no fallback)
    const iceServers = [
      {
        urls: import.meta.env.VITE_TURN_URL,
        username: import.meta.env.VITE_TURN_USERNAME,
        credential: import.meta.env.VITE_TURN_CREDENTIAL
      }
    ];

    const peerInstance = new Peer({
      config: {
        iceServers: iceServers
      },
      debug: 2 // Set to 0 in production
    });

    peerInstance.on('open', (id) => {
      console.log('✅ PeerJS connected with ID:', id);
      setPeerId(id);
    });

    peerInstance.on('error', (err) => {
      console.error('❌ PeerJS error:', err);
      setError(`Connection error: ${err.type}`);
    });

    // Handle incoming calls
    peerInstance.on('call', (call) => {
      console.log('📞 Receiving call...');
      
      // Get local stream first
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((localMediaStream) => {
          localStreamRef.current = localMediaStream; // Store in ref
          setLocalStream(localMediaStream);
          
          // Answer the call with our stream
          call.answer(localMediaStream);
          currentCallRef.current = call;

          // Receive remote stream
          call.on('stream', (remoteStream) => {
            console.log('✅ Receiving remote stream');
            remoteStreamRef.current = remoteStream; // Store in ref
            setRemoteStream(remoteStream);
            setConnected(true);
            
            // Send initial media status to the other user
            if (socket && friendId && user) {
              socket.emit('media-status', {
                to: friendId,
                from: user.uid,
                isMuted: isMuted,
                isVideoOff: isVideoOff
              });
            }
          });

          call.on('close', () => {
            console.log('📴 Call ended');
            endCall();
          });
        })
        .catch((err) => {
          console.error('❌ Failed to get media:', err);
          setError('Camera/microphone access denied');
        });
    });

    setPeer(peerInstance);

    return () => {
      console.log('🧹 Cleaning up PeerJS and media streams...');
      
      // Stop all local media tracks using ref
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('🛑 Cleanup: Stopped local track:', track.kind);
        });
        localStreamRef.current = null;
      }
      
      // Stop all remote media tracks using ref
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('🛑 Cleanup: Stopped remote track:', track.kind);
        });
        remoteStreamRef.current = null;
      }
      
      // Close peer connection
      if (currentCallRef.current) {
        currentCallRef.current.close();
      }
      
      // Destroy peer instance
      if (peerInstance) {
        peerInstance.destroy();
      }
    };
  }, []); // Empty dependency array - only run once

  // Display local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Auto-start call if autoStart prop is true
  useEffect(() => {
    if (autoStart && peer && peerId && socket && !calling && !connected && !hasAnsweredRef.current) {
      hasAnsweredRef.current = true;
      
      if (incomingPeerId) {
        // We're accepting an incoming call - answer it
        console.log('🚀 Auto-answering incoming call from peer:', incomingPeerId);
        answerCall(incomingPeerId);
      } else {
        // We're initiating a new call
        console.log('🚀 Auto-starting new call...');
        const initiateCall = async () => {
          try {
            const stream = await getMediaStream();
            console.log('✅ Media stream ready, sending call signal...');
            
            socket.emit('call-signal', {
              to: friendId,
              from: user.uid,
              peerId: peerId
            });
            
            setCalling(true);
            console.log('📞 Auto-start call signal sent');
          } catch (err) {
            console.error('❌ Auto-start failed:', err);
            setError('Failed to access camera/microphone');
          }
        };
        
        initiateCall();
      }
    }
  }, [autoStart, peer, peerId, socket, calling, connected, incomingPeerId, friendId, user.uid]);

  // Request camera and microphone access
  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      localStreamRef.current = stream; // Store in ref
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('❌ Media access error:', err);
      setError('Failed to access camera/microphone. Please grant permissions.');
      throw err;
    }
  };

  // Start a call
  const startCall = async () => {
    if (!peer || !socket || !peerId) {
      setError('Not ready to call. Please wait...');
      return;
    }

    setCalling(true);
    setError(null);

    try {
      // Get local media stream
      await getMediaStream();

      // Send call signal via Socket.IO
      socket.emit('call-signal', {
        to: friendId,
        from: user.uid,
        peerId: peerId
      });

      console.log('📞 Call signal sent to', friendId);
      
      // Note: The actual peer connection will be established when
      // the other user responds via answerCall()
      
    } catch (err) {
      console.error('❌ Failed to start call:', err);
      setCalling(false);
    }
  };

  // Answer an incoming call
  const answerCall = async (remotePeerId) => {
    console.log('📞 Answering call from peer:', remotePeerId);
    
    // Make sure we have local stream first
    if (!localStream) {
      console.log('⏳ Getting media stream first...');
      try {
        const stream = await getMediaStream();
        setLocalStream(stream);
        
        // Now call with the stream
        const call = peer.call(remotePeerId, stream);
        currentCallRef.current = call;

        call.on('stream', (remoteStream) => {
          console.log('✅ Connected! Receiving remote stream');
          remoteStreamRef.current = remoteStream; // Store in ref
          setRemoteStream(remoteStream);
          setConnected(true);
          setCalling(false);
          
          // Send initial media status to the other user
          if (socket && friendId) {
            socket.emit('media-status', {
              to: friendId,
              from: user.uid,
              isMuted: isMuted,
              isVideoOff: isVideoOff
            });
          }
        });

        call.on('close', () => {
          console.log('📴 Call ended');
          endCall();
        });

        call.on('error', (err) => {
          console.error('❌ Call error:', err);
          setError('Call failed. Please try again.');
          setCalling(false);
        });
      } catch (err) {
        console.error('❌ Failed to get media:', err);
        setError('Failed to access camera/microphone');
        setCalling(false);
      }
    } else {
      // We already have the stream
      console.log('📞 Calling peer with existing stream');
      const call = peer.call(remotePeerId, localStream);
      currentCallRef.current = call;

      call.on('stream', (remoteStream) => {
        console.log('✅ Connected! Receiving remote stream');
        remoteStreamRef.current = remoteStream; // Store in ref
        setRemoteStream(remoteStream);
        setConnected(true);
        setCalling(false);
        
        // Send initial media status to the other user
        if (socket && friendId) {
          socket.emit('media-status', {
            to: friendId,
            from: user.uid,
            isMuted: isMuted,
            isVideoOff: isVideoOff
          });
        }
      });

      call.on('close', () => {
        console.log('📴 Call ended');
        endCall();
      });

      call.on('error', (err) => {
        console.error('❌ Call error:', err);
        setError('Call failed. Please try again.');
        setCalling(false);
      });
    }
  };

  // End the call
  const endCall = () => {
    console.log('📴 Ending call and cleaning up...');
    
    // Stop all local media tracks using ref
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped local track:', track.kind);
      });
      localStreamRef.current = null;
    }
    
    // Stop all remote media tracks using ref
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped remote track:', track.kind);
      });
      remoteStreamRef.current = null;
    }
    
    // Close peer connection
    if (currentCallRef.current) {
      currentCallRef.current.close();
      currentCallRef.current = null;
    }

    // Notify via Socket.IO
    if (socket && friendId && user.uid) {
      socket.emit('call-ended', { to: friendId, from: user.uid });
      console.log('📤 Sent call-ended signal to', friendId);
    }

    // Reset all state
    setLocalStream(null);
    setRemoteStream(null);
    setConnected(false);
    setCalling(false);
    setError(null);
    setIsMuted(false);
    setIsVideoOff(false);
    hasAnsweredRef.current = false;
    
    // Close the video call component
    if (onClose) {
      onClose();
    }
  };

  // Display remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMutedState = !audioTrack.enabled;
        setIsMuted(newMutedState);
        
        // Notify the other user
        if (socket && friendId) {
          socket.emit('media-status', {
            to: friendId,
            from: user.uid,
            isMuted: newMutedState,
            isVideoOff: isVideoOff
          });
        }
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newVideoState = !videoTrack.enabled;
        setIsVideoOff(newVideoState);
        
        // Notify the other user
        if (socket && friendId) {
          socket.emit('media-status', {
            to: friendId,
            from: user.uid,
            isMuted: isMuted,
            isVideoOff: newVideoState
          });
        }
      }
    }
  };

  return (
    <div className="video-call-container">
      <div className="video-call-header">
        <h3>Call with {friendName}</h3>
        <button className="close-btn" onClick={endCall}>✕</button>
      </div>

      {error && (
        <div className="call-error">
          ⚠️ {error}
        </div>
      )}

      <div className="video-grid">
        {/* Local Video */}
        <div className="video-box local">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="video-element"
          />
          <div className="video-label">You</div>
        </div>

        {/* Remote Video */}
        <div className="video-box remote">
          {remoteStream ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="video-element"
              />
              <div className="video-label">{friendName}</div>
              
              {/* Remote user status indicators */}
              <div className="remote-status-indicators">
                {remoteMuted && (
                  <div className="status-indicator muted-indicator" title="Microphone muted">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="1" y1="1" x2="23" y2="23"/>
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  </div>
                )}
                {remoteVideoOff && (
                  <div className="status-indicator video-off-indicator" title="Camera off">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="waiting-message">
              {calling ? '📞 Calling...' : '⏳ Waiting for connection...'}
            </div>
          )}
        </div>
      </div>

      <div className="call-controls">
        {!connected && !calling && !autoStart && (
          <button className="control-btn start" onClick={startCall}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>Start Call</span>
          </button>
        )}
        
        {(connected || calling) && (
          <>
            <button 
              className={`control-btn ${isMuted ? 'muted' : 'unmuted'}`} 
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="1" y1="1" x2="23" y2="23"/>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
            
            <button 
              className={`control-btn ${isVideoOff ? 'video-off' : 'video-on'}`} 
              onClick={toggleVideo}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              )}
            </button>
            
            <button className="control-btn end" onClick={endCall}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
                <line x1="23" y1="1" x2="1" y2="23"/>
              </svg>
              <span>End Call</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
