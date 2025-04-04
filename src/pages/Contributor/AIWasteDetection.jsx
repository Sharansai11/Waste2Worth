import React, { useState, useRef, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Card,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Spinner,
} from "react-bootstrap";
import { BsCamera } from "react-icons/bs";
import { sendImageToGemini } from "../../services/aiService";
import { fetchYouTubeSearch } from "../../services/mapsService";
import { useAuth } from "../../context/AuthContext";

const AIWasteDetection = () => {
  const [prompt, setPrompt] = useState("");
  const [base64Image, setBase64Image] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [useCamera, setUseCamera] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false); // <-- Declare here
  const [videoSearchList, setVideoSearchList] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Helper to format multiline text as paragraphs
  const formatAsParagraphs = (text) => {
    if (!text) return null;
    const cleaned = text.replace(/\*\*/g, "").replace(/\*/g, "");
    const lines = cleaned.split(/\r?\n/).filter((line) => line.trim() !== "");
    return lines.map((line, idx) => <p key={idx}>{line.trim()}</p>);
  };

  // Start or stop camera stream
  useEffect(() => {
    let stream;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Error accessing camera: " + err.message);
      }
    };

    if (useCamera) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useCamera]);

  // File -> Base64 conversion
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64Image(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Capture photo -> Base64 conversion
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg");
      setBase64Image(imageData);
    }
  };

  // Submit image & prompt to Gemini
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!base64Image) {
      setError("Please upload or capture an image for analysis.");
      return;
    }
    setLoadingResponse(true);
    const effectivePrompt =
      prompt ||
      `Based on the provided image, please generate a JSON object with these keys:
{
  "detectedWasteType": "string (clearly identify the material or product in the image)",
  "upcyclingMethods": "string (provide detailed, line-by-line suggestions for creatively reusing or repurposing this specific waste/product, including any tools or materials needed)",
  "recyclingGuidelines": "string (provide step-by-step instructions for safely recycling or disposing of this specific waste/product, including best practices to reduce contamination or waste)",
  "youtubeSearchQuery": "string (relevant keywords for finding upcycling or recycling tutorials on YouTube for this waste/product)"
}
Ensure the response is valid JSON with no extra formatting.`;
    try {
      // Call Gemini API
      const data = await sendImageToGemini(base64Image, effectivePrompt);
      setResult(data);
      setError("");
      // If youtubeSearchQuery exists, fetch YouTube search results.
      if (data.youtubeSearchQuery) {
        const searchResults = await fetchYouTubeSearch(data.youtubeSearchQuery);
        setVideoSearchList(searchResults);
      } else {
        setVideoSearchList([]);
      }
    } catch (err) {
      setError("Error processing image: " + err.message);
    } finally {
      setLoadingResponse(false);
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-4">
        <h3 className="mb-3 text-center">AI Waste Detection, Upcycling Ideas & Safe Disposal Guidelines</h3>
        {error && <Alert variant="danger">{error}</Alert>}

        <ToggleButtonGroup
          type="radio"
          name="imageSource"
          defaultValue={0}
          onChange={(val) => setUseCamera(val === 1)}
          className="mb-3 d-flex justify-content-center"
        >
          <ToggleButton id="tbg-radio-1" value={0} variant="outline-success">
            <i className="bi bi-upload me-2"></i> Upload Image
          </ToggleButton>
          <ToggleButton id="tbg-radio-2" value={1} variant="outline-success">
            <i className="bi bi-camera-fill me-2"></i><b> <BsCamera size={24} className="me-2" /> Use Camera</b> 
          </ToggleButton>
        </ToggleButtonGroup>

        <Form onSubmit={handleSubmit}>
          {useCamera ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                className="w-100 mb-2"
                style={{ maxHeight: "300px" }}
              />
              <Button variant="warning" onClick={capturePhoto} className="mt-2 w-100">
                <i className="bi bi-camera me-2"></i> Capture Photo
              </Button>
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </>
          ) : (
            <Form.Group className="mb-3">
              <Form.Label>
                <i className="bi bi-image-fill me-2"></i> Upload Image
              </Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
            </Form.Group>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Additional Prompt (Optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Suggest creative upcycling ideas for plastic waste"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </Form.Group>
          <Button variant="success" type="submit" className="w-100 mt-3">
            <i className="bi bi-lightbulb me-2"></i> Generate Upcycling Ideas and Safe Disposal Guidelines
          </Button>
        </Form>

        {/* Spinner until AI response is shown */}
        {loadingResponse && (
          <div className="text-center my-4">
            <Spinner animation="border" role="status" variant="primary" />
            <p className="mt-2">Detecting object and generating ideas...</p>
          </div>
        )}

        {/* Image Preview */}
        {base64Image && (
          <Card className="mt-3 p-3 shadow">
            <h5 className="text-center">
              <i className="bi bi-eye-fill me-2"></i> Image Preview
            </h5>
            <img
              src={base64Image}
              alt="Preview"
              className="img-fluid rounded shadow d-block mx-auto"
              style={{ maxWidth: "300px", width: "100%" }}
            />
          </Card>
        )}

        {/* Gemini AI Result */}
        {result && (
          <div className="mt-4">
            <h4 className="mb-3">AI Response</h4>
            <p>
              <strong>Waste Type:</strong> {result.detectedWasteType}
            </p>
            <div className="mt-3">
              <strong>Upcycling Methods:</strong>
              {formatAsParagraphs(result.upcyclingMethods)}
            </div>
            <div className="mt-3">
              <strong>Recycling Guidelines:</strong>
              {formatAsParagraphs(result.recyclingGuidelines)}
            </div>
          </div>
        )}

        {/* YouTube Search Results (Embedded Videos) */}
        {videoSearchList.length > 0 && (
          <div className="mt-4">
            <h5 className="mb-3">Relevant YouTube Videos</h5>
            <div className="row">
              {videoSearchList.map((video) => (
                <div key={video.videoId} className="col-12 col-sm-6 col-lg-4 mb-4">
                  <div className="ratio ratio-16x9">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.videoId}`}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <p className="mt-2 text-center fw-semibold">{video.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </Container>
  );
};

export default AIWasteDetection;
