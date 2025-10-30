import { useState, useEffect, useRef } from "react";
import { Video, StopCircle, Upload, RotateCcw, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UpdateOrders from "../../backend/order/updateorderstatus";

const RecordVideo = ({
  onClose,
  onUploaded,
  OrderID,
  VendorPhone,
  Status = "",
  type = "Before",
  OTP = "",
  PaymentMethod = "",
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoURL, setVideoURL] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // ✅ Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        alert("Camera access denied!");
        console.error(err);
      }
    };
    initCamera();

    return () => {
      if (streamRef.current)
        streamRef.current.getTracks().forEach((track) => track.stop());
      clearInterval(timerRef.current);
    };
  }, []);

  // ✅ Start recording
  const handleStartRecording = () => {
    if (!streamRef.current) return;

    const recorder = new MediaRecorder(streamRef.current);
    const localChunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) localChunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(localChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
      setChunks(localChunks);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(
      () => setRecordingTime((prev) => prev + 1),
      1000
    );
  };

  // ✅ Stop recording
  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // ✅ Reset
  const handleResetRecording = () => {
    setVideoURL(null);
    setChunks([]);
    setRecordingTime(0);
    if (videoRef.current && streamRef.current)
      videoRef.current.srcObject = streamRef.current;
  };

  // ✅ Convert Blob to Base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(blob);
    });
  };

  // ✅ Upload function
  const handleUpload = async () => {
    if (!chunks.length) return alert("No video recorded!");
    setIsUploading(true);

    try {
      const blob = new Blob(chunks, { type: "video/webm" });
      const base64String = await blobToBase64(blob);

      const payload = {
        OrderID,
        Status,
        VendorPhone,
        BeforVideo: type === "Before" ? base64String : "",
        AfterVideo: type === "After" ? base64String : "",
        OTP,
        PaymentMethod,
      };

      // 🔹 Step 1: Upload the video
      const response = await UpdateOrders(payload);
      console.log("📤 Upload Response:", response);

      // 🔹 Step 2: If it's an After video → update status to Completed
      if (type === "After") {
        const completePayload = {
          OrderID,
          Status: "Completed",
          VendorPhone,
        };
        const completeResponse = await UpdateOrders(completePayload);
        console.log("✅ Order marked as Completed:", completeResponse);
        window.location.reload();
      }

      alert(`✅ ${type} video uploaded successfully!`);
      onUploaded?.(OrderID);

      // Stop camera after upload
      if (streamRef.current)
        streamRef.current.getTracks().forEach((track) => track.stop());

      onClose?.();
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("❌ Upload failed!");
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ Timer formatter
  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div className="bg-white rounded-2xl p-6 w-full max-w-md relative shadow-xl">
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-black"
            onClick={onClose}
            disabled={isUploading}
          >
            <X size={20} />
          </button>

          <h2 className="text-lg font-semibold text-center mb-4">
            Record {type} Video
          </h2>

          {/* Video Display */}
          <div className="relative">
            {!videoURL ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-60 bg-black rounded-lg object-cover"
              />
            ) : (
              <video
                src={videoURL}
                controls
                className="w-full h-60 bg-black rounded-lg object-cover"
              />
            )}

            {isRecording && (
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
                <Clock size={12} /> {formatTime(recordingTime)}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-3 mt-4">
            {!isRecording && !videoURL && (
              <button
                onClick={handleStartRecording}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Video size={18} /> Start
              </button>
            )}

            {isRecording && (
              <button
                onClick={handleStopRecording}
                className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <StopCircle size={18} /> Stop
              </button>
            )}

            {!isRecording && videoURL && (
              <>
                <button
                  onClick={handleResetRecording}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <RotateCcw size={18} /> Reset
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className={`${
                    isUploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600"
                  } text-white px-4 py-2 rounded-lg flex items-center gap-2`}
                >
                  <Upload size={18} /> {isUploading ? "Uploading..." : "Upload"}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RecordVideo;
