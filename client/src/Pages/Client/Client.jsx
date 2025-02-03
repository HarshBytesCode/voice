import { useEffect } from 'react';
import { useAppContext } from '../../context/ContextProvider';

function Client() {

  const { socket, peerConnection } = useAppContext();

  useEffect(() => {
    if (!peerConnection || !socket) return;

    console.log("Setting up WebRTC handlers...");

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
      }
    };

    peerConnection.ontrack = (event) => {
      console.log("Received remote track:", event.streams[0]);
      const remoteAudio = document.createElement("audio");
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.autoplay = true;
      document.body.appendChild(remoteAudio);
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'call:ready') {

        const localStream = await navigator.mediaDevices.getUserMedia({ audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 160000,
          channelCount: 2
        } });

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
        socket.send(JSON.stringify({ type: 'offer', offer }));
      }

      if (data.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }

      if (data.type === 'candidate') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };
  }, [peerConnection, socket]);

  function startCall() {
    socket.send(JSON.stringify({ type: 'connection:client' }));
  }

  return (
    <>
      <button onClick={startCall}>Start call</button>
    </>
  );
}

export default Client;
