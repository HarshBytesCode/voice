import { createContext, useContext, useMemo, useState, useEffect } from "react";

// Combined context
const AppContext = createContext(null);

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");

    ws.onopen = () => console.log("WebSocket Connected");
    ws.onclose = () => console.log("WebSocket Disconnected");

    setSocket(ws);
    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    const rtcPeer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    setPeerConnection(rtcPeer);

    return () => {
      rtcPeer.close();
    };
  }, []);

  return (
    <AppContext.Provider value={{ socket, peerConnection }}>
      {children}
    </AppContext.Provider>
  );
};
