'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Patient, Note, Doctor } from '@/lib/types';

export default function Dashboard() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientNotes, setPatientNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPatient, setShowAddPatient] = useState(false);

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
      const doctorDoc = await getDoc(doc(db, 'doctors', auth.currentUser.uid));
      if (doctorDoc.exists()) {
        const doctorData = { id: doctorDoc.id, ...doctorDoc.data() } as Doctor;
        setDoctor(doctorData);

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const patients: Patient[] = [];
        usersSnapshot.forEach((doc) => {
          patients.push({ id: doc.id, ...doc.data() } as Patient);
        });
        setAllPatients(patients);

        const myPts = patients.filter(p => doctorData.patients.includes(p.id));
        setMyPatients(myPts);
      }
    } catch (error) {
      console.error('Error loading doctor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientNotes = async (patientId: string) => {
    try {
      const notesQuery = query(
        collection(db, 'notes'),
        orderBy('createdAt', 'desc')
      );
      const notesSnapshot = await getDocs(notesQuery);
      const notes: Note[] = [];

      notesSnapshot.forEach((doc) => {
        const noteData = doc.data();
        if (noteData.userId === patientId) {
          notes.push({ id: doc.id, ...noteData } as Note);
        }
      });

      setPatientNotes(notes);
    } catch (error) {
      console.error('Error loading patient notes:', error);
    }
  };

  const addPatient = async (patientId: string) => {
    if (!doctor) return;

    try {
      await updateDoc(doc(db, 'doctors', doctor.id), {
        patients: arrayUnion(patientId)
      });

      const patient = allPatients.find(p => p.id === patientId);
      if (patient) {
        setMyPatients([...myPatients, patient]);
        setDoctor({ ...doctor, patients: [...doctor.patients, patientId] });
      }
      setShowAddPatient(false);
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  const removePatient = async (patientId: string) => {
    if (!doctor) return;

    try {
      await updateDoc(doc(db, 'doctors', doctor.id), {
        patients: arrayRemove(patientId)
      });

      setMyPatients(myPatients.filter(p => p.id !== patientId));
      setDoctor({ ...doctor, patients: doctor.patients.filter(id => id !== patientId) });

      if (selectedPatient?.id === patientId) {
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error('Error removing patient:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recent';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const availablePatients = allPatients.filter(
    p => !doctor?.patients.includes(p.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4] dark:bg-[#1a1a1a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c1a57d] mx-auto"></div>
          <p className="mt-4 text-[#888888] dark:text-[#a0a0a0]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#1a1a1a]">
      {/* Header */}
      <header className="bg-white dark:bg-[#2a2a2a] shadow-sm border-b border-[#e5e5e5] dark:border-[#3a3a3a]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#444444] dark:text-[#e0e0e0]">Doctor Portal</h1>
            <p className="text-sm text-[#888888] dark:text-[#a0a0a0]">Welcome, Dr. {doctor?.name}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 border-2 border-[#e5e5e5] dark:border-[#3a3a3a] rounded-lg text-[#444444] dark:text-[#e0e0e0] font-semibold hover:bg-[#f4f4f4] dark:hover:bg-[#1a1a1a] transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patients List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm overflow-hidden border border-[#e5e5e5] dark:border-[#3a3a3a]">
              <div className="p-6 border-b border-[#e5e5e5] dark:border-[#3a3a3a] flex justify-between items-center">
                <h2 className="text-lg font-bold text-[#444444] dark:text-[#e0e0e0]">
                  My Patients ({myPatients.length})
                </h2>
                <button
                  onClick={() => setShowAddPatient(true)}
                  className="px-4 py-2 bg-[#c1a57d] hover:bg-[#a89267] text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition"
                >
                  + Add
                </button>
              </div>

              {myPatients.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[#888888] dark:text-[#a0a0a0]">No patients yet</p>
                  <p className="text-sm text-[#888888] dark:text-[#a0a0a0] mt-2">
                    Add patients to start monitoring
                  </p>
                </div>
              ) : (
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                  {myPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 border-b border-[#e5e5e5] dark:border-[#3a3a3a] cursor-pointer hover:bg-[#f4f4f4] dark:hover:bg-[#1a1a1a] transition ${
                        selectedPatient?.id === patient.id ? 'bg-[#f4f4f4] dark:bg-[#1a1a1a] border-l-4 border-l-[#c1a57d]' : ''
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
                          <h3 className="font-semibold text-[#444444] dark:text-[#e0e0e0] truncate">
                            {patient.name}
                          </h3>
                          <p className="text-sm text-[#888888] dark:text-[#a0a0a0] truncate">
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
            <div className="bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm p-6 border border-[#e5e5e5] dark:border-[#3a3a3a]">
              {selectedPatient ? (
                <>
                  <div className="flex items-center gap-4 pb-6 border-b border-[#e5e5e5] dark:border-[#3a3a3a] mb-6">
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
                    <div>
                      <h2 className="text-2xl font-bold text-[#444444] dark:text-[#e0e0e0]">
                        {selectedPatient.name}
                      </h2>
                      <p className="text-[#888888] dark:text-[#a0a0a0]">{selectedPatient.email}</p>
                      <p className="text-sm text-[#888888] dark:text-[#a0a0a0] mt-1">
                        Patient since {formatDate(selectedPatient.createdAt)}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#444444] dark:text-[#e0e0e0] mb-4">
                    Journal Entries ({patientNotes.length})
                  </h3>

                  {patientNotes.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-[#888888] dark:text-[#a0a0a0]">No journal entries yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                      {patientNotes.map((note) => (
                        <div
                          key={note.id}
                          className="bg-[#f4f4f4] dark:bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-[#c1a57d]"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-[#888888] dark:text-[#a0a0a0]">
                              {formatDate(note.createdAt)}
                            </span>
                            {note.mood && (
                              <span className="px-3 py-1 bg-[#c1a57d] text-white text-xs font-semibold rounded-full">
                                {note.mood}
                              </span>
                            )}
                          </div>
                          <p className="text-[#444444] dark:text-[#e0e0e0] leading-relaxed">
                            {note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-xl font-semibold text-[#444444] dark:text-[#e0e0e0]">
                    Select a patient
                  </h3>
                  <p className="text-[#888888] dark:text-[#a0a0a0] mt-2">
                    Choose a patient from the left to view their journal entries
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowAddPatient(false)}
        >
          <div
            className="bg-white dark:bg-[#2a2a2a] rounded-xl max-w-md w-full max-h-[80vh] flex flex-col border border-[#e5e5e5] dark:border-[#3a3a3a]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[#e5e5e5] dark:border-[#3a3a3a] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#444444] dark:text-[#e0e0e0]">Add Patient</h2>
              <button
                onClick={() => setShowAddPatient(false)}
                className="text-[#888888] dark:text-[#a0a0a0] hover:text-[#444444] dark:hover:text-[#e0e0e0] text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {availablePatients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#888888] dark:text-[#a0a0a0]">No available patients</p>
                  <p className="text-sm text-[#888888] dark:text-[#a0a0a0] mt-2">
                    All users are in your patient list
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availablePatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center gap-3 p-3 border-2 border-[#e5e5e5] dark:border-[#3a3a3a] rounded-lg hover:border-[#c1a57d] transition"
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
                        <h4 className="font-semibold text-[#444444] dark:text-[#e0e0e0] truncate">
                          {patient.name}
                        </h4>
                        <p className="text-sm text-[#888888] dark:text-[#a0a0a0] truncate">
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
    </div>
  );
}
