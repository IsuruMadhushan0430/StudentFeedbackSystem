import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { studentAPI } from '../services/api';

const feedbackQuestions = [
  'Lecturer knowledge of subject',
  'Clarity of explanations',
  'Teaching methods',
  'Communication skills',
  'Student engagement',
  'Course organization',
  'Use of learning materials',
  'Responsiveness to questions',
  'Practical examples',
  'Overall teaching effectiveness',
];

const StudentDashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [ratings, setRatings] = useState(new Array(10).fill(5)); // Default to 5 stars
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [semesterDates, setSemesterDates] = useState(null);
  const [submittedFeedback, setSubmittedFeedback] = useState([]);
  const [expandedFeedback, setExpandedFeedback] = useState({});
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const formatDate = (date) => new Date(date).toLocaleDateString();

  const sortSubjects = (items = []) => {
    return [...items].sort((a, b) => {
      const semCmp = (a.semester || '').localeCompare(b.semester || '');
      if (semCmp !== 0) return semCmp;
      return (a.name || '').localeCompare(b.name || '');
    });
  };

  useEffect(() => {
    fetchSubjects();
    fetchMyFeedback();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await studentAPI.getSubjects();
      setSubjects(sortSubjects(res.data.subjects || []));
      setSemesterDates(res.data.semesterDates || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyFeedback = async () => {
    try {
      const res = await studentAPI.getMyFeedback();
      setSubmittedFeedback(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedFeedback((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getFeedbackWindow = () => {
    if (!semesterDates?.endDate) return null;
    const end = new Date(semesterDates.endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - 14); // last two weeks
    const now = new Date();
    return {
      start,
      end,
      isOpen: now >= start && now <= end,
    };
  };

  const getTimeline = () => {
    if (!semesterDates?.startDate || !semesterDates?.endDate) return null;
    const start = new Date(semesterDates.startDate);
    const end = new Date(semesterDates.endDate);
    const feedbackStart = new Date(end);
    feedbackStart.setDate(feedbackStart.getDate() - 14);

    const total = Math.max(end - start, 1);
    const clamp = (val) => Math.min(100, Math.max(0, val));
    const progress = clamp(((Date.now() - start) / total) * 100);

    return {
      start,
      end,
      feedbackStart,
      progress,
      feedbackStartPct: clamp(((feedbackStart - start) / total) * 100),
    };
  };

  const handleRatingChange = (index, value) => {
    const newRatings = [...ratings];
    newRatings[index] = value;
    setRatings(newRatings);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    const windowInfo = getFeedbackWindow();
    if (!windowInfo?.isOpen) {
      alert('Feedback window is closed. You can only submit during the final two weeks of the semester.');
      return;
    }
    try {
      await studentAPI.submitFeedback({
        subjectId: selectedSubject._id,
        lecturerId: selectedSubject.lecturerId._id,
        ratings,
        comment,
      });
      alert('Thank you for your feedback!');
      setSubjects((prev) => prev.map((s) => s._id === selectedSubject._id ? { ...s, alreadySubmitted: true } : s));
      fetchMyFeedback();
      setSelectedSubject(null);
      setComment('');
      setRatings(new Array(10).fill(5));
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting feedback');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const timeline = getTimeline();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600" aria-hidden="true"></div>
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 35%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.2), transparent 30%)' }} aria-hidden="true"></div>
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-white">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">Student Dashboard</p>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Welcome back, {user?.name}</h1>
              <p className="text-sm md:text-base text-white/80">Track your subjects and share feedback during the open window.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 rounded-full bg-white/15 border border-white/20 text-sm font-semibold">Role: Student</span>
              <button
                onClick={logout}
                className="bg-white text-gray-900 px-5 py-2 rounded-2xl font-semibold shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-2 h-8 bg-blue-500 rounded-full mr-3"></span>
            Your Enrolled Subjects
          </h2>

          {semesterDates?.endDate && (
            <div className="mb-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-900">
              <p className="font-semibold">Feedback window</p>
              <p>
                Opens: {new Date(new Date(semesterDates.endDate).setDate(new Date(semesterDates.endDate).getDate() - 14)).toLocaleDateString()} ·
                Closes: {new Date(semesterDates.endDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {!semesterDates?.endDate && (
            <div className="mb-4 bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800">
              <p className="font-semibold">Feedback dates not set</p>
              <p>Semester dates are not configured yet; feedback will open during the final two weeks once dates are added.</p>
            </div>
          )}
          
          {subjects.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-700">No subjects found for your current semester.</h3>
              <p className="text-gray-500 mt-2">If you think this is a mistake, please contact your department administrator.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => {
                const isSubmitted = subject.alreadySubmitted;
                const windowInfo = getFeedbackWindow();
                const isOpen = windowInfo?.isOpen;
                const hasLecturer = !!subject.lecturerId;
                const disabled = isSubmitted || !isOpen || !hasLecturer;
                const outlineColor = isSubmitted ? 'border-green-200' : isOpen ? 'border-blue-300' : 'border-gray-200';
                const bgTint = isSubmitted ? 'bg-green-50' : isOpen ? 'bg-blue-50' : 'bg-gray-50';
                const badgeColor = isSubmitted ? 'text-green-700 bg-green-50 border border-green-200' : 'text-blue-600 bg-blue-50 border border-blue-100';

                return (
                  <div
                    key={subject._id}
                    className={`${bgTint} p-6 rounded-2xl shadow-sm border-2 ${outlineColor} hover:shadow-md transition-all duration-300`}
                  >
                    <div className="mb-4">
                      <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-2 ${badgeColor}`}>
                        <span className="h-2 w-2 rounded-full bg-current opacity-60"></span>
                        {subject.semester}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{subject.name}</h3>
                    <div className="flex items-center text-gray-600 mb-6">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                         👤
                      </div>
                      <span className="text-sm font-medium">
                        {subject.lecturerId?.userId?.name || 'Lecturer not assigned'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (disabled) return;
                        setSelectedSubject(subject);
                      }}
                      disabled={disabled}
                      className={`w-full font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center border ${
                        isSubmitted
                          ? 'bg-green-50 text-green-700 border-green-200 cursor-not-allowed'
                          : isOpen && hasLecturer
                            ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                            : 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {isSubmitted ? 'Feedback submitted' : !hasLecturer ? 'Assign lecturer first' : isOpen ? 'Submit Feedback' : 'Feedback closed'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-2 h-8 bg-emerald-500 rounded-full mr-3"></span>
            Your Submitted Feedback
          </h2>

          {submittedFeedback.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-600">
              You have not submitted any feedback yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submittedFeedback.map((fb) => {
                const avg = fb.ratings?.length ? (fb.ratings.reduce((a, b) => a + b, 0) / fb.ratings.length).toFixed(1) : '—';
                const isExpanded = !!expandedFeedback[fb._id];
                return (
                  <div key={fb._id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{fb.subjectId?.name || 'Subject'}</h3>
                        <p className="text-xs text-gray-500">Lecturer: {fb.lecturerId?.userId?.name || 'N/A'}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">{fb.subjectId?.semester || 'Semester'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">Avg {avg}/5</span>
                      <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold">{fb.ratings?.length || 0} questions</span>
                      <span className="text-xs text-gray-400">Submitted {new Date(fb.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-700 mb-3">
                      {fb.ratings?.slice(0,4).map((r, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-100">Q{idx+1}: {r}/5</span>
                      ))}
                      {fb.ratings?.length > 4 && (
                        <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600">+{fb.ratings.length - 4} more scores</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpanded(fb._id)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700 mb-3"
                    >
                      {isExpanded ? 'Hide full responses' : 'View all questions'}
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 mb-3 text-sm text-gray-700">
                        {feedbackQuestions.map((q, idx) => (
                          <div key={idx} className="flex justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                            <span className="font-medium text-gray-800">{q}</span>
                            <span className="font-bold text-blue-600">{fb.ratings?.[idx] ?? '—'}/5</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {fb.comment && (
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm text-gray-700 leading-relaxed">
                        “{fb.comment}”
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedSubject && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
                <h3 className="text-2xl font-bold text-gray-800">Feedback: {selectedSubject.name}</h3>
                <button 
                  onClick={() => setSelectedSubject(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-8">
                <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-blue-800 text-sm leading-relaxed">
                    <strong>Note:</strong> Your feedback is strictly anonymous. The lecturer only sees the aggregated scores and comments.
                  </p>
                </div>

                {timeline && (
                  <div className="mb-10 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-4 text-sm text-gray-700 font-semibold">
                      <span>Semester starts: {formatDate(timeline.start)}</span>
                      <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Feedback window: {formatDate(timeline.feedbackStart)} - {formatDate(timeline.end)}</span>
                      <span>Ends: {formatDate(timeline.end)}</span>
                    </div>

                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div
                        className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full"
                        style={{ width: `${timeline.progress}%` }}
                        aria-hidden="true"
                      ></div>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-[2px] h-4 bg-emerald-500"
                        style={{ left: `${timeline.feedbackStartPct}%` }}
                        title="Feedback window opens"
                      ></div>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-[2px] h-4 bg-rose-500"
                        style={{ right: 0 }}
                        title="Semester ends"
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-semibold">Now: {timeline.progress.toFixed(0)}% through the semester</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-indigo-500 rounded-full"></span> Progress</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-emerald-500"></span> Feedback opens</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-rose-500"></span> Semester end</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center">
                    <span className="w-1.5 h-4 bg-blue-500 rounded-full mr-2"></span>
                    Rating scale reference
                  </h4>
                  <div className="flex flex-wrap justify-between gap-4">
                    {[
                      { val: 1, label: 'Poor', color: 'text-red-500' },
                      { val: 2, label: 'Fair', color: 'text-orange-500' },
                      { val: 3, label: 'Good', color: 'text-yellow-500' },
                      { val: 4, label: 'Very Good', color: 'text-green-500' },
                      { val: 5, label: 'Excellent', color: 'text-emerald-500' }
                    ].map(item => (
                      <div key={item.val} className="flex flex-col items-center flex-1 min-w-[70px]">
                        <div className={`flex mb-2 ${item.color}`}>
                          {[...Array(item.val)].map((_, i) => (
                            <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-gray-700 uppercase tracking-tighter">{item.label}</span>
                        <span className="text-[10px] font-bold text-gray-400">Level {item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmitFeedback}>
                  <div className="space-y-6">
                    {feedbackQuestions.map((question, index) => (
                      <div key={index} className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-50 pb-4">
                        <label className="text-gray-700 font-medium md:max-w-xs">{question}</label>
                        <div className="flex gap-1 mt-2 md:mt-0">
                          {[1,2,3,4,5].map(r => {
                            const colors = {
                              1: 'text-red-500',
                              2: 'text-orange-500',
                              3: 'text-yellow-500',
                              4: 'text-green-500',
                              5: 'text-emerald-500'
                            };
                            const isActive = ratings[index] >= r;
                            const isExact = ratings[index] === r;
                            
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => handleRatingChange(index, r)}
                                className={`group relative p-1 transition-all duration-200 transform hover:scale-125 ${isExact ? 'scale-110' : ''}`}
                                title={`${r} Star${r > 1 ? 's' : ''}`}
                              >
                                <svg 
                                  className={`w-10 h-10 transition-colors duration-200 ${
                                    isActive ? colors[ratings[index]] : 'text-gray-200'
                                  }`} 
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {isExact && (
                                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {r} star{r > 1 ? 's' : ''}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10">
                    <label className="block text-gray-700 font-bold mb-3">Additional Comments (Optional)</label>
                    <textarea
                      placeholder="Share your thoughts about this subject and lecturer..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all duration-200"
                      rows="4"
                    />
                  </div>

                  <div className="mt-8 flex gap-4 sticky bottom-0 bg-white pt-4 pb-2 border-t">
                    <button 
                      type="submit" 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Submit Evaluation
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSelectedSubject(null)} 
                      className="px-8 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-xl transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;