"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store";
import { useCallStore } from "@/store/useCallStore";
import { useWebRTC } from "@/hooks/useWebRTC";
import {
  useMovies,
  useAddMovie,
  useToggleMovieWatched,
  useDeleteMovie
} from "@/hooks/useSupabase";
import { Play, MonitorUp, PhoneOff, Mic, MicOff, Video, VideoOff, Check, Plus, Trash2, Clapperboard, Tv } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WatchPage() {
  const { user } = useAuthStore();
  const {
    status, callType,
    localStream, remoteStream,
    localScreenStream, remoteScreenStream,
    isMuted, isVideoOff, isScreenSharing
  } = useCallStore();
  const { startCall, endCall, toggleMute, toggleVideo, toggleScreenShare } = useWebRTC();

  const { movies } = useMovies();
  const addMovie = useAddMovie();
  const toggleWatched = useToggleMovieWatched();
  const deleteMovie = useDeleteMovie();

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"movie" | "show">("movie");

  const remoteScreenRef = useRef<HTMLVideoElement>(null);
  const localScreenRef = useRef<HTMLVideoElement>(null);

  const remoteCameraRef = useRef<HTMLVideoElement>(null);
  const localCameraRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localCameraRef.current && localStream) {
      localCameraRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteCameraRef.current && remoteStream) {
      remoteCameraRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localScreenRef.current && localScreenStream) {
      localScreenRef.current.srcObject = localScreenStream;
    }
  }, [localScreenStream]);

  useEffect(() => {
    if (remoteScreenRef.current && remoteScreenStream) {
      remoteScreenRef.current.srcObject = remoteScreenStream;
    }
  }, [remoteScreenStream]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await addMovie(newTitle.trim(), newType);
    setNewTitle("");
  };

  const isInRoom = status === 'connected' && callType === 'movie_room';

  return (
    <div className="h-full flex flex-col md:flex-row bg-black text-white overflow-hidden">

      {/* ── MAIN STAGE (Theater) ── */}
      <div className="flex-1 relative flex flex-col border-b md:border-b-0 md:border-r border-white/10">
        <div className="p-4 bg-zinc-900/50 flex items-center justify-between z-10 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Play size={16} className="text-white fill-current ml-0.5" />
            </div>
            <h1 className="font-bold text-lg">Theater Room</h1>
          </div>

          <div className="flex items-center gap-3">
            {!isInRoom ? (
              <button
                onClick={() => startCall('movie_room')}
                className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-full text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <MonitorUp size={16} />
                Start Server
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-medium text-success">Live</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video Player Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {isInRoom ? (
            <>
              {remoteScreenStream ? (
                <video
                  ref={remoteScreenRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : localScreenStream ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={localScreenRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain opacity-50"
                  />
                  <div className="absolute px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white/80 font-medium">
                    You are sharing your screen
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <MonitorUp size={24} className="text-white/50" />
                  </div>
                  <p className="text-white/50">Waiting for screen share...</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-white/40 p-8 max-w-sm">
              <MonitorUp size={48} className="mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-medium text-white/80 mb-2">Theater is Empty</h2>
              <p className="text-sm">Start the server to share your screen, or wait for your partner to invite you.</p>
            </div>
          )}
        </div>

        {/* Call Controls (Bottom of Theater) */}
        {isInRoom && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl">
            <button onClick={toggleMute} className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}>
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button onClick={toggleVideo} className={`p-3 rounded-full transition-colors ${isVideoOff ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}>
              {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
            </button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <button onClick={() => endCall()} className="p-3 rounded-full bg-error text-white hover:scale-105 transition-transform">
              <PhoneOff size={18} />
            </button>
          </div>
        )}
      </div>

      {/* ── SIDEBAR (Watchlist & Mini Cams) ── */}
      <div className="w-full md:w-80 lg:w-96 bg-zinc-950 flex flex-col shrink-0">

        {/* Mini Cams Container */}
        {isInRoom && (
          <div className="flex p-2 gap-2 border-b border-white/5 bg-zinc-900 shrink-0 overflow-x-auto">
            {/* Local Mini Cam */}
            {localStream && (
              <div className="w-32 md:w-full h-32 md:h-48 rounded-xl overflow-hidden relative border border-white/10 shrink-0">
                <video
                  ref={localCameraRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-[10px] font-medium">
                  You
                </div>
              </div>
            )}

            {/* Remote Mini Cam */}
            {remoteStream && (
              <div className="w-32 md:w-full h-32 md:h-48 rounded-xl overflow-hidden relative border border-white/10 shrink-0">
                <video
                  ref={remoteCameraRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-md text-[10px] font-medium">
                  Partner
                </div>
              </div>
            )}
          </div>
        )}

        {/* Watchlist Header */}
        <div className="p-4 border-b border-white/5 shrink-0">
          <h2 className="font-semibold mb-3">Our Watchlist</h2>
          <form onSubmit={handleAdd} className="flex gap-2">
            <div className="flex-1 flex bg-zinc-900 rounded-xl overflow-hidden border border-white/10 focus-within:border-accent">
              <button
                type="button"
                onClick={() => setNewType(p => p === 'movie' ? 'show' : 'movie')}
                className="px-3 py-2 bg-zinc-800 text-text-muted hover:text-white transition-colors flex items-center justify-center border-r border-white/10"
                title={`Toggle type (Current: ${newType})`}
              >
                {newType === 'movie' ? <Clapperboard size={14} /> : <Tv size={14} />}
              </button>
              <input
                type="text"
                placeholder="Add movie or show..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center disabled:opacity-50 transition-opacity shrink-0"
            >
              <Plus size={18} />
            </button>
          </form>
        </div>

        {/* Watchlist Items Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AnimatePresence initial={false}>
              {movies.length === 0 ? (
                <p className="col-span-full text-center text-white/40 text-sm mt-8">List is empty. Add a movie to watch!</p>
              ) : (
                movies.map((movie) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`group relative rounded-xl overflow-hidden bg-zinc-900 border transition-all aspect-[2/3] shadow-md ${movie.is_watched ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-accent hover:shadow-accent/20'
                      }`}
                  >
                    {/* Poster Image */}
                    {movie.poster_url ? (
                      <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/20 bg-zinc-900">
                        {movie.type === 'movie' ? <Clapperboard size={24} /> : <Tv size={24} />}
                      </div>
                    )}

                    {/* Gradient Overlay for Title */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-2 pointer-events-none">
                      <p className={`text-xs font-medium leading-tight line-clamp-2 ${movie.is_watched ? 'text-white/60 line-through' : 'text-white/90'}`}>
                        {movie.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {movie.type === 'movie' ? <Clapperboard size={8} className="text-accent" /> : <Tv size={8} className="text-pink" />}
                        <span className="text-[9px] text-white/60 uppercase tracking-wider font-bold">
                          {movie.type}
                        </span>
                      </div>
                    </div>

                    {/* Actions Overlay (Top Left & Right) */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleWatched(movie.id, !movie.is_watched)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md border shadow-sm transition-colors ${movie.is_watched
                            ? 'border-success bg-success/80 text-white'
                            : 'border-white/40 bg-black/40 text-white/60 hover:bg-black/80 hover:text-white hover:border-white'
                          }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </button>

                      <button
                        onClick={() => deleteMovie(movie.id)}
                        className="w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md bg-black/40 border border-white/40 text-white/60 hover:bg-error hover:text-white hover:border-error shadow-sm transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
