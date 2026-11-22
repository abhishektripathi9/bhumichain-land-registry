import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useWeb3 } from "../context/Web3Context";
import {
  X,
  Send,
  MessageSquare,
  ShieldCheck,
  User,
  Clock,
  Sparkles,
} from "lucide-react";

export default function ChatModal({ parcel, onClose }) {
  const { account } = useWeb3();
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const propertyId = parcel?._id;
  const sellerWallet = parcel?.ownerWallet?.toLowerCase();
  const currentWallet = (account || "0x90f79bf6eb2c4f870365e785982e1f101e93b906").toLowerCase();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!propertyId) return;

    // 1. Fetch past chat history
    fetch(`${apiUrl}/api/messages/property/${propertyId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      })
      .catch((err) => console.warn("Failed to load message history:", err));

    // 2. Initialize Socket.io connection
    const socket = io(apiUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_room", {
        propertyId,
        walletAddress: currentWallet,
      });
    });

    socket.on("new_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [propertyId, currentWallet, apiUrl]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !socketRef.current) return;

    const payload = {
      propertyId,
      senderWallet: currentWallet,
      receiverWallet: currentWallet === sellerWallet ? "buyer" : sellerWallet,
      message: inputMsg.trim(),
    };

    socketRef.current.emit("send_message", payload);
    setInputMsg("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[580px] animate-in fade-in zoom-in-95 duration-200">
        {/* Chat Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Direct Buyer-Seller Channel
                </h3>
                <span className="flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{isConnected ? "Live P2P" : "Connecting..."}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Plot: Khasra {parcel?.khasraNumber} ({parcel?.village}) • Asking: {parcel?.price} ETH
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Middle Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/60">
          <div className="text-center my-2">
            <span className="text-[10px] uppercase font-mono tracking-wider px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              End-to-End On-Chain Verified Discussion
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <p>No messages yet.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Say hello to negotiate terms or schedule on-site boundary verification.
              </p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isMe = m.senderWallet?.toLowerCase() === currentWallet.toLowerCase();
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-sm shadow-md"
                        : "bg-slate-800 text-slate-200 border border-slate-700/80 rounded-bl-sm"
                    }`}
                  >
                    <p>{m.message}</p>
                  </div>
                  <div className="flex items-center space-x-1.5 mt-1 px-1 text-[10px] text-slate-500 font-mono">
                    <span>
                      {isMe
                        ? "You"
                        : m.senderWallet?.toLowerCase() === sellerWallet
                        ? "Owner (Seller)"
                        : "Buyer"}
                    </span>
                    <span>•</span>
                    <span>
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Type your message to the owner..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputMsg.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
