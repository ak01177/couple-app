"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Plus, Trash2, Heart, ExternalLink, Play, Disc } from "lucide-react";
import { useSongs, useAddSong, useDeleteSong, useToggleFeaturedSong } from "@/hooks/useSupabase";
import { useAuthStore } from "@/store";
import { FloatingParticles } from "@/components/ui";
import { getSpotifyEmbedUrl } from "@/lib/spotify";

export default function MusicPage() {
  const { user } = useAuthStore();
  const { songs, isLoading } = useSongs();
  const addSong = useAddSong();
  const deleteSong = useDeleteSong();
  const toggleFeatured = useToggleFeaturedSong();

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newLink, setNewLink] = useState("");

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim()) return;
    
    await addSong({
      title: newTitle.trim(),
      artist: newArtist.trim(),
      link_url: newLink.trim() || null,
      album_art_url: null, // Could add a way to fetch this later
    });
    
    setNewTitle("");
    setNewArtist("");
    setNewLink("");
    setIsAdding(false);
  };

  const featuredSong = songs.find(s => s.is_featured);
  const playlist = songs.filter(s => !s.is_featured);

  return (
    <div className="h-full overflow-y-auto bg-bg-deep scroll-smooth pb-24">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-success/5 blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
      </div>
      
      <FloatingParticles count={6} />

      <div className="relative z-10 px-5 pt-12 max-w-lg mx-auto min-h-full flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Our Music</h1>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsAdding(!isAdding)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isAdding ? "bg-bg-elevated text-text-primary" : "bg-success text-white shadow-glow-success"
              }`}
            >
              <Plus size={20} className={isAdding ? "rotate-45 transition-transform" : "transition-transform"} />
            </motion.button>
          </div>
          <p className="text-text-muted text-sm">The soundtrack to our story 🎵</p>
        </motion.div>

        {/* Add Song Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              onSubmit={handleAddSong}
              className="overflow-hidden"
            >
              <div className="bg-bg-surface border border-success/30 p-5 rounded-2xl shadow-soft space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1.5 block">Song Title</label>
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Perfect"
                    className="w-full bg-bg-elevated border border-border/50 rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-success/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1.5 block">Artist</label>
                  <input
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    placeholder="e.g. Ed Sheeran"
                    className="w-full bg-bg-elevated border border-border/50 rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-success/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1.5 block">Link (Spotify, Apple Music, etc.)</label>
                  <input
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="Optional link..."
                    className="w-full bg-bg-elevated border border-border/50 rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:border-success/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newArtist.trim()}
                  className="w-full py-3 bg-success text-white rounded-xl font-medium text-sm disabled:opacity-50 mt-2"
                >
                  Add to Playlist
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-success border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8 flex-1">
            {/* Featured Song / "Our Song" */}
            {featuredSong && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-gradient-to-br from-success/20 to-success/5 border border-success/30 rounded-3xl p-1 overflow-hidden"
              >
                <div className="absolute inset-0 bg-bg-surface/40 backdrop-blur-sm -z-10" />
                <div className="absolute -right-10 -top-10 text-success/10 z-0">
                  <Disc size={150} className="animate-spin-slow" />
                </div>
                
                <div className="relative z-10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-widest text-success font-bold flex items-center gap-1.5">
                      <Heart size={12} className="fill-success" /> Our Song
                    </span>
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    {(() => {
                      const spotifyUrl = getSpotifyEmbedUrl(featuredSong.link_url);
                      if (spotifyUrl) {
                        return (
                          <div className="w-full mt-2">
                            <iframe 
                              src={spotifyUrl} 
                              width="100%" 
                              height="152" 
                              frameBorder="0" 
                              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                              loading="lazy"
                              className="rounded-xl shadow-lg"
                            ></iframe>
                          </div>
                        );
                      }
                      
                      return (
                        <>
                          <div className="w-20 h-20 rounded-2xl bg-bg-elevated shadow-lg flex items-center justify-center shrink-0 border border-border/50 overflow-hidden relative group">
                            <Music size={32} className="text-text-muted" />
                            {featuredSong.link_url && (
                              <a 
                                href={featuredSong.link_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Play size={24} className="text-white fill-white" />
                              </a>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-text-primary truncate">{featuredSong.title}</h3>
                            <p className="text-text-secondary truncate mt-1">{featuredSong.artist}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  <button
                    onClick={() => toggleFeatured(featuredSong.id, false)}
                    className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-2"
                  >
                    <Heart size={16} className="fill-text-muted" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Playlist */}
            <div>
              <h2 className="text-[11px] uppercase tracking-widest text-text-muted font-bold mb-4 px-1">
                Playlist ({playlist.length})
              </h2>
              
              {playlist.length === 0 && !featuredSong ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-bg-surface flex items-center justify-center mx-auto mb-4 border border-border/50">
                    <Music size={24} className="text-text-muted" />
                  </div>
                  <p className="text-text-secondary text-sm">Your playlist is empty.</p>
                  <p className="text-text-muted text-xs mt-1">Add some songs that remind you of each other!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {playlist.map((song, i) => (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: Math.min(i * 0.05, 0.3) }}
                        className="group flex items-center gap-3 p-3 rounded-2xl bg-bg-surface hover:bg-bg-elevated transition-colors border border-border/40"
                      >
                        {(() => {
                          const spotifyUrl = getSpotifyEmbedUrl(song.link_url);
                          if (spotifyUrl) {
                            return (
                              <div className="flex-1 w-full my-1">
                                <iframe 
                                  src={spotifyUrl} 
                                  width="100%" 
                                  height="80" 
                                  frameBorder="0" 
                                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                  loading="lazy"
                                  className="rounded-lg"
                                ></iframe>
                              </div>
                            );
                          }
                          
                          return (
                            <>
                              <div className="w-12 h-12 rounded-xl bg-bg-elevated flex items-center justify-center shrink-0 text-text-muted">
                                <Music size={20} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-text-primary truncate">{song.title}</h4>
                                <p className="text-xs text-text-secondary truncate mt-0.5">{song.artist}</p>
                              </div>
                            </>
                          );
                        })()}
                        
                        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center self-stretch">
                          {!getSpotifyEmbedUrl(song.link_url) && song.link_url && (
                            <a 
                              href={song.link_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-2 text-text-muted hover:text-success"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <button
                            onClick={() => toggleFeatured(song.id, true)}
                            className="p-2 text-text-muted hover:text-pink"
                            title="Set as Our Song"
                          >
                            <Heart size={16} />
                          </button>
                          {user && song.added_by === user.id && (
                            <button
                              onClick={() => deleteSong(song.id)}
                              className="p-2 text-text-muted hover:text-error"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
