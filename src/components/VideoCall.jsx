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
  onClose 
}) {
  const [peer, setPeer] = useState(null);
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerId, setPeerId] = useState(null);
  const [calling, setCalling] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const currentCallRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketConnection = getSocket(user.uid, user.displayName || 'User');
    setSocket(socketConnection);

    // Listen for incoming call signals
    const handleCallSignal = ({ from, peerId: remotePeerId }) => {
      console.log(`📞 Incoming call from ${from}, peer ID: ${remotePeerId}`);
      // Auto-answer if it's from the friend we're chatting with
      if (from === friendId && peer) {
        answerCall(remotePeerId);
      }
    };

    socketConnection.on('call-signal', handleCallSignal);

    return () => {
      socketConnection.off('call-signal', handleCallSignal);
    };
  }, [user.uid, friendId, peer]);

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
          setLocalStream(localMediaStream);
          
          // Answer the call with our stream
          call.answer(localMediaStream);
          currentCallRef.current = call;

          // Receive remote stream
          call.on('stream', (remoteStream) => {
            console.log('✅ Receiving remote stream');
            setRemoteStream(remoteStream);
            setConnected(true);
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
      if (peerInstance) {
        peerInstance.destroy();
      }
    };
  }, []);

  // Display local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Display remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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
      const stream = await getMediaStream();

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
          setRemoteStream(remoteStream);
          setConnected(true);
          setCalling(false);
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
        setRemoteStream(remoteStream);
        setConnected(true);
        setCalling(false);
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
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (currentCallRef.current) {
      currentCallRef.current.close();
    }

    // Notify via Socket.IO
    if (socket) {
      socket.emit('call-ended', { to: friendId, from: user.uid });
    }

    // Reset state
    setLocalStream(null);
    setRemoteStream(null);
    setConnected(false);
    setCalling(false);
    
    // Close the video call component
    if (onClose) {
      onClose();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
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
            </>
          ) : (
            <div className="waiting-message">
              {calling ? '📞 Calling...' : '⏳ Waiting for connection...'}
            </div>
          )}
        </div>
      </div>

      <div className="call-controls">
        {!connected && !calling && (
          <button className="control-btn start" onClick={startCall}>
            📞 Start Call
          </button>
        )}
        
        {(connected || calling) && (
          <>
            <button className="control-btn mute" onClick={toggleMute}>
              🎤 Mute
            </button>
            <button className="control-btn video" onClick={toggleVideo}>
              📹 Video
            </button>
            <button className="control-btn end" onClick={endCall}>
              📴 End Call
            </button>
          </>
        )}
      </div>

      <div className="call-info">
        <small>Peer ID: {peerId || 'Connecting...'}</small>
        <small>Status: {connected ? '✅ Connected' : calling ? '📞 Calling...' : '⏳ Ready'}</small>
      </div>
    </div>
  );
}
