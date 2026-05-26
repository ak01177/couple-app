"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useCalendarEvents } from "@/hooks/useSupabase";
import { CalendarEventType } from "@/types";
import { IMPORTANT_DATES } from "@/config/dates";
import { AddEventModal } from "@/components/ui/AddEventModal";
import { FloatingParticles } from "@/components/ui";

const EVENT_COLORS: Record<CalendarEventType, string> = {
  date: "bg-pink",
  exam: "bg-info",
  anniversary: "bg-accent",
  trip: "bg-success",
  other: "bg-text-muted",
};

const EVENT_ICONS: Record<CalendarEventType, string> = {
  date: "🍷",
  exam: "📝",
  anniversary: "💝",
  trip: "✈️",
  other: "📅",
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { events, isLoading } = useCalendarEvents();

  // Calendar Math
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  // Merge database events and hardcoded config dates
  const allEventsForDay = useCallback((date: Date) => {
    // 1. Database events
    const dayEvents = events.filter(e => {
      const eStart = new Date(e.start_date);
      const eEnd = new Date(e.end_date);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const targetEnd = new Date(date);
      targetEnd.setHours(23, 59, 59, 999);
      return eStart <= targetEnd && eEnd >= targetDate;
    });

    // 2. Hardcoded config dates (IMPORTANT_DATES)
    const configEvents = IMPORTANT_DATES.filter(event => {
      const eventDate = new Date(event.date);

      if (event.type === "anniversary" || event.type === "birthday") {
        // Recurring: check if month and day match
        return eventDate.getMonth() === date.getMonth() &&
          eventDate.getDate() === date.getDate();
      } else {
        // One-time: check if exact date matches (year, month, day)
        return eventDate.getFullYear() === date.getFullYear() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getDate() === date.getDate();
      }
    }).map(event => {
      // Map config event type to CalendarEventType
      let type: CalendarEventType = "other";
      if (event.type === "anniversary") type = "anniversary";
      if (event.type === "birthday") type = "anniversary";
      if (event.type === "milestone") type = "trip";

      return {
        id: `config-${event.title}-${event.date}-${date.getFullYear()}`,
        title: event.title,
        type: type,
        icon: event.icon,
        start_date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).toISOString(),
        end_date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString(),
        isConfig: true,
      };
    });

    return [...dayEvents, ...configEvents];
  }, [events]);

  // Get events for a specific day
  const getEventsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return allEventsForDay(date);
  };

  const selectedDayEvents = useMemo(() => {
    return allEventsForDay(selectedDate);
  }, [selectedDate, allEventsForDay]);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="h-full overflow-y-auto bg-bg-deep relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-accent/3 blur-3xl" />
      </div>
      <FloatingParticles count={5} />

      <div className="relative z-10 px-4 pt-12 pb-24 max-w-lg mx-auto min-h-full flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Calendar</h1>
            <p className="text-sm text-text-muted mt-0.5">Shared plans & memories</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-10 h-10 rounded-xl bg-accent hover:bg-accent-hover text-white flex items-center justify-center shadow-lg shadow-accent/20 transition-all"
          >
            <Plus size={20} />
          </button>
        </motion.div>

        {/* Calendar Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-surface/80 backdrop-blur-xl border border-border/60 rounded-3xl p-5 shadow-soft mb-6 shrink-0"
        >
          {/* Month Navigator */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-text-primary">
              {currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-full hover:bg-bg-elevated text-text-muted transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-full hover:bg-bg-elevated text-text-muted transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
              <div key={day} className="text-center text-xs font-medium text-text-muted py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {blanks.map(b => (
              <div key={`blank-${b}`} className="aspect-square" />
            ))}
            {days.map(day => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              const dayEvents = getEventsForDay(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square relative flex flex-col items-center justify-center rounded-xl transition-all ${isSelected
                      ? "bg-accent text-white font-bold shadow-md shadow-accent/20"
                      : isToday
                        ? "bg-bg-elevated text-accent font-bold border border-accent/20"
                        : "hover:bg-bg-hover text-text-secondary"
                    }`}
                >
                  <span className="text-sm">{day}</span>

                  {/* Event Dots */}
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1.5 flex gap-0.5 justify-center w-full">
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : EVENT_COLORS[e.type as CalendarEventType]}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Selected Day Events */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4 px-2">
            {isSameDay(selectedDate, new Date())
              ? "Today's Events"
              : selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </h3>

          <div className="space-y-3 flex-1 pb-10">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-text-muted">Loading...</div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-bg-surface rounded-full flex items-center justify-center mx-auto mb-3 border border-border/40">
                  <CalendarIcon size={20} className="text-text-muted" />
                </div>
                <p className="text-sm text-text-secondary">No events scheduled.</p>
              </div>
            ) : (
              selectedDayEvents.map(event => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={event.id}
                  className="bg-bg-surface/60 border border-border/40 rounded-2xl p-4 flex gap-4 items-start shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-bg-deep ${EVENT_COLORS[event.type as CalendarEventType].replace('bg-', 'text-')}`}>
                    <span className="text-xl">{('icon' in event ? (event as any).icon : undefined) || EVENT_ICONS[event.type as CalendarEventType]}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary text-sm">{event.title}</h4>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Clock size={12} />
                        <span>
                          {('isConfig' in event && (event as any).isConfig) ? "All Day" : (
                            `${new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          )}
                        </span>
                      </div>
                      <div className="text-[10px] uppercase font-bold tracking-wider opacity-70" style={{ color: `var(--${EVENT_COLORS[event.type as CalendarEventType].replace('bg-', '')})` }}>
                        {event.type}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialDate={selectedDate}
      />
    </div>
  );
}
