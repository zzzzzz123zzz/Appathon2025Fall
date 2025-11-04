"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Patient, JournalEntry } from "@/lib/types";

type WeekData = {
  weekLabel: string;
  entries: any[];
  startDate: Date;
};

function WeekReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");
  const weekStart = searchParams.get("weekStart");

  const [patient, setPatient] = useState<Patient | null>(null);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [weekTab, setWeekTab] = useState<"entries" | "analytics" | "mood" | "suggestions">("entries");
  const [weekSearchQuery, setWeekSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

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
    let crisisDetected = false;
    const crisisKeywords = ["suicide", "suicidal", "kill myself", "end my life", "want to die", "no reason to live"];

    entries.forEach((entry) => {
      // Check for crisis indicators
      const content = entry.entryType === "diary" && entry.summary
        ? entry.summary.toLowerCase()
        : entry.entryType === "note" && entry.content
        ? entry.content.toLowerCase()
        : "";

      if (crisisKeywords.some(keyword => content.includes(keyword))) {
        crisisDetected = true;
      }

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
      crisisDetected,
    };
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return { bg: "bg-green-100", text: "text-green-800", label: "Excellent", emoji: "😊" };
    if (score >= 6) return { bg: "bg-blue-100", text: "text-blue-800", label: "Good", emoji: "😐" };
    if (score >= 4) return { bg: "bg-yellow-100", text: "text-yellow-800", label: "Fair", emoji: "😔" };
    if (score >= 2) return { bg: "bg-orange-100", text: "text-orange-800", label: "Poor", emoji: "😟" };
    return { bg: "bg-red-100", text: "text-red-800", label: "Critical", emoji: "😢" };
  };

  const exportWeeklySummary = () => {
    // Prefer PDF export (visually styled). This uses html2canvas + jsPDF which
    // must be installed in the doctor-portal project: `npm install html2canvas jspdf`
    exportWeeklySummaryPDF().catch((err) => {
      console.error('PDF export failed, falling back to text export:', err);
      // Fallback: trigger simple text export if PDF fails
      const analytics = getWeekAnalytics(weekData?.entries || []);
      const avgMoodNum = parseFloat(analytics.avgMood);
      const moodInfo = !isNaN(avgMoodNum) ? getMoodColor(avgMoodNum) : null;

      const summaryText = `THEO HEALTH - WEEKLY SUMMARY\n${weekData?.weekLabel}\nPatient: ${patient?.name}\n\nOVERVIEW\nTotal Entries: ${analytics.totalEntries}\nAverage Mood: ${analytics.avgMood}/10 ${moodInfo ? `(${moodInfo.label})` : ''}\n`;

      const blob = new Blob([summaryText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${patient?.name.replace(/\s+/g, '_')}_Week_${weekData?.weekLabel.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  // Generate a styled PDF by rendering a temporary DOM node with the summary
  const exportWeeklySummaryPDF = async () => {
    if (!weekData || !patient) throw new Error('Week data or patient missing');

    // dynamic imports so the page doesn't require libraries until used
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default || html2canvasModule;
    const { jsPDF } = await import('jspdf');

    const analytics = getWeekAnalytics(weekData.entries || []);
    const avgMoodNum = parseFloat(analytics.avgMood);
    const moodInfo = !isNaN(avgMoodNum) ? getMoodColor(avgMoodNum) : null;

    // Build HTML content for the PDF — keep it self-contained with inline styles
    const headerColor = '#c1a57d';
    const subColor = '#b39a6d';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#222; padding:24px; width:800px; box-sizing:border-box; background: #fff;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h1 style="margin:0; font-size:28px; color:${headerColor};">THEO HEALTH</h1>
            <div style="font-size:14px; color:#444; margin-top:6px;">Weekly Summary — ${weekData.weekLabel}</div>
            <div style="font-size:13px; color:#666; margin-top:4px;">Patient: <strong>${patient.name}</strong></div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px; color:#666;">Created: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <hr style="border:none; height:1px; background:#eee; margin:18px 0;" />

        <section style="display:flex; gap:24px;">
          <div style="flex:1; min-width:0;">
            <h2 style="margin:0 0 8px 0; color:${subColor};">Overview</h2>
            <p style="margin:0 0 12px 0; color:#333;">Total Entries: <strong>${analytics.totalEntries}</strong><br/>Average Mood: <strong>${analytics.avgMood}/10</strong>${moodInfo ? ` — ${moodInfo.label}` : ''}</p>

            ${analytics.topSymptoms.length > 0 ? `
              <h3 style="margin-top:12px; color:${headerColor}; font-size:15px">Top Symptoms</h3>
              <ul style="margin:6px 0 12px 18px; color:#333;">
                ${analytics.topSymptoms.map(([s,c])=>`<li style="margin-bottom:4px">${s} — ${c} time${c>1?'s':''}</li>`).join('')}
              </ul>
            ` : ''}

            ${analytics.topMedications.length > 0 ? `
              <h3 style="margin-top:12px; color:${headerColor}; font-size:15px">Medications Mentioned</h3>
              <ul style="margin:6px 0 12px 18px; color:#333;">
                ${analytics.topMedications.map(([m,c])=>`<li style="margin-bottom:4px">${m} — ${c} time${c>1?'s':''}</li>`).join('')}
              </ul>
            ` : ''}
          </div>

          <div style="width:260px;">
            <div style="background:#f7f7f7; padding:12px; border-radius:8px;">
              <div style="font-size:12px; color:#666;">Engagement</div>
              <div style="font-size:20px; font-weight:700; color:#222; margin-top:6px">${Math.round((analytics.totalEntries / 7) * 10) / 10}/day</div>
            </div>

            <div style="margin-top:12px; background:#f7f7f7; padding:12px; border-radius:8px;">
              <div style="font-size:12px; color:#666;">Mood</div>
              <div style="font-size:20px; font-weight:700; color:${moodInfo?.text ? '#222' : '#222'}; margin-top:6px">${analytics.avgMood}/10</div>
              ${moodInfo ? `<div style="font-size:12px; color:#666; margin-top:6px">${moodInfo.label} ${moodInfo.emoji || ''}</div>` : ''}
            </div>
          </div>
        </section>

        ${analytics.topEmotions.length > 0 ? `
          <section style="margin-top:18px;">
            <h3 style="color:${headerColor}; margin-bottom:8px">Emotions</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap">${analytics.topEmotions.map(([e,c])=>`<span style="background:#f0f0f0; padding:6px 10px; border-radius:999px; font-size:12px; color:#333">${e} (${c})</span>`).join('')}</div>
          </section>
        ` : ''}

        ${analytics.crisisDetected ? `
          <section style="margin-top:18px; background:linear-gradient(90deg,#ffeded,#fff1f1); padding:12px; border-radius:8px; border:1px solid #ffd5d5;">
            <strong style="color:#b00020">CRISIS INDICATORS DETECTED</strong>
            <div style="font-size:13px; color:#333; margin-top:6px">Patient expressed suicidal ideation or severe distress. Immediate intervention recommended. See crisis resources in clinical recommendations.</div>
          </section>
        ` : ''}

        <section style="margin-top:18px;">
          <h3 style="color:${headerColor};">AI Recommendations</h3>
          <div style="font-size:13px; color:#333; line-height:1.5; margin-top:8px">
            ${generateClinicalRecommendationsHTML(analytics)}
          </div>
        </section>

      </div>
    `;

    // create temporary node
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.innerHTML = html;
    document.body.appendChild(container);

    // Render to canvas at higher scale for crispness
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });

    // Convert to image
    const imgData = canvas.toDataURL('image/png');

    // Create PDF
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions to fit page width
    const imgProps = { width: canvas.width, height: canvas.height };
    const imgWidth = pageWidth - 40; // add small margins
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let position = 20; // top margin

    // If image fits on one page
    if (imgHeight <= pageHeight - 40) {
      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
    } else {
      // Add first page
      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
      // Add additional pages by shifting the image up using negative y offsets
      let remainingHeight = imgHeight - (pageHeight - 40);
      let offsetY = pageHeight - 40;
      while (remainingHeight > 0) {
        pdf.addPage();
        // place same image shifted up
        pdf.addImage(imgData, 'PNG', 20, -offsetY, imgWidth, imgHeight);
        remainingHeight -= (pageHeight - 40);
        offsetY += (pageHeight - 40);
      }
    }

    const filename = `[WEEKLYSUMMARY]${patient?.name.replace(/\s+/g, '_')}_${weekData?.weekLabel.split(',')[0].split(' ')[0]}_${weekData?.weekLabel.split(',')[0].split(' ')[1]}_${weekData?.weekLabel.split(',')[1].trim()}.pdf`;

    pdf.save(filename);

    // cleanup
    document.body.removeChild(container);
  };

  // Helper to produce clinical recommendations HTML for PDF
  const generateClinicalRecommendationsHTML = (analytics: any) => {
    let html = '';
    if (analytics.crisisDetected) {
      html += `<div style="margin-bottom:8px"><strong style="color:#b00020">[ALERT] IMMEDIATE ACTION REQUIRED</strong><div>Patient has expressed suicidal ideation or severe psychological distress. Contact immediately and provide crisis intervention resources.</div></div>`;
    }

    if (parseFloat(analytics.avgMood) < 5 && !analytics.crisisDetected) {
      html += `<div style="margin-bottom:8px"><strong>[CLINICAL] Mood Score Below Baseline (${analytics.avgMood}/10)</strong><ul><li>Schedule follow-up clinical assessment within 1-2 weeks</li><li>Review current treatment plan effectiveness</li><li>Consider referral to mental health specialist if sustained decline</li></ul></div>`;
    }

    if (analytics.topSymptoms.length > 2) {
      html += `<div style="margin-bottom:8px"><strong>[CLINICAL] Multiple Symptoms Documented</strong><div>Top symptoms: ${analytics.topSymptoms.slice(0,3).map(([s]: [string, number])=>s).join(', ')}</div></div>`;
    }

    if (analytics.topMedications.length > 0) {
      html += `<div style="margin-bottom:8px"><strong>[MEDICATION] Medication References Noted</strong><div>Verify current medication list, assess adherence, and screen for adverse effects.</div></div>`;
    }

    if (weekData && weekData.entries.length < 2) {
      html += `<div style="margin-bottom:8px"><strong>[ENGAGEMENT] Limited Patient Engagement</strong><div>Discuss barriers to consistent journaling and consider simplified monitoring.</div></div>`;
    }

    if (weekData && parseFloat(analytics.avgMood) >= 7 && weekData.entries.length >= 5) {
      html += `<div style="margin-bottom:8px"><strong>[POSITIVE] Clinical Trajectory</strong><div>Continue current treatment and monitoring; reinforce engagement.</div></div>`;
    }

    return html || '<div>No specific recommendations.</div>';
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
      {/* Crisis Alert Banner */}
      {analytics.crisisDetected && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Crisis Indicators Detected</h3>
              <p className="text-sm text-red-100">
                This patient has expressed suicidal ideation or severe distress. Immediate intervention recommended.
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm">Crisis Resources:</p>
              <p className="text-sm">988 - Suicide & Crisis Lifeline</p>
              <p className="text-sm">Text HOME to 741741</p>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200">
        <div className="px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-semibold text-gray-800 mb-1">
              {weekData.weekLabel}
            </h2>
            <p className="text-base text-gray-500">{patient.name}&apos;s Weekly Summary</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportWeeklySummary}
              className="px-5 py-2.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] hover:from-[#b39a6d] hover:to-[#a89267] text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Summary
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>
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
              Entries ({weekData.entries.length})
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
              Analytics
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
              Mood Trends
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
              Suggestions
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
                  return (
                    <div
                      key={entry.id}
                      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-500 ease-out border border-gray-100 cursor-pointer group flex flex-col"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-800 mb-1">{formatDateTime(entry.createdAt)}</h3>
                          {entry.entryType === "diary" && entry.extractedData?.moods?.overall && (
                            <p className="text-sm text-gray-600 capitalize">{entry.extractedData.moods.overall}</p>
                          )}
                        </div>
                        {entry.entryType === "diary" && entry.extractedData?.moods?.score && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-[#c1a57d]/10 to-[#b39a6d]/10 text-[#c1a57d] text-sm font-semibold rounded-full">
                            {entry.extractedData.moods.score}/10
                          </span>
                        )}
                      </div>

                      {/* Content Preview */}
                      <p className="text-gray-700 leading-relaxed text-sm mb-4 line-clamp-3 flex-grow">
                        {entry.entryType === "diary" && entry.summary
                          ? entry.summary
                          : entry.entryType === "note" && entry.content
                          ? entry.content
                          : ""}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {entry.entryType === "diary" && entry.extractedData && (
                          <>
                            {entry.extractedData?.symptoms?.slice(0, 2).map((symptom: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-lg capitalize"
                              >
                                {symptom.name}
                              </span>
                            ))}
                            {entry.extractedData?.medications?.slice(0, 2).map((med: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg capitalize"
                              >
                                {med.name}
                              </span>
                            ))}
                            {entry.extractedData?.moods?.emotions?.slice(0, 2).map((emotion: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg capitalize"
                              >
                                {emotion}
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

                      {/* Click button - always at bottom */}
                      <button className="mt-auto pt-3 border-t border-gray-100 w-full text-center text-xs text-gray-400 group-hover:text-[#c1a57d] transition-colors duration-500 flex items-center justify-center gap-2">
                        <span>Click to view full entry</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Clinical Summary Header */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Summary</h3>
              <div className="grid grid-cols-4 gap-6">
                <div className="border-l-4 border-gray-400 pl-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Entries</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalEntries}</p>
                  <p className="text-xs text-gray-500 mt-1">{Math.round((analytics.totalEntries / 7) * 10) / 10}/day avg</p>
                </div>
                <div className={`border-l-4 pl-4 ${
                  !isNaN(parseFloat(analytics.avgMood))
                    ? parseFloat(analytics.avgMood) >= 7 ? 'border-green-500'
                      : parseFloat(analytics.avgMood) >= 5 ? 'border-yellow-500'
                      : 'border-red-500'
                    : 'border-gray-400'
                }`}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Mood Score</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.avgMood}<span className="text-base text-gray-500">/10</span></p>
                  <p className="text-xs text-gray-500 mt-1">{!isNaN(parseFloat(analytics.avgMood)) ? getMoodColor(parseFloat(analytics.avgMood)).label : 'N/A'}</p>
                </div>
                <div className={`border-l-4 pl-4 ${analytics.topSymptoms.length > 3 ? 'border-red-500' : analytics.topSymptoms.length > 0 ? 'border-yellow-500' : 'border-green-500'}`}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Symptoms</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.topSymptoms.length}</p>
                  <p className="text-xs text-gray-500 mt-1">distinct reported</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Medications</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.topMedications.length}</p>
                  <p className="text-xs text-gray-500 mt-1">referenced</p>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column: Symptoms & Medications */}
              <div className="space-y-6">
                {analytics.topSymptoms.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Symptom Frequency</h4>
                    <div className="space-y-2">
                      {analytics.topSymptoms.map(([symptom, count]) => (
                        <div key={symptom} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-700 capitalize font-medium">{symptom}</span>
                          <span className="text-sm font-semibold text-gray-900">{count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analytics.topMedications.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Medication References</h4>
                    <div className="space-y-2">
                      {analytics.topMedications.map(([med, count]) => (
                        <div key={med} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-700 font-medium">{med}</span>
                          <span className="text-sm font-semibold text-gray-900">{count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Mood Trends */}
              <div className="space-y-6">
                {analytics.moodScores.length > 0 && (() => {
                  // Calculate daily averages for the week
                  const weekStartDate = weekData.startDate;
                  const dailyMoods: { [key: number]: number[] } = {}; // key is day index (0-6)

                  // Group mood scores by day of week
                  weekData.entries.forEach((entry) => {
                    if (entry.entryType === 'diary' && entry.extractedData?.moods?.score) {
                      const entryDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date();
                      const daysDiff = Math.floor((entryDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));

                      if (daysDiff >= 0 && daysDiff < 7) {
                        if (!dailyMoods[daysDiff]) {
                          dailyMoods[daysDiff] = [];
                        }
                        dailyMoods[daysDiff].push(entry.extractedData.moods.score);
                      }
                    }
                  });

                  // Calculate averages for each day (0-6 for the week)
                  const dailyAverages = Array.from({ length: 7 }, (_, dayIndex) => {
                    const scores = dailyMoods[dayIndex];
                    if (scores && scores.length > 0) {
                      return scores.reduce((a, b) => a + b, 0) / scores.length;
                    }
                    return null;
                  });

                  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const weekStartDay = weekStartDate.getDay();

                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Weekly Mood Chart</h4>
                      <div className="flex gap-6">
                        {/* Y-axis */}
                        <div className="flex flex-col justify-between text-xs text-gray-500 font-medium py-2">
                          <span>10</span>
                          <span>8</span>
                          <span>6</span>
                          <span>4</span>
                          <span>2</span>
                          <span>0</span>
                        </div>

                        {/* Chart Area */}
                        <div className="flex-1">
                          <div className="relative h-48 border-l-2 border-b-2 border-gray-300">
                            {/* Horizontal grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                              {[10, 8, 6, 4, 2, 0].map((val) => (
                                <div key={val} className="border-t border-gray-100"></div>
                              ))}
                            </div>

                            {/* Bars */}
                            <div className="absolute inset-0 flex items-end gap-2 px-2 pb-2">
                              {dailyAverages.map((avgScore, dayIndex) => {
                                const actualDayIndex = (weekStartDay + dayIndex) % 7;
                                const dayName = days[actualDayIndex];

                                return (
                                  <div key={dayIndex} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                                    <div className="w-full flex items-end justify-center h-full">
                                      {avgScore !== null ? (
                                        <>
                                          {/* Tooltip */}
                                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                            {dayName}: {avgScore.toFixed(1)}/10
                                          </div>
                                          {/* Bar */}
                                          <div
                                            className={`w-full rounded-t-sm transition-all cursor-pointer ${
                                              avgScore >= 7 ? 'bg-green-200 hover:bg-green-300' : avgScore >= 5 ? 'bg-blue-200 hover:bg-blue-300' : avgScore >= 3 ? 'bg-yellow-200 hover:bg-yellow-300' : 'bg-red-200 hover:bg-red-300'
                                            }`}
                                            style={{ height: `${(avgScore / 10) * 100}%`, minHeight: '2px' }}
                                          ></div>
                                        </>
                                      ) : (
                                        <>
                                          {/* Tooltip for no data */}
                                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                            {dayName}: No data
                                          </div>
                                          {/* Empty bar */}
                                          <div className="w-full h-1 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer"></div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* X-axis labels */}
                          <div className="flex gap-2 mt-2 px-2">
                            {dailyAverages.map((_, dayIndex) => {
                              const actualDayIndex = (weekStartDay + dayIndex) % 7;
                              const dayName = days[actualDayIndex];

                              return (
                                <div key={dayIndex} className="flex-1 text-center">
                                  <span className="text-xs text-gray-600 font-medium">{dayName}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {analytics.topEmotions.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Emotional State</h4>
                    <div className="space-y-2">
                      {analytics.topEmotions.slice(0, 5).map(([emotion, count]) => (
                        <div key={emotion} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-700 capitalize font-medium">{emotion}</span>
                          <span className="text-sm font-semibold text-gray-900">{count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {weekTab === "mood" && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Mood Analysis Grid */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Average Score</p>
                <p className="text-4xl font-bold text-gray-900 mb-2">{analytics.avgMood}<span className="text-xl text-gray-500">/10</span></p>
                <p className="text-sm text-gray-600">{!isNaN(parseFloat(analytics.avgMood)) ? getMoodColor(parseFloat(analytics.avgMood)).label : 'N/A'}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Range</p>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {analytics.moodScores.length > 0 ? Math.min(...analytics.moodScores) : 0}-{analytics.moodScores.length > 0 ? Math.max(...analytics.moodScores) : 0}
                </p>
                <p className="text-sm text-gray-600">Min-Max</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Variability</p>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {analytics.moodScores.length > 0 ? Math.max(...analytics.moodScores) - Math.min(...analytics.moodScores) : 0}
                </p>
                <p className="text-sm text-gray-600">Point spread</p>
              </div>
            </div>

            {/* Mood Timeline */}
            {analytics.moodScores.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-6 uppercase tracking-wide">Weekly Mood Timeline</h4>
                <div className="space-y-3">
                  {analytics.moodScores.map((score, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 font-medium w-12">Entry {idx + 1}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 relative">
                        <div
                          className={`h-2 rounded-full ${
                            score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(score / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-12">{score}/10</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emotional Profile */}
            {analytics.topEmotions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Emotional Profile</h4>
                <div className="grid grid-cols-3 gap-4">
                  {analytics.topEmotions.map(([emotion, count]) => (
                    <div key={emotion} className="border border-gray-200 rounded p-3">
                      <p className="text-sm font-semibold text-gray-900 capitalize">{emotion}</p>
                      <p className="text-xs text-gray-500 mt-1">{count} occurrences</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {weekTab === "suggestions" && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Clinical Action Items Header */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Clinical Action Items</h3>
              <p className="text-sm text-gray-600">Evidence-based recommendations for professional review and action.</p>
            </div>

            {/* Crisis Alert - Compact */}
            {analytics.crisisDetected && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-red-900 mb-1">CRISIS - Immediate Action Required</h4>
                    <p className="text-sm text-red-800 mb-2">Patient expressed suicidal ideation. Contact immediately and provide crisis resources.</p>
                    <div className="flex gap-4 text-xs">
                      <span className="font-mono font-semibold">988 - Crisis Lifeline</span>
                      <span className="font-mono font-semibold">741741 - Text HOME</span>
                      <span className="font-mono font-semibold">911 - Emergency</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Clinical Recommendations Grid */}
            <div className="grid grid-cols-2 gap-6">
              {parseFloat(analytics.avgMood) < 5 && !analytics.crisisDetected && (
                <div className="bg-white border border-yellow-300 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Low Mood Alert</h4>
                    <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">REVIEW</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">Weekly average: {analytics.avgMood}/10</p>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-600">• Schedule follow-up within 1-2 weeks</p>
                    <p className="text-xs text-gray-600">• Review treatment plan effectiveness</p>
                    <p className="text-xs text-gray-600">• Consider MH specialist referral if decline persists</p>
                  </div>
                </div>
              )}

              {analytics.topSymptoms.length > 2 && (
                <div className="bg-white border border-red-300 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Multiple Symptoms</h4>
                    <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">ACTION</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{analytics.topSymptoms.length} distinct symptoms: {analytics.topSymptoms.slice(0, 3).map(([s]) => s).join(", ")}</p>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-600">• Comprehensive symptom review needed</p>
                    <p className="text-xs text-gray-600">• Consider differential diagnosis workup</p>
                    <p className="text-xs text-gray-600">• Evaluate symptom clustering patterns</p>
                  </div>
                </div>
              )}

              {analytics.topMedications.length > 0 && (
                <div className="bg-white border border-blue-300 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Medication Review</h4>
                    <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">MONITOR</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{analytics.topMedications.length} medication(s) referenced in entries</p>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-600">• Verify current medication list accuracy</p>
                    <p className="text-xs text-gray-600">• Assess adherence and barriers</p>
                    <p className="text-xs text-gray-600">• Screen for adverse effects or interactions</p>
                  </div>
                </div>
              )}

              {weekData.entries.length < 2 && (
                <div className="bg-white border border-gray-300 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Low Engagement</h4>
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">DISCUSS</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{weekData.entries.length} {weekData.entries.length === 1 ? 'entry' : 'entries'} this week</p>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-600">• Discuss barriers to consistent tracking</p>
                    <p className="text-xs text-gray-600">• Reinforce benefits of regular monitoring</p>
                    <p className="text-xs text-gray-600">• Consider simplified tracking approach</p>
                  </div>
                </div>
              )}

              {parseFloat(analytics.avgMood) >= 7 && weekData.entries.length >= 5 && (
                <div className="bg-white border border-green-300 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Positive Trajectory</h4>
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">STABLE</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">Mood: {analytics.avgMood}/10 | Engagement: {weekData.entries.length} entries</p>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-600">• Continue current treatment regimen</p>
                    <p className="text-xs text-gray-600">• Reinforce engagement behaviors</p>
                    <p className="text-xs text-gray-600">• Consider reducing visit frequency</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-8 z-50"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c1a57d] to-[#b39a6d] flex items-center justify-center shadow-md">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Journal Entry</h3>
                    <p className="text-sm text-gray-500">{formatDateTime(selectedEntry.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(85vh-120px)]">
              {/* Mood Badge */}
              {selectedEntry.entryType === "diary" && selectedEntry.extractedData?.moods && (
                <div className="mb-6 flex items-center gap-3">
                  {selectedEntry.extractedData.moods.overall && (
                    <span className="px-4 py-2 bg-gradient-to-r from-[#c1a57d]/10 to-[#b39a6d]/10 text-[#c1a57d] font-semibold rounded-xl capitalize">
                      {selectedEntry.extractedData.moods.overall}
                    </span>
                  )}
                  {selectedEntry.extractedData.moods.score && (
                    <span className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl">
                      Mood: {selectedEntry.extractedData.moods.score}/10
                    </span>
                  )}
                </div>
              )}

              {/* AI Summary */}
              {selectedEntry.entryType === "diary" && selectedEntry.summary && (
                <div className="mb-6 bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI-Generated Summary
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{selectedEntry.summary}</p>
                </div>
              )}

              {/* Full Conversation/Content */}
              {selectedEntry.entryType === "diary" && (selectedEntry.conversationText || selectedEntry.userInput) && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Full Conversation
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedEntry.conversationText || selectedEntry.userInput}
                    </p>
                  </div>
                </div>
              )}

              {/* Note Content */}
              {selectedEntry.entryType === "note" && selectedEntry.content && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Entry Content
                  </h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedEntry.content}</p>
                </div>
              )}

              {/* Extracted Data */}
              {selectedEntry.entryType === "diary" && selectedEntry.extractedData && (
                <div className="space-y-5">
                  {/* Symptoms */}
                  {selectedEntry.extractedData.symptoms && selectedEntry.extractedData.symptoms.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Symptoms Reported
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.extractedData.symptoms.map((symptom: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-red-50 text-red-700 font-medium rounded-lg capitalize border border-red-100"
                          >
                            {symptom.name}
                            {symptom.severity && <span className="text-xs ml-1.5">({symptom.severity})</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medications */}
                  {selectedEntry.extractedData.medications && selectedEntry.extractedData.medications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Medications Mentioned
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.extractedData.medications.map((med: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-green-50 text-green-700 font-medium rounded-lg capitalize border border-green-100"
                          >
                            {med.name}
                            {med.dosage && <span className="text-xs ml-1.5">({med.dosage})</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emotions */}
                  {selectedEntry.extractedData.moods?.emotions && selectedEntry.extractedData.moods.emotions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Emotions Expressed
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.extractedData.moods.emotions.map((emotion: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-purple-50 text-purple-700 font-medium rounded-lg capitalize border border-purple-100"
                          >
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WeekReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c1a57d] mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading week review...</p>
        </div>
      </div>
    }>
      <WeekReviewContent />
    </Suspense>
  );
}