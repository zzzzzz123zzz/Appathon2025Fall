"use client";

import { useState, useEffect } from "react";
import { signOut, createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Patient, Note, Doctor, DiaryEntry } from "@/lib/types";

// Combined type for displaying both notes and diary entries
type JournalEntry = (Note | DiaryEntry) & { entryType: "note" | "diary" };

type WeekData = {
  weekLabel: string;
  entries: JournalEntry[];
  startDate: Date;
};

export default function Dashboard() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientEntries, setPatientEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set());
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [weekTab, setWeekTab] = useState<
    "entries" | "analytics" | "mood" | "suggestions"
  >("entries");
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [createError, setCreateError] = useState("");
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [importingCSV, setImportingCSV] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
  });

  useEffect(() => {
    loadDoctorData();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientNotes(selectedPatient.id);
    }
  }, [selectedPatient]);

  const loadDoctorData = async () => {
    if (!auth.currentUser) return;

    try {
      const doctorDoc = await getDoc(doc(db, "doctors", auth.currentUser.uid));
      if (doctorDoc.exists()) {
        const doctorData = { id: doctorDoc.id, ...doctorDoc.data() } as Doctor;
        setDoctor(doctorData);

        const usersSnapshot = await getDocs(collection(db, "users"));
        const patients: Patient[] = [];
        usersSnapshot.forEach((doc) => {
          patients.push({ id: doc.id, ...doc.data() } as Patient);
        });
        setAllPatients(patients);

        const myPts = patients.filter((p) =>
          doctorData.patients.includes(p.id)
        );
        setMyPatients(myPts);
      }
    } catch (error) {
      console.error("Error loading doctor data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientNotes = async (patientId: string) => {
    try {
      const allEntries: JournalEntry[] = [];
      console.log("Loading data for patient:", patientId);

      // Fetch diary entries from users/{userId}/diaryEntries subcollection
      try {
        const diaryEntriesRef = collection(
          db,
          "users",
          patientId,
          "diaryEntries"
        );
        const diaryEntriesSnapshot = await getDocs(diaryEntriesRef);

        console.log("Diary entries found:", diaryEntriesSnapshot.size);
        diaryEntriesSnapshot.forEach((doc) => {
          const diaryData = doc.data();
          console.log("Diary entry:", doc.id, diaryData);
          allEntries.push({
            id: doc.id,
            ...diaryData,
            entryType: "diary",
          } as JournalEntry);
        });
      } catch (error) {
        console.log("No diary entries found or error fetching:", error);
      }

      // Fetch notes from users/{userId}/notes subcollection
      try {
        const notesRef = collection(db, "users", patientId, "notes");
        const notesSnapshot = await getDocs(notesRef);

        console.log("Notes (subcollection) found:", notesSnapshot.size);
        notesSnapshot.forEach((doc) => {
          const noteData = doc.data();
          console.log("Note:", doc.id, noteData);
          allEntries.push({
            id: doc.id,
            ...noteData,
            entryType: "note",
          } as JournalEntry);
        });
      } catch (error) {
        console.log("No notes found or error fetching:", error);
      }

      // ALSO fetch from global notes collection as fallback
      try {
        const globalNotesRef = collection(db, "notes");
        const globalNotesSnapshot = await getDocs(globalNotesRef);

        console.log("Global notes found:", globalNotesSnapshot.size);
        globalNotesSnapshot.forEach((doc) => {
          const noteData = doc.data();
          if (noteData.userId === patientId) {
            console.log("Global note for this patient:", doc.id, noteData);
            allEntries.push({
              id: doc.id,
              userId: noteData.userId,
              content: noteData.content,
              mood: noteData.mood,
              createdAt: noteData.createdAt,
              entryType: "note",
            } as JournalEntry);
          }
        });
      } catch (error) {
        console.log("No global notes found or error fetching:", error);
      }

      // Sort all entries by date (newest first)
      allEntries.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });

      console.log("Total entries loaded:", allEntries.length);
      setPatientEntries(allEntries);
    } catch (error) {
      console.error("Error loading patient data:", error);
    }
  };

  const addPatient = async (patientId: string) => {
    if (!doctor) return;

    try {
      await updateDoc(doc(db, "doctors", doctor.id), {
        patients: arrayUnion(patientId),
      });

      const patient = allPatients.find((p) => p.id === patientId);
      if (patient) {
        setMyPatients([...myPatients, patient]);
        setDoctor({ ...doctor, patients: [...doctor.patients, patientId] });
      }
      setShowAddPatient(false);
    } catch (error) {
      console.error("Error adding patient:", error);
    }
  };

  const removePatient = async (patientId: string) => {
    if (!doctor) return;

    try {
      await updateDoc(doc(db, "doctors", doctor.id), {
        patients: arrayRemove(patientId),
      });

      setMyPatients(myPatients.filter((p) => p.id !== patientId));
      setDoctor({
        ...doctor,
        patients: doctor.patients.filter((id) => id !== patientId),
      });

      if (selectedPatient?.id === patientId) {
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error("Error removing patient:", error);
    }
  };

  const createNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPatient(true);
    setCreateError("");

    try {
      // Create the patient user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newPatientForm.email,
        newPatientForm.password
      );

      const newPatientId = userCredential.user.uid;

      // Create patient profile in Firestore
      await setDoc(doc(db, "users", newPatientId), {
        name: newPatientForm.name,
        email: newPatientForm.email,
        createdAt: serverTimestamp(),
      });

      // Add patient to doctor's patient list
      if (doctor) {
        await updateDoc(doc(db, "doctors", doctor.id), {
          patients: arrayUnion(newPatientId),
        });
      }

      // Update local state
      const newPatient: Patient = {
        id: newPatientId,
        name: newPatientForm.name,
        email: newPatientForm.email,
        createdAt: new Date(),
      };

      setAllPatients([...allPatients, newPatient]);
      setMyPatients([...myPatients, newPatient]);
      if (doctor) {
        setDoctor({ ...doctor, patients: [...doctor.patients, newPatientId] });
      }

      // Reset form and close modal
      setNewPatientForm({ name: "", email: "", password: "" });
      setShowCreatePatient(false);

      alert(`Patient ${newPatientForm.name} created successfully!`);
    } catch (error: any) {
      console.error("Error creating patient:", error);
      setCreateError(error.message || "Failed to create patient");
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleCSVImport = async () => {
    if (!csvFile || !doctor) return;

    setImportingCSV(true);
    setImportResults(null);

    const results = { success: 0, failed: 0, errors: [] as string[] };

    try {
      const text = await csvFile.text();
      const lines = text.split("\n").filter((line) => line.trim());

      // Skip header row
      const dataLines = lines.slice(1);

      for (const line of dataLines) {
        const [name, email, password] = line.split(",").map((s) => s.trim());

        if (!name || !email || !password) {
          results.failed++;
          results.errors.push(`Invalid row: ${line}`);
          continue;
        }

        try {
          // Create patient account
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          const patientId = userCredential.user.uid;

          // Create patient profile
          await setDoc(doc(db, "users", patientId), {
            name,
            email,
            createdAt: serverTimestamp(),
          });

          // Add to doctor's patient list
          await updateDoc(doc(db, "doctors", doctor.id), {
            patients: arrayUnion(patientId),
          });

          results.success++;

          // Update local state
          const newPatient: Patient = {
            id: patientId,
            name,
            email,
            createdAt: new Date(),
          };
          setAllPatients((prev) => [...prev, newPatient]);
          setMyPatients((prev) => [...prev, newPatient]);
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${email}: ${error.message}`);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setImportResults(results);

      if (doctor) {
        // Refresh doctor data to get updated patient list
        const doctorDoc = await getDoc(doc(db, "doctors", doctor.id));
        if (doctorDoc.exists()) {
          const doctorData = {
            id: doctorDoc.id,
            ...doctorDoc.data(),
          } as Doctor;
          setDoctor(doctorData);
        }
      }
    } catch (error: any) {
      results.errors.push(`File processing error: ${error.message}`);
      setImportResults(results);
    } finally {
      setImportingCSV(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const sendNotification = async () => {
    if (
      !selectedPatient ||
      !notificationForm.title ||
      !notificationForm.message
    ) {
      alert("Please fill in both title and message");
      return;
    }

    if (!selectedPatient.pushToken) {
      alert("This patient has not enabled push notifications yet.");
      return;
    }

    setSendingNotification(true);

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pushToken: selectedPatient.pushToken,
          title: notificationForm.title,
          body: notificationForm.message,
          data: {
            type: "doctor_message",
            patientId: selectedPatient.id,
            doctorId: doctor?.id,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Notification sent to ${selectedPatient.name}!`);
        setShowNotificationModal(false);
        setNotificationForm({ title: "", message: "" });
      } else {
        alert(`Failed to send notification: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Error sending notification:", error);
      alert(`Error sending notification: ${error.message}`);
    } finally {
      setSendingNotification(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Recent";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  // Group entries by week
  const groupEntriesByWeek = (entries: JournalEntry[]) => {
    const grouped = new Map<string, JournalEntry[]>();

    entries.forEach((entry) => {
      const date = entry.createdAt?.toDate
        ? entry.createdAt.toDate()
        : new Date(entry.createdAt);

      // Get the start of the week (Sunday)
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const weekKey = startOfWeek.toISOString();

      if (!grouped.has(weekKey)) {
        grouped.set(weekKey, []);
      }
      grouped.get(weekKey)!.push(entry);
    });

    // Convert to array and sort by week (newest first)
    return Array.from(grouped.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([weekKey, entries]) => {
        const startOfWeek = new Date(weekKey);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const weekLabel = `${startOfWeek.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${endOfWeek.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;

        return { weekLabel, entries, startDate: startOfWeek };
      });
  };

  const toggleWeek = (weekKey: string) => {
    const newCollapsed = new Set(collapsedWeeks);
    if (newCollapsed.has(weekKey)) {
      newCollapsed.delete(weekKey);
    } else {
      newCollapsed.add(weekKey);
    }
    setCollapsedWeeks(newCollapsed);
  };

  const getWeekAnalytics = (entries: JournalEntry[]) => {
    const symptoms = new Map<string, number>();
    const medications = new Map<string, number>();
    const moodScores: number[] = [];
    const emotions = new Map<string, number>();

    entries.forEach((entry) => {
      if (
        entry.entryType === "diary" &&
        "extractedData" in entry &&
        entry.extractedData
      ) {
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
      topSymptoms: Array.from(symptoms.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      topMedications: Array.from(medications.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      topEmotions: Array.from(emotions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    };
  };

  const availablePatients = allPatients.filter(
    (p) => !doctor?.patients.includes(p.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c1a57d] mx-auto"></div>
          <p className="mt-4 text-[#888888]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-[#e5e5e5]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#444444]">Doctor Portal</h1>
            <p className="text-sm text-[#888888]">
              Welcome, Dr. {doctor?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 border-2 border-[#e5e5e5] rounded-lg text-[#444444] font-semibold hover:bg-[#f4f4f4] transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patients List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#e5e5e5]">
              <div className="p-6 border-b border-[#e5e5e5]">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-[#444444]">
                    My Patients ({myPatients.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreatePatient(true)}
                      className="flex-1 px-4 py-2 bg-[#c1a57d] hover:bg-[#a89267] text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition"
                    >
                      + Create New
                    </button>
                    <button
                      onClick={() => setShowAddPatient(true)}
                      className="flex-1 px-4 py-2 border-2 border-[#c1a57d] text-[#c1a57d] hover:bg-[#c1a57d] hover:text-white rounded-lg text-sm font-semibold transition"
                    >
                      Add Existing
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCSVImport(true)}
                    className="w-full px-4 py-2 border-2 border-[#e5e5e5] text-[#444444] hover:bg-[#f4f4f4] rounded-lg text-sm font-semibold transition"
                  >
                    📄 Import CSV
                  </button>
                </div>
              </div>

              {myPatients.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[#888888]">No patients yet</p>
                  <p className="text-sm text-[#888888] mt-2">
                    Add patients to start monitoring
                  </p>
                </div>
              ) : (
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                  {myPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 border-b border-[#e5e5e5] cursor-pointer hover:bg-[#f4f4f4] transition ${
                        selectedPatient?.id === patient.id
                          ? "bg-[#f4f4f4] border-l-4 border-l-[#c1a57d]"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#c1a57d] flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {patient.profileImage ? (
                            <img
                              src={patient.profileImage}
                              alt={patient.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            patient.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#444444] truncate">
                            {patient.name}
                          </h3>
                          <p className="text-sm text-[#888888] truncate">
                            {patient.email}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Remove ${patient.name}?`)) {
                              removePatient(patient.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 font-bold text-lg"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-[#e5e5e5]">
              {selectedPatient ? (
                <>
                  <div className="flex items-center gap-4 pb-6 border-b border-[#e5e5e5] mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#c1a57d] flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {selectedPatient.profileImage ? (
                        <img
                          src={selectedPatient.profileImage}
                          alt={selectedPatient.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        selectedPatient.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-[#444444]">
                        {selectedPatient.name}
                      </h2>
                      <p className="text-[#888888]">{selectedPatient.email}</p>
                      <p className="text-sm text-[#888888] mt-1">
                        Patient since {formatDate(selectedPatient.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNotificationModal(true)}
                      className="px-4 py-2 bg-[#c1a57d] hover:bg-[#a89267] text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition flex items-center gap-2"
                      title={
                        selectedPatient.pushToken
                          ? "Send push notification"
                          : "Patient has not enabled notifications"
                      }
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      Notify Patient
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-[#444444] mb-4">
                    Journal Entries ({patientEntries.length})
                  </h3>

                  {patientEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-[#888888]">No journal entries yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                      {groupEntriesByWeek(patientEntries).map(
                        (week, weekIndex) => {
                          const weekKey = week.startDate.toISOString();
                          const isCollapsed = collapsedWeeks.has(weekKey);

                          return (
                            <div key={weekIndex} className="space-y-3">
                              {/* Week Header */}
                              <div className="sticky top-0 bg-white z-10 pb-2 mb-3 border-b-2 border-[#c1a57d]">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 flex-1">
                                    <button
                                      onClick={() => toggleWeek(weekKey)}
                                      className="text-[#c1a57d] hover:text-[#a89267] transition-colors"
                                      title={
                                        isCollapsed ? "Expand" : "Collapse"
                                      }
                                    >
                                      {isCollapsed ? (
                                        <svg
                                          className="w-5 h-5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                          />
                                        </svg>
                                      ) : (
                                        <svg
                                          className="w-5 h-5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                          />
                                        </svg>
                                      )}
                                    </button>
                                    <h3 className="text-lg font-bold text-[#c1a57d]">
                                      📅 {week.weekLabel}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-[#888888] bg-[#f4f4f4] px-3 py-1 rounded-full">
                                      {week.entries.length}{" "}
                                      {week.entries.length === 1
                                        ? "entry"
                                        : "entries"}
                                    </span>
                                    <button
                                      onClick={() => setSelectedWeek(week)}
                                      className="px-3 py-1 bg-[#c1a57d] hover:bg-[#a89267] text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                      View Week →
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Entries for this week */}
                              {!isCollapsed &&
                                week.entries.map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="bg-white rounded-lg p-5 border-2 border-[#e5e5e5] hover:border-[#c1a57d] hover:shadow-md transition-all duration-200"
                                  >
                                    <div className="flex justify-between items-center mb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-[#888888]">
                                          {formatDateTime(entry.createdAt)}
                                        </span>
                                        {entry.entryType === "diary" && (
                                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded">
                                            AI Processed
                                          </span>
                                        )}
                                      </div>
                                      {entry.entryType === "note" &&
                                        "mood" in entry &&
                                        entry.mood && (
                                          <span className="px-3 py-1 bg-[#c1a57d] text-white text-xs font-semibold rounded-full">
                                            {entry.mood}
                                          </span>
                                        )}
                                      {entry.entryType === "diary" &&
                                        "extractedData" in entry &&
                                        entry.extractedData?.moods?.overall && (
                                          <span className="px-3 py-1 bg-[#c1a57d] text-white text-xs font-semibold rounded-full">
                                            {entry.extractedData.moods.overall}
                                          </span>
                                        )}
                                    </div>

                                    {/* Display content based on entry type */}
                                    {entry.entryType === "note" &&
                                      "content" in entry && (
                                        <p className="text-[#444444] leading-relaxed">
                                          {entry.content}
                                        </p>
                                      )}

                                    {entry.entryType === "diary" &&
                                      "summary" in entry && (
                                        <>
                                          {entry.summary && (
                                            <div className="mb-3">
                                              <h4 className="text-sm font-bold text-[#c1a57d] mb-1">
                                                AI Summary
                                              </h4>
                                              <p className="text-[#444444] leading-relaxed">
                                                {entry.summary}
                                              </p>
                                            </div>
                                          )}

                                          {entry.extractedData && (
                                            <div className="mt-3 pt-3 border-t border-[#e5e5e5] space-y-2">
                                              <h4 className="text-sm font-bold text-[#c1a57d]">
                                                Extracted Health Data
                                              </h4>

                                              {entry.extractedData.symptoms &&
                                                entry.extractedData.symptoms
                                                  .length > 0 && (
                                                  <div>
                                                    <p className="text-xs font-semibold text-[#888888] mb-1">
                                                      Symptoms:
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                      {entry.extractedData.symptoms.map(
                                                        (symptom, idx) => (
                                                          <span
                                                            key={idx}
                                                            className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                                                          >
                                                            {symptom.name}
                                                            {symptom.severity &&
                                                              ` (${symptom.severity})`}
                                                          </span>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                              {entry.extractedData
                                                .medications &&
                                                entry.extractedData.medications
                                                  .length > 0 && (
                                                  <div>
                                                    <p className="text-xs font-semibold text-[#888888] mb-1">
                                                      Medications:
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                      {entry.extractedData.medications.map(
                                                        (med, idx) => (
                                                          <span
                                                            key={idx}
                                                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                                                          >
                                                            {med.name}
                                                            {med.dosage &&
                                                              ` - ${med.dosage}`}
                                                          </span>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                              {entry.extractedData.moods && (
                                                <div>
                                                  <p className="text-xs font-semibold text-[#888888] mb-1">
                                                    Mood Analysis:
                                                  </p>
                                                  <div className="flex flex-wrap gap-2 items-center">
                                                    {entry.extractedData.moods
                                                      .score && (
                                                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                                        Score:{" "}
                                                        {
                                                          entry.extractedData
                                                            .moods.score
                                                        }
                                                        /10
                                                      </span>
                                                    )}
                                                    {entry.extractedData.moods
                                                      .emotions &&
                                                      entry.extractedData.moods.emotions.map(
                                                        (emotion, idx) => (
                                                          <span
                                                            key={idx}
                                                            className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded"
                                                          >
                                                            {emotion}
                                                          </span>
                                                        )
                                                      )}
                                                  </div>
                                                </div>
                                              )}

                                              {entry.extractedData
                                                .otherHealthChallenges &&
                                                entry.extractedData
                                                  .otherHealthChallenges
                                                  .length > 0 && (
                                                  <div>
                                                    <p className="text-xs font-semibold text-[#888888] mb-1">
                                                      Other Health Challenges:
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                      {entry.extractedData.otherHealthChallenges.map(
                                                        (challenge, idx) => (
                                                          <span
                                                            key={idx}
                                                            className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                                                          >
                                                            {challenge}
                                                          </span>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                            </div>
                                          )}

                                          {entry.conversationText && (
                                            <details className="mt-3">
                                              <summary className="text-xs font-semibold text-[#888888] cursor-pointer hover:text-[#c1a57d]">
                                                View Full Conversation
                                              </summary>
                                              <p className="mt-2 text-sm text-[#444444] leading-relaxed whitespace-pre-wrap">
                                                {entry.conversationText}
                                              </p>
                                            </details>
                                          )}
                                        </>
                                      )}
                                  </div>
                                ))}
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-xl font-semibold text-[#444444]">
                    Select a patient
                  </h3>
                  <p className="text-[#888888] mt-2">
                    Choose a patient from the left to view their journal entries
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Detail Modal */}
      {selectedWeek && (
        <div
          className="fixed inset-0 bg-white bg-opacity-40 flex items-center justify-center p-8 z-50 animate-fadeIn backdrop-blur-sm"
          onClick={() => setSelectedWeek(null)}
        >
          <div
            className="bg-white w-full max-h-[92vh] flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Week Header */}
            <div className="px-10 py-8 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-[#c1a57d] mb-2">
                  📅 {selectedWeek.weekLabel}
                </h2>
                <p className="text-base text-[#888888]">
                  {selectedPatient?.name}'s Weekly Summary
                </p>
              </div>
              <button
                onClick={() => setSelectedWeek(null)}
                className="text-[#888888] hover:text-[#c1a57d] text-4xl font-light transition-all duration-300 hover:rotate-90 w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="px-10">
              <div className="flex gap-2">
                <button
                  onClick={() => setWeekTab("entries")}
                  className={`px-6 py-3 font-semibold rounded-t-xl transition-all duration-300 ${
                    weekTab === "entries"
                      ? "text-[#c1a57d] bg-[#f9f9f9] shadow-sm"
                      : "text-[#888888] hover:text-[#c1a57d] hover:bg-[#fafafa]"
                  }`}
                >
                  Entries ({selectedWeek.entries.length})
                </button>
                <button
                  onClick={() => setWeekTab("analytics")}
                  className={`px-6 py-3 font-semibold rounded-t-xl transition-all duration-300 ${
                    weekTab === "analytics"
                      ? "text-[#c1a57d] bg-[#f9f9f9] shadow-sm"
                      : "text-[#888888] hover:text-[#c1a57d] hover:bg-[#fafafa]"
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setWeekTab("mood")}
                  className={`px-6 py-3 font-semibold rounded-t-xl transition-all duration-300 ${
                    weekTab === "mood"
                      ? "text-[#c1a57d] bg-[#f9f9f9] shadow-sm"
                      : "text-[#888888] hover:text-[#c1a57d] hover:bg-[#fafafa]"
                  }`}
                >
                  Mood Trends
                </button>
                <button
                  onClick={() => setWeekTab("suggestions")}
                  className={`px-6 py-3 font-semibold rounded-t-xl transition-all duration-300 ${
                    weekTab === "suggestions"
                      ? "text-[#c1a57d] bg-[#f9f9f9] shadow-sm"
                      : "text-[#888888] hover:text-[#c1a57d] hover:bg-[#fafafa]"
                  }`}
                >
                  Suggestions
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="px-10 py-8 overflow-y-auto flex-1 bg-[#f9f9f9] rounded-b-3xl">
              {weekTab === "entries" && (
                <div className="space-y-6">
                  {selectedWeek.entries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeIn"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-sm font-medium text-[#888888]">
                          {formatDateTime(entry.createdAt)}
                        </span>
                        {entry.entryType === "diary" &&
                          "extractedData" in entry &&
                          entry.extractedData?.moods?.overall && (
                            <span className="px-4 py-2 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] text-white text-sm font-semibold rounded-full shadow-sm">
                              {entry.extractedData.moods.overall} ·{" "}
                              {entry.extractedData.moods.score}/10
                            </span>
                          )}
                      </div>
                      {entry.entryType === "diary" &&
                        "summary" in entry &&
                        entry.summary && (
                          <p className="text-[#444444] leading-relaxed text-lg">
                            {entry.summary}
                          </p>
                        )}
                      {entry.entryType === "note" && "content" in entry && (
                        <p className="text-[#444444] leading-relaxed text-lg">
                          {entry.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {weekTab === "analytics" &&
                (() => {
                  const analytics = getWeekAnalytics(selectedWeek.entries);
                  return (
                    <div className="space-y-10">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                          <p className="text-sm font-medium text-[#888888] mb-3">
                            Total Entries
                          </p>
                          <p className="text-5xl font-bold bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] bg-clip-text text-transparent">
                            {analytics.totalEntries}
                          </p>
                        </div>
                        <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
                          <p className="text-sm font-medium text-[#888888] mb-3">
                            Average Mood
                          </p>
                          <p className="text-5xl font-bold bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] bg-clip-text text-transparent">
                            {analytics.avgMood}/10
                          </p>
                        </div>
                      </div>

                      {analytics.topSymptoms.length > 0 && (
                        <div>
                          <h3 className="text-2xl font-bold text-[#444444] mb-6">
                            Most Frequent Symptoms
                          </h3>
                          <div className="space-y-4">
                            {analytics.topSymptoms.map(
                              ([symptom, count], index) => (
                                <div
                                  key={symptom}
                                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex justify-between items-center animate-fadeIn"
                                  style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                  <span className="font-medium text-[#444444] capitalize text-lg">
                                    {symptom}
                                  </span>
                                  <span className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white text-sm font-bold rounded-full shadow-sm">
                                    {count} times
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {analytics.topMedications.length > 0 && (
                        <div>
                          <h3 className="text-2xl font-bold text-[#444444] mb-6">
                            Medications Mentioned
                          </h3>
                          <div className="space-y-4">
                            {analytics.topMedications.map(
                              ([med, count], index) => (
                                <div
                                  key={med}
                                  className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex justify-between items-center animate-fadeIn"
                                  style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                  <span className="font-medium text-[#444444] text-lg">
                                    {med}
                                  </span>
                                  <span className="px-4 py-2 bg-gradient-to-r from-green-400 to-green-500 text-white text-sm font-bold rounded-full shadow-sm">
                                    {count} times
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {weekTab === "mood" &&
                (() => {
                  const analytics = getWeekAnalytics(selectedWeek.entries);
                  return (
                    <div className="space-y-10">
                      <div className="bg-white rounded-2xl p-10 shadow-sm text-center">
                        <p className="text-sm font-medium text-[#888888] mb-4">
                          Average Mood Score
                        </p>
                        <p className="text-7xl font-bold bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] bg-clip-text text-transparent mb-4">
                          {analytics.avgMood}
                        </p>
                        <p className="text-base text-[#888888]">
                          {selectedWeek.entries.length} entries recorded this
                          week
                        </p>
                      </div>

                      {analytics.topEmotions.length > 0 && (
                        <div>
                          <h3 className="text-2xl font-bold text-[#444444] mb-6">
                            Most Common Emotions
                          </h3>
                          <div className="grid grid-cols-2 gap-5">
                            {analytics.topEmotions.map(
                              ([emotion, count], index) => (
                                <div
                                  key={emotion}
                                  className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 animate-fadeIn"
                                  style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                  <p className="text-2xl font-bold text-[#c1a57d] capitalize mb-2">
                                    {emotion}
                                  </p>
                                  <p className="text-base text-[#888888]">
                                    {count} times this week
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {analytics.moodScores.length > 0 && (
                        <div>
                          <h3 className="text-2xl font-bold text-[#444444] mb-6">
                            Daily Mood Scores
                          </h3>
                          <div className="bg-white rounded-2xl p-8 shadow-sm">
                            <div className="flex items-end gap-3 h-64">
                              {analytics.moodScores.map((score, idx) => (
                                <div
                                  key={idx}
                                  className="flex-1 flex flex-col items-center justify-end"
                                >
                                  <div
                                    className="w-full bg-gradient-to-t from-[#c1a57d] to-[#d4c3a8] rounded-t-lg transition-all duration-500 hover:opacity-80"
                                    style={{ height: `${(score / 10) * 100}%` }}
                                  ></div>
                                  <span className="text-sm text-[#888888] mt-3 font-medium">
                                    {score}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {weekTab === "suggestions" &&
                (() => {
                  const analytics = getWeekAnalytics(selectedWeek.entries);
                  const avgMoodNum = parseFloat(analytics.avgMood);

                  return (
                    <div className="space-y-8 animate-fadeIn">
                      <div
                        className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 shadow-lg"
                        style={{ animationDelay: "0.1s" }}
                      >
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-[#c1a57d] to-[#a89267] bg-clip-text text-transparent mb-3">
                          💡 AI-Powered Suggestions
                        </h3>
                        <p className="text-base text-gray-600 leading-relaxed">
                          Based on this week's entries, here are some
                          recommendations:
                        </p>
                      </div>

                      {avgMoodNum < 5 && (
                        <div
                          className="bg-gradient-to-br from-white to-amber-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 animate-fadeIn"
                          style={{ animationDelay: "0.2s" }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                              <span className="text-2xl">⚠️</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-800 mb-2">
                                Low Mood Alert
                              </h4>
                              <p className="text-base text-gray-600 leading-relaxed">
                                The average mood score this week is{" "}
                                {analytics.avgMood}/10. Consider scheduling a
                                follow-up appointment to discuss mental health
                                support options.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {analytics.topSymptoms.length > 2 && (
                        <div
                          className="bg-gradient-to-br from-white to-red-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 animate-fadeIn"
                          style={{ animationDelay: "0.3s" }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                              <span className="text-2xl">🏥</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-800 mb-2">
                                Multiple Symptoms Reported
                              </h4>
                              <p className="text-base text-gray-600 leading-relaxed">
                                Patient reported {analytics.topSymptoms.length}{" "}
                                different symptoms this week. Review symptom
                                patterns and consider diagnostic evaluation.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {analytics.topMedications.length > 0 && (
                        <div
                          className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 animate-fadeIn"
                          style={{ animationDelay: "0.4s" }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                              <span className="text-2xl">💊</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-800 mb-2">
                                Medication Tracking
                              </h4>
                              <p className="text-base text-gray-600 leading-relaxed">
                                Patient mentioned{" "}
                                {analytics.topMedications.length} medication(s)
                                this week. Verify medication adherence and check
                                for any side effects.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedWeek.entries.length < 2 && (
                        <div
                          className="bg-gradient-to-br from-white to-orange-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 animate-fadeIn"
                          style={{ animationDelay: "0.5s" }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                              <span className="text-2xl">📝</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-800 mb-2">
                                Low Engagement
                              </h4>
                              <p className="text-base text-gray-600 leading-relaxed">
                                Only {selectedWeek.entries.length} entry this
                                week. Encourage patient to journal more
                                regularly for better health tracking.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {avgMoodNum >= 7 && selectedWeek.entries.length >= 5 && (
                        <div
                          className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 animate-fadeIn"
                          style={{ animationDelay: "0.6s" }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                              <span className="text-2xl">✨</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-800 mb-2">
                                Positive Progress
                              </h4>
                              <p className="text-base text-gray-600 leading-relaxed">
                                Excellent! High mood score ({analytics.avgMood}
                                /10) and consistent journaling. Continue current
                                treatment plan.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddPatient && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowAddPatient(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col border border-[#e5e5e5]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#e5e5e5] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#444444]">Add Patient</h2>
              <button
                onClick={() => setShowAddPatient(false)}
                className="text-[#888888] hover:text-[#444444] text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {availablePatients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#888888]">No available patients</p>
                  <p className="text-sm text-[#888888] mt-2">
                    All users are in your patient list
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availablePatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center gap-3 p-3 border-2 border-[#e5e5e5] rounded-lg hover:border-[#c1a57d] transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#c1a57d] flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {patient.profileImage ? (
                          <img
                            src={patient.profileImage}
                            alt={patient.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          patient.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[#444444] truncate">
                          {patient.name}
                        </h4>
                        <p className="text-sm text-[#888888] truncate">
                          {patient.email}
                        </p>
                      </div>
                      <button
                        onClick={() => addPatient(patient.id)}
                        className="px-4 py-2 bg-[#c1a57d] hover:bg-[#a89267] text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Patient Modal */}
      {showCreatePatient && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowCreatePatient(false);
            setCreateError("");
            setNewPatientForm({ name: "", email: "", password: "" });
          }}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full border border-[#e5e5e5]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#e5e5e5] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#444444]">
                Create New Patient
              </h2>
              <button
                onClick={() => {
                  setShowCreatePatient(false);
                  setCreateError("");
                  setNewPatientForm({ name: "", email: "", password: "" });
                }}
                className="text-[#888888] hover:text-[#444444] text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={createNewPatient} className="p-6">
              {createError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
                  {createError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#444444] mb-2">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newPatientForm.name}
                    onChange={(e) =>
                      setNewPatientForm({
                        ...newPatientForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-[#e5e5e5] rounded-lg bg-white text-[#444444] focus:outline-none focus:border-[#c1a57d]"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#444444] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newPatientForm.email}
                    onChange={(e) =>
                      setNewPatientForm({
                        ...newPatientForm,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-[#e5e5e5] rounded-lg bg-white text-[#444444] focus:outline-none focus:border-[#c1a57d]"
                    placeholder="patient@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#444444] mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPatientForm.password}
                    onChange={(e) =>
                      setNewPatientForm({
                        ...newPatientForm,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-[#e5e5e5] rounded-lg bg-white text-[#444444] focus:outline-none focus:border-[#c1a57d]"
                    placeholder="Min. 6 characters"
                  />
                  <p className="text-xs text-[#888888] mt-1">
                    This will be the patient's login password for the mobile app
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePatient(false);
                    setCreateError("");
                    setNewPatientForm({ name: "", email: "", password: "" });
                  }}
                  className="flex-1 px-4 py-2 border-2 border-[#e5e5e5] rounded-lg text-[#444444] font-semibold hover:bg-[#f4f4f4] transition"
                  disabled={creatingPatient}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#c1a57d] hover:bg-[#a89267] text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creatingPatient}
                >
                  {creatingPatient ? "Creating..." : "Create Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {showNotificationModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            if (!sendingNotification) {
              setShowNotificationModal(false);
              setNotificationForm({ title: "", message: "" });
            }
          }}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full border border-[#e5e5e5]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#e5e5e5] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#444444]">
                Send Notification to {selectedPatient?.name}
              </h2>
              <button
                onClick={() => {
                  if (!sendingNotification) {
                    setShowNotificationModal(false);
                    setNotificationForm({ title: "", message: "" });
                  }
                }}
                className="text-[#888888] hover:text-[#444444] text-2xl font-bold"
                disabled={sendingNotification}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {!selectedPatient?.pushToken && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-sm">
                  This patient has not enabled push notifications yet. They will
                  need to open the app and allow notifications first.
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#444444] mb-2">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    required
                    value={notificationForm.title}
                    onChange={(e) =>
                      setNotificationForm({
                        ...notificationForm,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-[#e5e5e5] rounded-lg bg-white text-[#444444] focus:outline-none focus:border-[#c1a57d]"
                    placeholder="e.g., Appointment Reminder"
                    disabled={sendingNotification}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#444444] mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={notificationForm.message}
                    onChange={(e) =>
                      setNotificationForm({
                        ...notificationForm,
                        message: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-[#e5e5e5] rounded-lg bg-white text-[#444444] focus:outline-none focus:border-[#c1a57d]"
                    placeholder="e.g., Your appointment is tomorrow at 2 PM. Please don't forget to bring your medication list."
                    disabled={sendingNotification}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNotificationForm({ title: "", message: "" });
                  }}
                  className="flex-1 px-4 py-2 border-2 border-[#e5e5e5] rounded-lg text-[#444444] font-semibold hover:bg-[#f4f4f4] transition"
                  disabled={sendingNotification}
                >
                  Cancel
                </button>
                <button
                  onClick={sendNotification}
                  className="flex-1 px-4 py-2 bg-[#c1a57d] hover:bg-[#a89267] text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    sendingNotification ||
                    !notificationForm.title ||
                    !notificationForm.message
                  }
                >
                  {sendingNotification ? "Sending..." : "Send Notification"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCSVImport && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            if (!importingCSV) {
              setShowCSVImport(false);
              setCSVFile(null);
              setImportResults(null);
            }
          }}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full border border-[#e5e5e5]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#e5e5e5] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#444444]">
                Import Patients from CSV
              </h2>
              <button
                onClick={() => {
                  if (!importingCSV) {
                    setShowCSVImport(false);
                    setCSVFile(null);
                    setImportResults(null);
                  }
                }}
                className="text-[#888888] hover:text-[#444444] text-2xl font-bold"
                disabled={importingCSV}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {!importResults ? (
                <>
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-[#444444] mb-2">
                      CSV Format:
                    </h3>
                    <p className="text-sm text-[#888888] mb-2">
                      Your CSV file should have 3 columns: name, email, password
                    </p>
                    <div className="bg-white p-2 rounded border border-[#e5e5e5] font-mono text-xs">
                      name,email,password
                      <br />
                      John Doe,john@example.com,password123
                      <br />
                      Jane Smith,jane@example.com,secure456
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-[#444444] mb-2">
                      Select CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCSVFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border-2 border-[#e5e5e5] rounded-lg bg-white text-[#444444] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#c1a57d] file:text-white file:font-semibold hover:file:bg-[#a89267]"
                      disabled={importingCSV}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCSVImport(false);
                        setCSVFile(null);
                      }}
                      className="flex-1 px-4 py-2 border-2 border-[#e5e5e5] rounded-lg text-[#444444] font-semibold hover:bg-[#f4f4f4] transition"
                      disabled={importingCSV}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCSVImport}
                      className="flex-1 px-4 py-2 bg-[#c1a57d] hover:bg-[#a89267] text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!csvFile || importingCSV}
                    >
                      {importingCSV ? "Importing..." : "Import Patients"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="font-semibold text-[#444444] mb-3">
                      Import Results
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                        <span className="font-semibold text-green-800">
                          Successful
                        </span>
                        <span className="text-2xl font-bold text-green-800">
                          {importResults.success}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                        <span className="font-semibold text-red-800">
                          Failed
                        </span>
                        <span className="text-2xl font-bold text-red-800">
                          {importResults.failed}
                        </span>
                      </div>
                    </div>

                    {importResults.errors.length > 0 && (
                      <div className="mt-4 max-h-40 overflow-y-auto">
                        <h4 className="font-semibold text-[#444444] mb-2 text-sm">
                          Errors:
                        </h4>
                        <div className="space-y-1">
                          {importResults.errors.map((error, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-red-600 bg-red-50 p-2 rounded"
                            >
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowCSVImport(false);
                      setCSVFile(null);
                      setImportResults(null);
                      loadDoctorData(); // Refresh patient list
                    }}
                    className="w-full px-4 py-2 bg-[#c1a57d] hover:bg-[#a89267] text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
