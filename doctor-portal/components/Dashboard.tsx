"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientEntries, setPatientEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set());
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Theo Health</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Welcome back, Dr. {doctor?.name}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patients List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  My Patients <span className="text-gray-400 text-base font-normal">({myPatients.length})</span>
                </h2>
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreatePatient(true)}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] hover:from-[#b39a6d] hover:to-[#a89267] text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      + Create New
                    </button>
                    <button
                      onClick={() => setShowAddPatient(true)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all duration-200"
                    >
                      Add Existing
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCSVImport(true)}
                    className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    📄 Import CSV
                  </button>
                </div>
              </div>

              {myPatients.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No patients yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add patients to start monitoring
                  </p>
                </div>
              ) : (
                <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                  {myPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 mx-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedPatient?.id === patient.id
                          ? "bg-gradient-to-r from-[#c1a57d]/10 to-[#b39a6d]/10 shadow-md"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#c1a57d] to-[#b39a6d] flex items-center justify-center text-white font-medium flex-shrink-0 shadow-md">
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
                          <h3 className="font-medium text-gray-800 truncate">
                            {patient.name}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
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
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
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
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
              {selectedPatient ? (
                <>
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#c1a57d] to-[#b39a6d] flex items-center justify-center text-white text-3xl font-semibold shadow-lg">
                        {selectedPatient.profileImage ? (
                          <img
                            src={selectedPatient.profileImage}
                            alt={selectedPatient.name}
                            className="w-full h-full rounded-2xl object-cover"
                          />
                        ) : (
                          selectedPatient.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-semibold text-gray-800">
                          {selectedPatient.name}
                        </h2>
                        <p className="text-gray-500 mt-0.5">{selectedPatient.email}</p>
                        <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Patient since {formatDate(selectedPatient.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowNotificationModal(true)}
                        className="px-5 py-3 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] hover:from-[#b39a6d] hover:to-[#a89267] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
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
                        Notify
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Journal Entries <span className="text-gray-400 text-base font-normal">({patientEntries.length})</span>
                    </h3>

                  {patientEntries.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">No journal entries yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-[calc(100vh-420px)] overflow-y-auto pr-2">
                      {groupEntriesByWeek(patientEntries).map(
                        (week, weekIndex) => {
                          const weekKey = week.startDate.toISOString();
                          const isCollapsed = collapsedWeeks.has(weekKey);

                          return (
                            <div key={weekIndex} className="space-y-3">
                              {/* Week Header */}
                              <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 pb-3 mb-3">
                                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-[#c1a57d]/10 to-transparent rounded-xl">
                                  <div className="flex items-center gap-3 flex-1">
                                    <button
                                      onClick={() => toggleWeek(weekKey)}
                                      className="text-[#c1a57d] hover:text-[#a89267] transition-colors p-1 hover:bg-white/50 rounded-lg"
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
                                    <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {week.weekLabel}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-sm">
                                      {week.entries.length}{" "}
                                      {week.entries.length === 1
                                        ? "entry"
                                        : "entries"}
                                    </span>
                                    <button
                                      onClick={() => {
                                        if (selectedPatient) {
                                          router.push(`/week-review?patientId=${selectedPatient.id}&weekStart=${week.startDate.toISOString()}`);
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] hover:from-[#b39a6d] hover:to-[#a89267] text-white text-xs font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                      View →
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Entries for this week */}
                              {!isCollapsed &&
                                week.entries.map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100"
                                  >
                                    <div className="flex justify-between items-center mb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-500">
                                          {formatDateTime(entry.createdAt)}
                                        </span>
                                        {entry.entryType === "diary" && (
                                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg">
                                            AI Processed
                                          </span>
                                        )}
                                      </div>
                                      {entry.entryType === "note" &&
                                        "mood" in entry &&
                                        entry.mood && (
                                          <span className="px-3 py-1.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] text-white text-xs font-medium rounded-full shadow-sm">
                                            {entry.mood}
                                          </span>
                                        )}
                                      {entry.entryType === "diary" &&
                                        "extractedData" in entry &&
                                        entry.extractedData?.moods?.overall && (
                                          <span className="px-3 py-1.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] text-white text-xs font-medium rounded-full shadow-sm">
                                            {entry.extractedData.moods.overall}
                                          </span>
                                        )}
                                    </div>

                                    {/* Display content based on entry type */}
                                    {entry.entryType === "note" &&
                                      "content" in entry && (
                                        <p className="text-gray-700 leading-relaxed">
                                          {entry.content}
                                        </p>
                                      )}

                                    {entry.entryType === "diary" &&
                                      "summary" in entry && (
                                        <>
                                          {entry.summary && (
                                            <div className="mb-4">
                                              <h4 className="text-sm font-semibold text-[#c1a57d] mb-2 flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                </svg>
                                                AI Summary
                                              </h4>
                                              <p className="text-gray-700 leading-relaxed">
                                                {entry.summary}
                                              </p>
                                            </div>
                                          )}

                                          {entry.extractedData && (
                                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
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
                  </div>
                </>
              ) : (
                <div className="text-center py-24">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Select a patient
                  </h3>
                  <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                    Choose a patient from the sidebar to view their journal entries and health data
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddPatient && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowAddPatient(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Add Patient</h2>
              <button
                onClick={() => setShowAddPatient(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 pb-6 overflow-y-auto">
              {availablePatients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-medium">No available patients</p>
                  <p className="text-sm text-gray-400 mt-2">
                    All users are in your patient list
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availablePatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#c1a57d] to-[#b39a6d] flex items-center justify-center text-white font-medium flex-shrink-0 shadow-md">
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
                        <h4 className="font-medium text-gray-800 truncate">
                          {patient.name}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {patient.email}
                        </p>
                      </div>
                      <button
                        onClick={() => addPatient(patient.id)}
                        className="px-4 py-2 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] hover:from-[#b39a6d] hover:to-[#a89267] text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowCreatePatient(false);
            setCreateError("");
            setNewPatientForm({ name: "", email: "", password: "" });
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Create New Patient
              </h2>
              <button
                onClick={() => {
                  setShowCreatePatient(false);
                  setCreateError("");
                  setNewPatientForm({ name: "", email: "", password: "" });
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={createNewPatient} className="px-6 pb-6">
              {createError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {createError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c1a57d]/50 focus:border-[#c1a57d] transition-all duration-200"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c1a57d]/50 focus:border-[#c1a57d] transition-all duration-200"
                    placeholder="patient@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c1a57d]/50 focus:border-[#c1a57d] transition-all duration-200"
                    placeholder="Min. 6 characters"
                  />
                  <p className="text-xs text-gray-500 mt-2">
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
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
                  disabled={creatingPatient}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] hover:from-[#b39a6d] hover:to-[#a89267] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            if (!sendingNotification) {
              setShowNotificationModal(false);
              setNotificationForm({ title: "", message: "" });
            }
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Send Notification
                </h2>
                <p className="text-sm text-gray-500 mt-1">to {selectedPatient?.name}</p>
              </div>
              <button
                onClick={() => {
                  if (!sendingNotification) {
                    setShowNotificationModal(false);
                    setNotificationForm({ title: "", message: "" });
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200"
                disabled={sendingNotification}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 pb-6">
              {!selectedPatient?.pushToken && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
                  This patient has not enabled push notifications yet. They will
                  need to open the app and allow notifications first.
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c1a57d]/50 focus:border-[#c1a57d] transition-all duration-200"
                    placeholder="e.g., Appointment Reminder"
                    disabled={sendingNotification}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c1a57d]/50 focus:border-[#c1a57d] transition-all duration-200 resize-none"
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
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
                  disabled={sendingNotification}
                >
                  Cancel
                </button>
                <button
                  onClick={sendNotification}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] hover:from-[#b39a6d] hover:to-[#a89267] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            if (!importingCSV) {
              setShowCSVImport(false);
              setCSVFile(null);
              setImportResults(null);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
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
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200"
                disabled={importingCSV}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 pb-6">
              {!importResults ? (
                <>
                  <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      CSV Format:
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Your CSV file should have 3 columns: name, email, password
                    </p>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-xs text-gray-700">
                      name,email,password
                      <br />
                      John Doe,john@example.com,password123
                      <br />
                      Jane Smith,jane@example.com,secure456
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCSVFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-[#c1a57d] file:to-[#b39a6d] file:text-white file:font-medium hover:file:from-[#b39a6d] hover:file:to-[#a89267] file:transition-all file:duration-200"
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
                      className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
                      disabled={importingCSV}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCSVImport}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] hover:from-[#b39a6d] hover:to-[#a89267] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!csvFile || importingCSV}
                    >
                      {importingCSV ? "Importing..." : "Import Patients"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-5">
                    <h3 className="font-semibold text-gray-800 mb-4">
                      Import Results
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-xl">
                        <span className="font-semibold text-green-800">
                          Successful
                        </span>
                        <span className="text-2xl font-bold text-green-800">
                          {importResults.success}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-red-50 border border-red-200 rounded-xl">
                        <span className="font-semibold text-red-800">
                          Failed
                        </span>
                        <span className="text-2xl font-bold text-red-800">
                          {importResults.failed}
                        </span>
                      </div>
                    </div>

                    {importResults.errors.length > 0 && (
                      <div className="mt-5 max-h-40 overflow-y-auto">
                        <h4 className="font-semibold text-gray-800 mb-3 text-sm">
                          Errors:
                        </h4>
                        <div className="space-y-2">
                          {importResults.errors.map((error, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg"
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
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-[#c1a57d] to-[#b39a6d] hover:from-[#b39a6d] hover:to-[#a89267] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
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
