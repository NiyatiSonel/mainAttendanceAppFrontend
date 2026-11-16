import React, { useEffect, useState } from 'react';
import API from '../api';

export default function ScheduleSession({ subjects, onBack }) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [timeLeft, setTimeLeft] = useState('');

  const checkStatus = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const [devRes, sesRes] = await Promise.all([
        API.get('/teacher/devices'),
        API.get('/teacher/sessions/active')
      ]);

      setDevices(devRes.data);
      setActiveSession(sesRes.data);
    } catch (err) {
      if (!silent) {
        setError(
          err.response?.data?.error ||
          'Failed to initialize session screen'
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Periodic polling & countdown timer when activeSession exists
  useEffect(() => {
    if (!activeSession) {
      setTimeLeft('');
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(activeSession.end_time).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('00:00 (Expired)');
        checkStatus(true);
        setMessage('Scheduled session time has expired. Attendance session concluded.');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          const mStr = String(minutes).padStart(2, '0');
          const sStr = String(seconds).padStart(2, '0');
          setTimeLeft(`${mStr}:${sStr}`);
        }
      }
    }, 1000);

    // Poll live session state and attendee count every 5s
    const pollInterval = setInterval(() => {
      checkStatus(true);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(pollInterval);
    };
  }, [activeSession?.session_ID, activeSession?.end_time]);

  const handleStartSession = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!selectedDevice) {
      alert('Please choose an attendance device.');
      return;
    }

    if (!startTime || !endTime) {
      alert('Please select both start and end date/time.');
      return;
    }

    const startTimestamp = new Date(startTime).getTime();
    const endTimestamp = new Date(endTime).getTime();

    if (endTimestamp <= startTimestamp) {
      alert('End date/time must be after start date/time.');
      return;
    }

    try {
      await API.post('/teacher/sessions/start', {
        device_id: selectedDevice,
        subject_id: selectedSubject || null,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString()
      });

      setMessage('Session successfully started.');
      checkStatus();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to start session'
      );
    }
  };

  const handleEndSession = async () => {
    if (
      !window.confirm(
        'Are you sure you want to conclude this session?'
      )
    ) {
      return;
    }

    try {
      await API.put(
        `/teacher/sessions/${activeSession.session_ID}/end`
      );

      setMessage('Session concluded.');
      setActiveSession(null);
      checkStatus();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Failed to end session'
      );
    }
  };

  if (loading) {
    return (
      <div className="schedule-loading">
        Loading session manager...
      </div>
    );
  }

  return (
    <div className="schedule-session-section">

      {/* Back button */}
      <button
        onClick={onBack}
        className="schedule-back-btn"
      >
        &larr; Back to Profile
      </button>

      {/* Page heading */}
      <h2 className="schedule-page-title">
        Instant Class Session
      </h2>

      {/* Messages */}
      {message && (
        <p className="schedule-success">
          {message}
        </p>
      )}

      {error && (
        <p className="schedule-error">
          {error}
        </p>
      )}

      {/* ACTIVE SESSION */}
      {activeSession ? (
        <div className="active-session-card">

          <h3>
            <span className="session-status-dot"></span>
            Class Session in Progress
          </h3>

          <div className="active-session-details">

            <p>
              <strong>Session ID:</strong>{' '}
              #{activeSession.session_ID}
            </p>

            <p>
              <strong>Assigned Device:</strong>{' '}
              {activeSession.mac_address ||
                `ID: ${activeSession.device_ID}`}
            </p>

            <p>
              <strong>Start Time:</strong>{' '}
              {new Date(
                activeSession.start_time
              ).toLocaleString()}
            </p>

            <p>
              <strong>Scheduled End Time:</strong>{' '}
              {activeSession.end_time
                ? new Date(activeSession.end_time).toLocaleString()
                : 'Not specified'}
            </p>

            <p>
              <strong>Time Remaining:</strong>{' '}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  background: timeLeft.includes('Expired') ? '#fee2e2' : '#eef2ff',
                  color: timeLeft.includes('Expired') ? '#dc2626' : '#4338ca',
                  border: timeLeft.includes('Expired') ? '1px solid #fca5a5' : '1px solid #c7d2fe'
                }}
              >
                ⏱ {timeLeft || 'Calculating...'}
              </span>
            </p>

            <p>
              <strong>Current Present Count:</strong>{' '}
              <span className="attendees-count-badge">{activeSession.attendeesCount || 0}</span>
            </p>

          </div>

          <button
            onClick={handleEndSession}
            className="end-session-btn"
          >
            End Attendance Session
          </button>

        </div>
      ) : (

        /* START SESSION FORM */
        <form
          onSubmit={handleStartSession}
          className="schedule-session-form"
        >

          <p className="schedule-description">
            Select your subject and room device to start
            capturing attendance.
          </p>

          {/* Subject */}
          <div className="schedule-form-group">

            <label>
              Subject:
            </label>

            <select
              value={selectedSubject}
              onChange={(e) =>
                setSelectedSubject(e.target.value)
              }
              required
            >
              <option value="">
                -- Choose Subject --
              </option>

              {subjects.map((sub) => (
                <option
                  key={sub.id}
                  value={sub.id}
                >
                  {sub.subject_name}
                </option>
              ))}
            </select>

          </div>

          {/* Start time */}
          <div className="schedule-form-group">

            <label>
              Start Date & Time:
            </label>

            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) =>
                setStartTime(e.target.value)
              }
              required
            />

          </div>

          {/* End time */}
          <div className="schedule-form-group">

            <label>
              End Date & Time:
            </label>

            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) =>
                setEndTime(e.target.value)
              }
              required
            />

          </div>

          {/* Device */}
          <div className="schedule-form-group">

            <label>
              Room Hardware Device (ESP32):
            </label>

            <select
              value={selectedDevice}
              onChange={(e) =>
                setSelectedDevice(e.target.value)
              }
              required
            >
              <option value="">
                -- Choose Hardware Scanner --
              </option>

              {devices.map((d) => (
                <option
                  key={d.id}
                  value={d.id}
                >
                  Device #{d.id} (MAC: {d.mac_address})
                </option>
              ))}
            </select>

          </div>

          {/* Start button */}
          <button
            type="submit"
            className="start-session-btn"
          >
            Start Session Now
          </button>

        </form>
      )}

    </div>
  );
}