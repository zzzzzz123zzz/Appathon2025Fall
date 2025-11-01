"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Patient, JournalEntry } from "@/lib/types";

type WeekData = {
  weekLabel: string;
  entries: any[];
  startDate: Date;
};

export default function WeekReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const weekStart = searchParams.get("weekStart");

  const [patient, setPatient] = useState<Patient | null>(null);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [weekTab, setWeekTab] = useState<"entries" | "analytics" | "mood" | "suggestions">("entries");
  const [weekSearchQuery, setWeekSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeekData();
  }, [patientId, weekStart]);

  const loadWeekData = async () => {
    if (!patientId || !weekStart) {
      router.push("/dashboard");
      return;
    }

    try {
      // Load patient data
      const patientDoc = await getDoc(doc(db, "users", patientId));
      if (patientDoc.exists()) {
        setPatient({ id: patientDoc.id, ...patientDoc.data() } as Patient);
      }

      // Load entries for this week
      const allEntries: any[] = [];

      // Fetch diary entries
      try {
        const diaryEntriesRef = collection(db, "users", patientId, "diaryEntries");
        const diaryEntriesSnapshot = await getDocs(diaryEntriesRef);
        diaryEntriesSnapshot.forEach((doc) => {
          allEntries.push({ id: doc.id, ...doc.data(), entryType: "diary" });
        });
      } catch (error) {
        console.log("No diary entries found");
      }

      // Fetch notes
      try {
        const notesRef = collection(db, "users", patientId, "notes");
        const notesSnapshot = await getDocs(notesRef);
        notesSnapshot.forEach((doc) => {
          allEntries.push({ id: doc.id, ...doc.data(), entryType: "note" });
        });
      } catch (error) {
        console.log("No notes found");
      }

      // Filter entries for this week
      const weekStartDate = new Date(weekStart);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 7);

      const weekEntries = allEntries.filter((entry) => {
        const entryDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt);
        return entryDate >= weekStartDate && entryDate < weekEndDate;
      });

      // Sort by date
      weekEntries.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });

      const endOfWeek = new Date(weekStartDate);
      endOfWeek.setDate(weekStartDate.getDate() + 6);
      const weekLabel = `${weekStartDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${endOfWeek.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;

      setWeekData({
        weekLabel,
        entries: weekEntries,
        startDate: weekStartDate,
      });
    } catch (error) {
      console.error("Error loading week data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return "Recent";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWeekAnalytics = (entries: any[]) => {
    const symptoms = new Map<string, number>();
    const medications = new Map<string, number>();
    const moodScores: number[] = [];
    const emotions = new Map<string, number>();

    entries.forEach((entry) => {
      if (entry.entryType === "diary" && entry.extractedData) {
        entry.extractedData.symptoms?.forEach((symptom: any) => {
          const count = symptoms.get(symptom.name) || 0;
          symptoms.set(symptom.name, count + 1);
        });

        entry.extractedData.medications?.forEach((med: any) => {
          const count = medications.get(med.name) || 0;
          medications.set(med.name, count + 1);
        });

        if (entry.extractedData.moods?.score) {
          moodScores.push(entry.extractedData.moods.score);
        }

        entry.extractedData.moods?.emotions?.forEach((emotion: string) => {
          const count = emotions.get(emotion) || 0;
          emotions.set(emotion, count + 1);
        });
      }
    });

    const avgMood =
      moodScores.length > 0
        ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1)
        : "N/A";

    return {
      totalEntries: entries.length,
      avgMood,
      moodScores,
      topSymptoms: Array.from(symptoms.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topMedications: Array.from(medications.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topEmotions: Array.from(emotions.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c1a57d] mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading week review...</p>
        </div>
      </div>
    );
  }

  if (!weekData || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-gray-500">Week data not found</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] text-white rounded-xl"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const analytics = getWeekAnalytics(weekData.entries);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
      {/* Sticky Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200">
        <div className="px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-semibold text-gray-800 mb-1 flex items-center gap-3">
              📅 {weekData.weekLabel}
            </h2>
            <p className="text-base text-gray-500">{patient.name}'s Weekly Summary</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setWeekTab("entries")}
              className={`px-5 py-3 font-medium transition-all duration-200 relative ${
                weekTab === "entries" ? "text-[#c1a57d]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📝 Entries ({weekData.entries.length})
              {weekTab === "entries" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d]"></div>
              )}
            </button>
            <button
              onClick={() => setWeekTab("analytics")}
              className={`px-5 py-3 font-medium transition-all duration-200 relative ${
                weekTab === "analytics" ? "text-[#c1a57d]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📊 Analytics
              {weekTab === "analytics" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d]"></div>
              )}
            </button>
            <button
              onClick={() => setWeekTab("mood")}
              className={`px-5 py-3 font-medium transition-all duration-200 relative ${
                weekTab === "mood" ? "text-[#c1a57d]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              😊 Mood Trends
              {weekTab === "mood" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d]"></div>
              )}
            </button>
            <button
              onClick={() => setWeekTab("suggestions")}
              className={`px-5 py-3 font-medium transition-all duration-200 relative ${
                weekTab === "suggestions" ? "text-[#c1a57d]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              💡 Suggestions
              {weekTab === "suggestions" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d]"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {weekTab === "entries" && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Search Box */}
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search entries..."
                value={weekSearchQuery}
                onChange={(e) => setWeekSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c1a57d]/50 focus:border-[#c1a57d] transition-all duration-200 shadow-sm"
              />
            </div>

            {/* Entries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekData.entries
                .filter((entry) => {
                  if (!weekSearchQuery) return true;
                  const searchLower = weekSearchQuery.toLowerCase();
                  const content =
                    entry.entryType === "diary" && entry.summary
                      ? entry.summary
                      : entry.entryType === "note" && entry.content
                      ? entry.content
                      : "";
                  return content?.toLowerCase().includes(searchLower);
                })
                .map((entry) => {
                  const moodEmoji =
                    entry.entryType === "diary" && entry.extractedData?.moods?.score
                      ? entry.extractedData.moods.score >= 8
                        ? "😊"
                        : entry.extractedData.moods.score >= 6
                        ? "😐"
                        : entry.extractedData.moods.score >= 4
                        ? "😔"
                        : "😢"
                      : "📝";

                  return (
                    <div
                      key={entry.id}
                      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{moodEmoji}</span>
                          <div>
                            <p className="text-xs font-medium text-gray-500">{formatDateTime(entry.createdAt)}</p>
                            {entry.entryType === "diary" && entry.extractedData?.moods?.overall && (
                              <p className="text-sm font-semibold text-[#c1a57d]">{entry.extractedData.moods.overall}</p>
                            )}
                          </div>
                        </div>
                        {entry.entryType === "diary" && entry.extractedData?.moods?.score && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-[#c1a57d]/10 to-[#b39a6d]/10 text-[#c1a57d] text-sm font-semibold rounded-full">
                            {entry.extractedData.moods.score}/10
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <p className="text-gray-700 leading-relaxed text-sm mb-4 line-clamp-3">
                        {entry.entryType === "diary" && entry.summary
                          ? entry.summary
                          : entry.entryType === "note" && entry.content
                          ? entry.content
                          : ""}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {entry.entryType === "diary" && entry.extractedData && (
                          <>
                            {entry.extractedData?.symptoms?.slice(0, 2).map((symptom: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg flex items-center gap-1"
                              >
                                🩺 {symptom.name}
                              </span>
                            ))}
                            {entry.extractedData?.medications?.slice(0, 2).map((med: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg flex items-center gap-1"
                              >
                                💊 {med.name}
                              </span>
                            ))}
                            {entry.extractedData?.moods?.emotions?.slice(0, 2).map((emotion: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg flex items-center gap-1"
                              >
                                💭 {emotion}
                              </span>
                            ))}
                            {(entry.extractedData?.symptoms && entry.extractedData.symptoms.length > 2) ||
                            (entry.extractedData?.medications && entry.extractedData.medications.length > 2) ||
                            (entry.extractedData?.moods?.emotions && entry.extractedData.moods.emotions.length > 2) ? (
                              <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg">
                                +more
                              </span>
                            ) : null}
                          </>
                        )}
                        {entry.entryType === "note" && (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                            Manual Entry
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* No Results */}
            {weekSearchQuery &&
              weekData.entries.filter((entry) => {
                const searchLower = weekSearchQuery.toLowerCase();
                const content =
                  entry.entryType === "diary" && entry.summary
                    ? entry.summary
                    : entry.entryType === "note" && entry.content
                    ? entry.content
                    : "";
                return content?.toLowerCase().includes(searchLower);
              }).length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No entries found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your search</p>
                </div>
              )}
          </div>
        )}

        {weekTab === "analytics" && (
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                <p className="text-sm font-medium text-gray-500 mb-3">Total Entries</p>
                <p className="text-5xl font-bold bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] bg-clip-text text-transparent">
                  {analytics.totalEntries}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                <p className="text-sm font-medium text-gray-500 mb-3">Average Mood</p>
                <p className="text-5xl font-bold bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] bg-clip-text text-transparent">
                  {analytics.avgMood}/10
                </p>
              </div>
            </div>

            {analytics.topSymptoms.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Most Frequent Symptoms</h3>
                <div className="space-y-4">
                  {analytics.topSymptoms.map(([symptom, count], index) => (
                    <div
                      key={symptom}
                      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex justify-between items-center"
                    >
                      <span className="font-medium text-gray-800 capitalize text-lg">{symptom}</span>
                      <span className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white text-sm font-bold rounded-full shadow-sm">
                        {count} times
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.topMedications.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Medications Mentioned</h3>
                <div className="space-y-4">
                  {analytics.topMedications.map(([med, count], index) => (
                    <div
                      key={med}
                      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex justify-between items-center"
                    >
                      <span className="font-medium text-gray-800 text-lg">{med}</span>
                      <span className="px-4 py-2 bg-gradient-to-r from-green-400 to-green-500 text-white text-sm font-bold rounded-full shadow-sm">
                        {count} times
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {weekTab === "mood" && (
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
              <p className="text-sm font-medium text-gray-500 mb-4">Average Mood Score</p>
              <p className="text-7xl font-bold bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] bg-clip-text text-transparent mb-4">
                {analytics.avgMood}
              </p>
              <p className="text-base text-gray-500">{weekData.entries.length} entries recorded this week</p>
            </div>

            {analytics.topEmotions.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Most Common Emotions</h3>
                <div className="grid grid-cols-2 gap-5">
                  {analytics.topEmotions.map(([emotion, count]) => (
                    <div key={emotion} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                      <p className="text-2xl font-bold text-[#c1a57d] capitalize mb-2">{emotion}</p>
                      <p className="text-base text-gray-500">{count} times this week</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analytics.moodScores.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Daily Mood Scores</h3>
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <div className="flex items-end gap-3 h-64">
                    {analytics.moodScores.map((score, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end">
                        <div
                          className="w-full bg-gradient-to-t from-[#c1a57d] to-[#d4c3a8] rounded-t-lg transition-all duration-500 hover:opacity-80"
                          style={{ height: `${(score / 10) * 100}%` }}
                        ></div>
                        <span className="text-sm text-gray-500 mt-3 font-medium">{score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {weekTab === "suggestions" && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-[#c1a57d] to-[#a89267] bg-clip-text text-transparent mb-3">
                💡 AI-Powered Suggestions
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Based on this week's entries, here are some recommendations:
              </p>
            </div>

            {parseFloat(analytics.avgMood) < 5 && (
              <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Low Mood Alert</h4>
                    <p className="text-base text-gray-600 leading-relaxed">
                      The average mood score this week is {analytics.avgMood}/10. Consider scheduling a follow-up
                      appointment to discuss mental health support options.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analytics.topSymptoms.length > 2 && (
              <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-2xl">🏥</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Multiple Symptoms Reported</h4>
                    <p className="text-base text-gray-600 leading-relaxed">
                      Patient reported {analytics.topSymptoms.length} different symptoms this week. Review symptom
                      patterns and consider diagnostic evaluation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analytics.topMedications.length > 0 && (
              <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-2xl">💊</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Medication Tracking</h4>
                    <p className="text-base text-gray-600 leading-relaxed">
                      Patient mentioned {analytics.topMedications.length} medication(s) this week. Verify medication
                      adherence and check for any side effects.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {weekData.entries.length < 2 && (
              <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Low Engagement</h4>
                    <p className="text-base text-gray-600 leading-relaxed">
                      Only {weekData.entries.length} entry this week. Encourage patient to journal more regularly for
                      better health tracking.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {parseFloat(analytics.avgMood) >= 7 && weekData.entries.length >= 5 && (
              <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Positive Progress</h4>
                    <p className="text-base text-gray-600 leading-relaxed">
                      Excellent! High mood score ({analytics.avgMood}/10) and consistent journaling. Continue current
                      treatment plan.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
