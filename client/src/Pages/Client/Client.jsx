import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/ContextProvider';
import ClientModel from '../../componenents/ClientModel';

function Client() {

  const { socket, peerConnection } = useAppContext();
  const [message, setMessage] = useState("");
  const [isCalled, setIsCalled] = useState(false);

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

      if(data.type === 'manager:inactive') {
        setMessage('There is no admin available right now. Please try again later.')
        setTimeout(() => {
          setIsCalled(false)
        }, 3000);
      }

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

      if(data.type === 'disconnection:admin') {
        endCall()
      }
    };
  }, [peerConnection, socket]);

  function startCall() {
    socket.send(JSON.stringify({ type: 'connection:client' }));
    setIsCalled(true)
    setMessage("Connecting you to the admin...")
  }

  function endCall() {
    setIsCalled(false)
    socket.send(JSON.stringify({ type: 'disconnection:client' }));
    peerConnection.getSenders().forEach(sender => peerConnection.removeTrack(sender));

    peerConnection.onicecandidate = null;
    peerConnection.ontrack = null;
    peerConnection.onconnectionstatechange = null;
    peerConnection.oniceconnectionstatechange = null;
    peerConnection.onsignalingstatechange = null;
    peerConnection.close()
  }

  return (
    <>
      <button onClick={startCall}>Start call</button>
      <ClientModel
      message={message}
      isCalled={isCalled}
      endCall={endCall}
      />
    </>
  );
}

export default Client;
