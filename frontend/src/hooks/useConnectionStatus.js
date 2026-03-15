import { useState, useEffect } from "react";
import { onConnectionStatusChange } from "../connection";

export function useConnectionStatus() {
  const [status, setStatus] = useState("connecting");
  useEffect(() => onConnectionStatusChange(setStatus), []);
  return status; // 'connecting' | 'connected' | 'failed' | 'reconnecting'
}
