import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { isMockMode } from '../firebase/mockDb';
import { updateUserProfile } from '../firebase/dbService';
import { 
  FolderLock, 
  UploadCloud, 
  FileText, 
  Image, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Loader
} from 'lucide-react';

export const Vault: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const { setPageTitle } = useOutletContext<{ setPageTitle: (t: string) => void }>();

  // Upload progress
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Vault mock documents listing
  const [documents, setDocuments] = useState<{ name: string, type: string, size: string, url: string }[]>([]);

  useEffect(() => {
    setPageTitle('Document Vault');
    if (currentUser) {
      // Mock documents initially loaded from user's public info or mock directories
      const docs = [
        { name: 'Passport_Photo.png', type: 'Profile Picture', size: '145 KB', url: currentUser.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
        ...(currentUser.documents?.nationalId ? [{ name: 'National_ID.pdf', type: 'National ID', size: '1.2 MB', url: currentUser.documents.nationalId }] : []),
        ...(currentUser.documents?.birthCertificate ? [{ name: 'Baptismal_Certificate.pdf', type: 'Certificate', size: '890 KB', url: currentUser.documents.birthCertificate }] : []),
        ...(currentUser.documents?.medicalInfo ? [{ name: 'Medical_Report.pdf', type: 'Medical Document', size: '2.1 MB', url: currentUser.documents.medicalInfo }] : []),
      ];
      setDocuments(docs);
    }
  }, [setPageTitle, currentUser]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: 'nationalId' | 'birthCertificate' | 'medicalInfo' | 'photoURL') => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setUploading(true);
    setProgress(10);

    // Size check
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size must be less than 5MB.');
      setUploading(false);
      return;
    }

    if (isMockMode) {
      // Simulate file upload progress in Mock Mode
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            completeMockUpload(file, category);
            return 100;
          }
          return prev + 20;
        });
      }, 300);
      return;
    }

    // Real Firebase Storage Upload
    try {
      const storagePath = `users/${currentUser.uid}/${category}_${Date.now()}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const percentage = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(percentage);
        }, 
        (err) => {
          console.error(err);
          setErrorMsg(err.message || 'Firebase storage upload failed.');
          setUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await saveDocUrlToFirestore(category, downloadURL, file.name);
        }
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Upload process failed.');
      setUploading(false);
    }
  };

  const completeMockUpload = async (file: File, category: 'nationalId' | 'birthCertificate' | 'medicalInfo' | 'photoURL') => {
    const fakeUrl = URL.createObjectURL(file);
    await saveDocUrlToFirestore(category, fakeUrl, file.name);
  };

  const saveDocUrlToFirestore = async (category: string, url: string, fileName: string) => {
    if (!currentUser) return;
    try {
      if (category === 'photoURL') {
        await updateProfile({ photoURL: url });
      } else {
        const docs = currentUser.documents || {};
        await updateProfile({
          documents: {
            ...docs,
            [category]: url
          }
        });
      }

      const categoryLabels: { [key: string]: string } = {
        nationalId: 'National ID',
        birthCertificate: 'Certificate',
        medicalInfo: 'Medical Document',
        photoURL: 'Profile Picture'
      };

      setDocuments([
        ...documents.filter(d => d.type !== categoryLabels[category]),
        {
          name: fileName,
          type: categoryLabels[category],
          size: 'Simulated File Size',
          url
        }
      ]);

      setSuccessMsg(`${categoryLabels[category]} successfully uploaded!`);
    } catch (err: any) {
      setErrorMsg('Failed to update user profile reference.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteDocument = async (categoryLabel: string, keyName: string) => {
    if (!currentUser || !window.confirm(`Are you sure you want to delete your ${categoryLabel}?`)) return;
    
    try {
      if (keyName === 'photoURL') {
        await updateProfile({ photoURL: '' });
      } else {
        const docs = { ...currentUser.documents };
        delete (docs as any)[keyName];
        await updateProfile({ documents: docs });
      }
      setDocuments(documents.filter(d => d.type !== categoryLabel));
      setSuccessMsg(`${categoryLabel} removed successfully.`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Banner info */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex items-start gap-4">
        <div className="rounded-xl bg-church-gold-100 dark:bg-church-gold-950/20 p-3 text-church-gold-600 shrink-0">
          <FolderLock className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Document Vault</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Upload essential identification, baptismal certificates, and medical information here. Documents are saved securely in encrypted Firebase Cloud Storage and accessible only by you and the church administrators.
          </p>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-semibold text-red-600 dark:text-red-400">
          <AlertCircle className="h-4.5 w-4.5" />
          <p>{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-4.5 w-4.5" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Uploading Progress */}
      {uploading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 text-center space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Uploading File...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-church-gold-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {/* Upload grid section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Picture Upload card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 text-center shadow-sm flex flex-col items-center">
          <Image className="h-8 w-8 text-church-navy-500 mb-3" />
          <h5 className="text-xs font-bold text-slate-850 dark:text-white uppercase mb-1">Profile Picture</h5>
          <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">Required for membership digital identity cards. Max 5MB.</p>
          <label className="cursor-pointer rounded-xl bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 text-xs font-bold px-4 py-2 hover:opacity-90 inline-flex items-center gap-1">
            <UploadCloud className="h-4 w-4" />
            Upload Photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photoURL')} />
          </label>
        </div>

        {/* National ID card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 text-center shadow-sm flex flex-col items-center">
          <FileText className="h-8 w-8 text-church-navy-500 mb-3" />
          <h5 className="text-xs font-bold text-slate-850 dark:text-white uppercase mb-1">National ID Document</h5>
          <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">For verification of date of birth and identity details. Max 5MB.</p>
          <label className="cursor-pointer rounded-xl bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 text-xs font-bold px-4 py-2 hover:opacity-90 inline-flex items-center gap-1">
            <UploadCloud className="h-4 w-4" />
            Upload PDF / Image
            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'nationalId')} />
          </label>
        </div>

        {/* Medical Document card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 text-center shadow-sm flex flex-col items-center">
          <FileText className="h-8 w-8 text-church-navy-500 mb-3" />
          <h5 className="text-xs font-bold text-slate-850 dark:text-white uppercase mb-1">Medical Records</h5>
          <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">Essential medical notes in case of emergency at camp. Max 5MB.</p>
          <label className="cursor-pointer rounded-xl bg-church-navy-950 text-white dark:bg-church-gold-500 dark:text-church-navy-950 text-xs font-bold px-4 py-2 hover:opacity-90 inline-flex items-center gap-1">
            <UploadCloud className="h-4 w-4" />
            Upload Document
            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'medicalInfo')} />
          </label>
        </div>

      </div>

      {/* Uploaded Documents List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">My Vault Documents</h4>
        
        <div className="space-y-3">
          {documents.map((doc) => {
            let fileKey = '';
            if (doc.type === 'National ID') fileKey = 'nationalId';
            else if (doc.type === 'Certificate') fileKey = 'birthCertificate';
            else if (doc.type === 'Medical Document') fileKey = 'medicalInfo';
            else if (doc.type === 'Profile Picture') fileKey = 'photoURL';

            return (
              <div key={doc.type} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 p-2 text-church-gold-500 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white">{doc.name}</h5>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">{doc.type} • {doc.size}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="rounded-lg p-2 text-slate-450 hover:bg-slate-200/50 dark:hover:bg-slate-800 text-xs font-bold inline-flex items-center gap-1 hover:text-slate-950"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </a>
                  <button
                    onClick={() => deleteDocument(doc.type, fileKey)}
                    className="rounded-lg p-2 text-slate-450 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {documents.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6">No documents uploaded in vault yet.</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default Vault;
