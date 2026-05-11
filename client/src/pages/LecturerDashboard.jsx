import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { lecturerAPI } from '../services/api';

const LecturerDashboard = () => {
  const [reports, setReports] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [newFeedbackMap, setNewFeedbackMap] = useState({});
  const [loading, setLoading] = useState(true);
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [reportRes, subjectRes] = await Promise.all([
        lecturerAPI.getReport(),
        lecturerAPI.getSubjects()
      ]);
      setReports(reportRes.data);
      hydrateNewFeedbackFlags(reportRes.data);
      setSubjects(subjectRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const hydrateNewFeedbackFlags = (reportsData) => {
    if (!Array.isArray(reportsData)) return;
    const stored = JSON.parse(localStorage.getItem('lecturerFeedbackCounts') || '{}');
    const isFirstSync = Object.keys(stored).length === 0;
    const flags = {};

    reportsData.forEach((r) => {
      const id = r?.subjectId?.toString();
      if (!id) return;
      const previous = stored[id] ?? 0;
      if (!isFirstSync && r.totalFeedbacks > previous) {
        flags[id] = true;
      }
      stored[id] = r.totalFeedbacks;
    });

    localStorage.setItem('lecturerFeedbackCounts', JSON.stringify(stored));
    setNewFeedbackMap(flags);
  };

  const getSubjectReport = (subjectId) => reports.find((r) => r.subjectId?.toString() === subjectId);

  const handleSubjectSelect = (subjectId) => {
    setSelectedSubjectId(subjectId);

    if (newFeedbackMap[subjectId]) {
      setNewFeedbackMap((prev) => {
        const updated = { ...prev };
        delete updated[subjectId];
        return updated;
      });

      const stored = JSON.parse(localStorage.getItem('lecturerFeedbackCounts') || '{}');
      const report = getSubjectReport(subjectId);
      if (report) {
        stored[subjectId] = report.totalFeedbacks;
        localStorage.setItem('lecturerFeedbackCounts', JSON.stringify(stored));
      }
    }
  };

  const getRatingColor = (avg) => {
    if (avg >= 4.5) return 'text-emerald-500';
    if (avg >= 4.0) return 'text-green-500';
    if (avg >= 3.0) return 'text-yellow-500';
    if (avg >= 2.0) return 'text-orange-500';
    return 'text-red-500';
  };

  const getProgressBarColor = (avg) => {
    if (avg >= 4.5) return 'bg-emerald-500';
    if (avg >= 4.0) return 'bg-green-500';
    if (avg >= 3.0) return 'bg-yellow-500';
    if (avg >= 2.0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const orderedSubjects = [...subjects]
    .sort((a, b) => {
      const semesterCompare = (a.semester || '').localeCompare(b.semester || '');
      if (semesterCompare !== 0) return semesterCompare;
      return (a.name || '').localeCompare(b.name || '');
    });

  const visibleSubjects = selectedSubjectId
    ? orderedSubjects.filter((s) => s._id === selectedSubjectId)
    : orderedSubjects;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const selectedReport = getSubjectReport(selectedSubjectId);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500" aria-hidden="true"></div>
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 15% 25%, rgba(255,255,255,0.25), transparent 35%), radial-gradient(circle at 85% 10%, rgba(255,255,255,0.2), transparent 30%)' }} aria-hidden="true"></div>
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-white">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">Lecturer Insights</p>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Performance Overview</h1>
              <p className="text-sm md:text-base text-white/80">Hello, {user?.name}. Review subject analytics and student feedback.</p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {selectedSubjectId && (
                <button
                  onClick={() => setSelectedSubjectId(null)}
                  className="bg-white/15 border border-white/25 text-white px-5 py-2 rounded-2xl font-semibold hover:bg-white/25 transition-all duration-200"
                >
                  Show All Subjects
                </button>
              )}
              {user?.role === 'hod' && (
                <button
                  onClick={() => navigate('/hod')}
                  className="bg-white/15 border border-white/25 text-white px-5 py-2 rounded-2xl font-semibold hover:bg-white/25 transition-all duration-200"
                >
                  HOD dashboard
                </button>
              )}
              <span className="px-4 py-2 rounded-full bg-white/15 border border-white/20 text-sm font-semibold">Role: Lecturer</span>
              <button
                onClick={logout}
                className="bg-white text-gray-900 px-5 py-2 rounded-2xl font-semibold shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-2 h-8 bg-blue-500 rounded-full mr-3"></span>
            My Assigned Subjects
          </h2>

          <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold mb-4">
            <span className="px-3 py-1 rounded-full bg-white border border-gray-200">Subjects: {subjects.length}</span>
            <span className="px-3 py-1 rounded-full bg-white border border-gray-200">Feedback windows: per subject</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleSubjects.map((subject) => {
              const report = getSubjectReport(subject._id);
              const avg = report?.overallAverage ?? null;
              const total = report?.totalFeedbacks ?? 0;
              const hasNew = !!newFeedbackMap[subject._id];

              return (
              <div 
                key={subject._id} 
                onClick={() => handleSubjectSelect(subject._id)}
                className={`cursor-pointer p-5 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                  selectedSubjectId === subject._id 
                    ? 'bg-blue-600 text-white shadow-xl ring-4 ring-blue-100' 
                    : 'bg-white shadow-sm border border-gray-100 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-3 inline-block ${
                    selectedSubjectId === subject._id ? 'bg-blue-500 text-white border border-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {subject.semester}
                  </span>
                  {hasNew && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-amber-100 text-amber-700 border border-amber-200">
                      New feedback
                    </span>
                  )}
                </div>
                  <h3 className={`text-lg font-bold leading-tight mb-2 ${selectedSubjectId === subject._id ? 'text-white' : 'text-gray-800'}`}>
                    {subject.name}
                  </h3>
                  <p className={`text-xs font-medium ${selectedSubjectId === subject._id ? 'text-blue-100' : 'text-gray-400'}`}>
                    {subject.department?.name}
                  </p>

                <div className={`mt-4 grid grid-cols-2 gap-2 text-xs font-bold ${selectedSubjectId === subject._id ? 'text-blue-50' : 'text-gray-500'}`}>
                  <div className={`${selectedSubjectId === subject._id ? 'bg-white/10 border-white/20 text-blue-50' : 'bg-gray-50 border-gray-100 text-gray-700'} rounded-lg px-3 py-2 border flex items-center justify-between`}>
                    <span>Feedback</span>
                    <span className="text-base font-black">{total}</span>
                  </div>
                  <div className={`${selectedSubjectId === subject._id ? 'bg-white/10 border-white/20 text-blue-50' : 'bg-gray-50 border-gray-100 text-gray-700'} rounded-lg px-3 py-2 border flex items-center justify-between`}>
                    <span>Avg</span>
                    <span className={`text-base font-black ${avg ? getRatingColor(avg) : ''}`}>
                      {avg ? avg.toFixed(1) : '—'}
                    </span>
                  </div>
                </div>
                <div className={`mt-4 pt-4 border-t ${selectedSubjectId === subject._id ? 'border-white/25 text-blue-100' : 'border-gray-50 text-gray-400'} flex items-center text-[10px] font-bold uppercase tracking-tighter`}>
                   📊 Click for detailed report
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {selectedSubjectId ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="w-2 h-8 bg-purple-500 rounded-full mr-3"></span>
              Analysis for {subjects.find(s => s._id === selectedSubjectId)?.name}
            </h2>
            
            {!selectedReport || selectedReport.totalFeedbacks === 0 ? (
              <div className="bg-white p-16 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="text-5xl mb-4">⏳</div>
                <h3 className="text-xl font-semibold text-gray-700">Awaiting evaluations...</h3>
                <p className="text-gray-500 mt-2 italic">Students have not yet submitted feedback for this specific subject.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-50 bg-gray-50/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-50 px-3 py-1 rounded-full mb-2 inline-block">
                        Metric Analysis
                      </span>
                      <h3 className="text-2xl font-bold text-gray-800">{selectedReport.subject}</h3>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase">Participants</p>
                        <p className="text-2xl font-black text-gray-800">{selectedReport.totalFeedbacks}</p>
                      </div>
                      <div className="h-10 w-px bg-gray-200"></div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase">Avg Score</p>
                        <p className={`text-2xl font-black ${getRatingColor(selectedReport.overallAverage)}`}>
                          {selectedReport.overallAverage.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full mr-3"></span>
                        Metric Breakdown
                      </h4>
                      <div className="space-y-6">
                        {['Knowledge of subject', 'Clarity of explanations', 'Teaching methods', 'Communication skills', 'Student engagement', 'Course organization', 'Learning materials', 'Responsiveness', 'Practical examples', 'Overall effectiveness'].map((label, i) => {
                          const rating = selectedReport.averageRatings[i] ?? 0;
                          return (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600 font-medium">{label}</span>
                              <span className={`font-bold ${getRatingColor(rating)}`}>
                                {rating.toFixed(1)} / 5.0
                              </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${getProgressBarColor(rating)}`}
                                style={{ width: `${(rating / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                        <span className="w-1.5 h-6 bg-purple-500 rounded-full mr-3"></span>
                        Student Comments
                      </h4>
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedReport.comments.filter(c => c && c.trim()).length > 0 ? (
                          selectedReport.comments.filter(c => c && c.trim()).map((comment, i) => (
                            <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative group">
                              <span className="text-3xl text-gray-200 absolute top-2 right-4 opacity-50 group-hover:opacity-100 transition-opacity font-serif">"</span>
                              <p className="text-gray-700 italic text-sm leading-relaxed relative z-10">
                                {comment}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 italic text-center py-12">No qualifying comments provided yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-gray-100 text-center">
             <div className="text-6xl mb-6 grayscale opacity-30">📂</div>
             <h3 className="text-2xl font-bold text-gray-400">Select a subject to view performance analytics</h3>
             <p className="text-gray-400 mt-2 max-w-sm mx-auto italic">Click on any subject card above to dive into detailed student feedback and metric breakdowns.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerDashboard;