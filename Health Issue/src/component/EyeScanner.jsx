import React, { useState, useRef, useEffect } from 'react';
import './EyeScanner.css';

const EyeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState(null);
  const [selectedEye, setSelectedEye] = useState('both');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Simulated eye health data
  const generateScanResults = () => {
    const baseResults = {
      timestamp: new Date(),
      overallHealth: Math.random() > 0.3 ? 'Good' : 'Concerning',
      leftEye: {
        visualAcuity: (0.8 + Math.random() * 0.4).toFixed(1),
        intraocularPressure: (12 + Math.random() * 8).toFixed(1),
        opticDiscSwelling: Math.random() > 0.7 ? 'Detected' : 'Normal',
        retinalThickness: (250 + Math.random() * 100).toFixed(0),
        bloodVesselChanges: Math.random() > 0.6 ? 'Present' : 'Normal'
      },
      rightEye: {
        visualAcuity: (0.8 + Math.random() * 0.4).toFixed(1),
        intraocularPressure: (12 + Math.random() * 8).toFixed(1),
        opticDiscSwelling: Math.random() > 0.7 ? 'Detected' : 'Normal',
        retinalThickness: (250 + Math.random() * 100).toFixed(0),
        bloodVesselChanges: Math.random() > 0.6 ? 'Present' : 'Normal'
      },
      sansRisk: Math.random() > 0.5 ? 'Low' : 'Moderate',
      recommendations: []
    };

    // Generate recommendations based on results
    if (baseResults.leftEye.opticDiscSwelling === 'Detected' || baseResults.rightEye.opticDiscSwelling === 'Detected') {
      baseResults.recommendations.push('Immediate consultation with flight surgeon required');
      baseResults.overallHealth = 'Concerning';
    }
    
    if (parseFloat(baseResults.leftEye.intraocularPressure) > 18 || parseFloat(baseResults.rightEye.intraocularPressure) > 18) {
      baseResults.recommendations.push('Monitor intraocular pressure closely');
    }
    
    if (baseResults.sansRisk === 'Moderate') {
      baseResults.recommendations.push('Implement SANS countermeasures protocol');
      baseResults.recommendations.push('Schedule follow-up scan in 48 hours');
    }

    if (baseResults.recommendations.length === 0) {
      baseResults.recommendations.push('Continue routine eye health monitoring');
      baseResults.recommendations.push('Maintain proper lighting during work');
    }

    return baseResults;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Camera access required for eye scanning. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const startScan = async () => {
    if (!cameraActive) {
      await startCamera();
      setTimeout(() => performScan(), 1000);
    } else {
      performScan();
    }
  };

  const performScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanResults(null);

    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScanResults(generateScanResults());
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const captureRetinalImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Apply retinal imaging filter effect
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Enhance red channel for retinal visualization
        data[i] = Math.min(255, data[i] * 1.5);     // Red
        data[i + 1] = data[i + 1] * 0.7;            // Green
        data[i + 2] = data[i + 2] * 0.3;            // Blue
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return '#00ff88';
      case 'Moderate': return '#ffaa00';
      case 'High': return '#ff6b6b';
      default: return '#f1f1f1';
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'Good': return '#00ff88';
      case 'Concerning': return '#ff6b6b';
      case 'Normal': return '#00d4ff';
      case 'Detected': return '#ff6b6b';
      case 'Present': return '#ffaa00';
      default: return '#f1f1f1';
    }
  };

  return (
    <div className="eye-scanner-container">
      <div className="scanner-header">
        <h2>👁️ Advanced Eye Scanner & SANS Detection</h2>
        <p>Spaceflight Associated Neuro-ocular Syndrome (SANS) Monitoring System</p>
      </div>

      <div className="scanner-content">
        <div className="camera-section">
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`camera-feed ${isScanning ? 'scanning' : ''}`}
            />
            <canvas ref={canvasRef} className="retinal-canvas" style={{ display: 'none' }} />
            
            {isScanning && (
              <div className="scan-overlay">
                <div className="scan-grid"></div>
                <div className="scan-progress">
                  <div className="progress-ring">
                    <svg width="120" height="120">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="rgba(0, 212, 255, 0.2)"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        stroke="#00d4ff"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - scanProgress / 100)}`}
                        className="progress-circle"
                      />
                    </svg>
                    <div className="progress-text">{scanProgress}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="scanner-controls">
            <div className="eye-selection">
              <label>Scan Target:</label>
              <select 
                value={selectedEye} 
                onChange={(e) => setSelectedEye(e.target.value)}
                disabled={isScanning}
              >
                <option value="both">Both Eyes</option>
                <option value="left">Left Eye</option>
                <option value="right">Right Eye</option>
              </select>
            </div>

            <div className="control-buttons">
              {!cameraActive ? (
                <button className="camera-btn" onClick={startCamera}>
                  📹 Activate Camera
                </button>
              ) : (
                <button className="camera-btn active" onClick={stopCamera}>
                  📹 Camera Active
                </button>
              )}
              
              <button 
                className="scan-btn"
                onClick={startScan}
                disabled={isScanning}
              >
                {isScanning ? '🔍 Scanning...' : '🔍 Start Eye Scan'}
              </button>
              
              <button 
                className="capture-btn"
                onClick={captureRetinalImage}
                disabled={!cameraActive || isScanning}
              >
                📸 Capture Retinal Image
              </button>
            </div>
          </div>
        </div>

        {scanResults && (
          <div className="results-section">
            <div className="results-header">
              <h3>📊 Scan Results</h3>
              <div className="scan-timestamp">
                {scanResults.timestamp.toLocaleString()}
              </div>
            </div>

            <div className="overall-status">
              <div className="status-indicator">
                <span 
                  className="status-dot"
                  style={{ backgroundColor: getHealthColor(scanResults.overallHealth) }}
                ></span>
                Overall Eye Health: <strong style={{ color: getHealthColor(scanResults.overallHealth) }}>
                  {scanResults.overallHealth}
                </strong>
              </div>
              <div className="sans-risk">
                SANS Risk Level: <strong style={{ color: getRiskColor(scanResults.sansRisk) }}>
                  {scanResults.sansRisk}
                </strong>
              </div>
            </div>

            <div className="eye-details">
              <div className="eye-data">
                <h4>👁️ Left Eye</h4>
                <div className="metrics">
                  <div className="metric">
                    <span>Visual Acuity:</span>
                    <span>{scanResults.leftEye.visualAcuity}</span>
                  </div>
                  <div className="metric">
                    <span>IOP (mmHg):</span>
                    <span>{scanResults.leftEye.intraocularPressure}</span>
                  </div>
                  <div className="metric">
                    <span>Optic Disc:</span>
                    <span style={{ color: getHealthColor(scanResults.leftEye.opticDiscSwelling) }}>
                      {scanResults.leftEye.opticDiscSwelling}
                    </span>
                  </div>
                  <div className="metric">
                    <span>Retinal Thickness (μm):</span>
                    <span>{scanResults.leftEye.retinalThickness}</span>
                  </div>
                  <div className="metric">
                    <span>Blood Vessels:</span>
                    <span style={{ color: getHealthColor(scanResults.leftEye.bloodVesselChanges) }}>
                      {scanResults.leftEye.bloodVesselChanges}
                    </span>
                  </div>
                </div>
              </div>

              <div className="eye-data">
                <h4>👁️ Right Eye</h4>
                <div className="metrics">
                  <div className="metric">
                    <span>Visual Acuity:</span>
                    <span>{scanResults.rightEye.visualAcuity}</span>
                  </div>
                  <div className="metric">
                    <span>IOP (mmHg):</span>
                    <span>{scanResults.rightEye.intraocularPressure}</span>
                  </div>
                  <div className="metric">
                    <span>Optic Disc:</span>
                    <span style={{ color: getHealthColor(scanResults.rightEye.opticDiscSwelling) }}>
                      {scanResults.rightEye.opticDiscSwelling}
                    </span>
                  </div>
                  <div className="metric">
                    <span>Retinal Thickness (μm):</span>
                    <span>{scanResults.rightEye.retinalThickness}</span>
                  </div>
                  <div className="metric">
                    <span>Blood Vessels:</span>
                    <span style={{ color: getHealthColor(scanResults.rightEye.bloodVesselChanges) }}>
                      {scanResults.rightEye.bloodVesselChanges}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="recommendations">
              <h4>💡 Medical Recommendations</h4>
              <ul>
                {scanResults.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EyeScanner;
