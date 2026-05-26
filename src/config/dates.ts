export type ImportantDate = {
  title: string;
  date: string; // YYYY-MM-DD
  type: "anniversary" | "birthday" | "milestone" | "other";
  icon?: string; // Emoji
};

// ============================================
// YOUR IMPORTANT DATES CONFIGURATION
// ============================================
// Add all your important dates here! 
// They will automatically appear on the home dashboard.
export const IMPORTANT_DATES: ImportantDate[] = [
  {
    title: "Our Anniversary",
    date: "2021-01-06",
    type: "anniversary",
    icon: "💝",
  },
  {
    title: "Aryan's Birthday",
    date: "2007-01-02",
    type: "birthday",
    icon: "🎂",
  },
  {
    title: "Shraddha's Birthday",
    date: "2006-08-11",
    type: "birthday",
    icon: "🎉",
  },
  {
    title: "Our First Trip",
    date: "2024-11-08",
    type: "milestone",
    icon: "✈️",
  }
];

// Helper to get the next upcoming date from today
export function getUpcomingDate(): { event: ImportantDate; daysLeft: number } | null {
  if (IMPORTANT_DATES.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let upcoming = null;
  let minDaysLeft = Infinity;

  for (const event of IMPORTANT_DATES) {
    const eventDate = new Date(event.date);

    // Set the event to the current year to see if it hasn't passed yet
    const nextOccurrence = new Date(
      today.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate()
    );

    // If it has already passed this year, the next one is next year
    if (nextOccurrence < today) {
      nextOccurrence.setFullYear(today.getFullYear() + 1);
    }

    const daysLeft = Math.ceil((nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < minDaysLeft) {
      minDaysLeft = daysLeft;
      upcoming = event;
    }
  }

  return upcoming ? { event: upcoming, daysLeft: minDaysLeft } : null;
}
