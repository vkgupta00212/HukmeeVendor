import { useState, useEffect, useRef } from "react";
import { X, Video, StopCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UpdateOrders from "../../backend/order/updateorderstatus";

// ✅ Hook: Get window width
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({ width: undefined });
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth });
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
};

const RecordVideo = ({
  onClose,
  onUploaded, // ✅ added callback to notify parent on success
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
  const { width } = useWindowSize();
  const isMobile = width < 640;

  // ✅ Initialize Camera
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
        alert("Camera access denied. Please enable permissions.");
        console.error("Camera error:", err);
      }
    };
    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      clearInterval(timerRef.current);
    };
  }, []);

  // ✅ Start Recording
  const handleStartRecording = () => {
    if (!streamRef.current) return;
    const recorder = new MediaRecorder(streamRef.current);
    setChunks([]);
    setMediaRecorder(recorder);
    setRecordingTime(0);

    recorder.ondataavailable = (e) => setChunks((prev) => [...prev, e.data]);

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoURL(url);
      await uploadVideo(blob);
    };

    recorder.start();
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  // ✅ Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // ✅ Convert Blob → Base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // ✅ Upload Video to Server
  // ✅ Upload Video to Server
  const uploadVideo = async (blob) => {
    setIsUploading(true);
    try {
      const base64String = await blobToBase64(blob);
      console.log("🎥 Base64 (first 100 chars):", base64String.slice(0, 100));

      const payload = {
        OrderID,
        Status,
        VendorPhone,
        BeforVideo: type === "Before" ? base64String : "",
        AfterVideo: type === "After" ? base64String : "",
        OTP,
        PaymentMethod,
      };

      // 🔹 Step 1: Upload the video first
      const response = await UpdateOrders(payload);
      console.log("📤 Upload Response:", response);

      // 🔹 Step 2: If it's AFTER video, mark order as Completed
      if (type === "After") {
        const completePayload = {
          OrderID,
          Status: "Completed",
          VendorPhone,
        };
        await UpdateOrders(completePayload);
        console.log("✅ Order status changed to Completed");
      }

      alert(`✅ ${type} video uploaded successfully!`);

      // 🔹 Step 3: Notify parent component about successful upload
      if (onUploaded) onUploaded(OrderID);

      // 🔹 Step 4: Stop camera & close modal
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      onClose?.();
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Error uploading video!");
    } finally {
      setIsUploading(false);
    }
  };

  // ⏱ Timer Formatting
  const formatTime = (timeInSec) => {
    const minutes = Math.floor(timeInSec / 60);
    const seconds = timeInSec % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Animations
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const bottomSheetVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          variants={isMobile ? bottomSheetVariants : modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3 }}
          className={`bg-white rounded-2xl shadow-lg w-full ${
            isMobile ? "h-[80vh] max-w-md" : "max-w-md"
          } p-6 relative`}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            onClick={onClose}
            disabled={isUploading}
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-xl font-semibold text-center mb-4">
            Record {type} Verification Video
          </h2>
          <p className="text-sm text-gray-600 text-center mb-4">
            Record your {type.toLowerCase()} video. It will automatically upload
            after stopping.
          </p>

          {/* Camera Preview */}
          <div className="relative flex justify-center mb-4">
            {!videoURL ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-60 rounded-lg bg-black object-cover"
              />
            ) : (
              <video
                src={videoURL}
                controls
                className="w-full h-60 rounded-lg bg-black object-cover"
              />
            )}

            {/* Timer */}
            {isRecording && (
              <div className="absolute top-2 left-2 bg-black/60 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                <Clock size={14} /> {formatTime(recordingTime)}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={isUploading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white ${
                  isUploading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                } transition`}
              >
                <Video size={20} /> Start
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 transition"
              >
                <StopCircle size={20} /> Stop
              </button>
            )}
          </div>

          {/* Uploading */}
          {isUploading && (
            <div className="mt-4 text-center text-gray-600 animate-pulse">
              ⏳ Uploading video to server, please wait...
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RecordVideo;
