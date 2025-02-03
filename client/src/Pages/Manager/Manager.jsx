import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/ContextProvider';

function Manager() {
  const { socket, peerConnection } = useAppContext();
  const [stream, setStream] = useState(null);

  useEffect(() => {

    if (!socket || !peerConnection) return;


    peerConnection.ontrack = (event) => {
      const remoteAudio = document.createElement("audio");
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.autoplay = true;
      document.body.appendChild(remoteAudio);
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
      }
    };

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'connection:admin' }));
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "offer") {
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 160000,
          channelCount: 2
        } });

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
        socket.send(JSON.stringify({ type: "answer", answer }));

        setStream(localStream);
      }

      if (data.type === 'candidate') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };
  }, [socket, peerConnection]);

  return <div>Manager</div>;
}

export default Manager;
