import cv2
import os

def extract_frames(video_path, output_dir, timestamps):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created directory: {output_dir}")
        
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video file {video_path}")
        return
        
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    duration = total_frames / fps
    print(f"Video FPS: {fps}, Total Frames: {total_frames}, Duration: {duration:.2f}s")
    
    for i, ts in enumerate(timestamps, 1):
        frame_idx = int(ts * fps)
        if frame_idx >= total_frames:
            print(f"Warning: Timestamp {ts}s exceeds video duration. Skipping.")
            continue
            
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if ret:
            output_path = os.path.join(output_dir, f"frame_{i:02d}.jpg")
            cv2.imwrite(output_path, frame, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
            print(f"Extracted: {output_path} at {ts}s (frame {frame_idx})")
        else:
            print(f"Error: Could not read frame at {ts}s")
            
    cap.release()
    print("Extraction completed!")

if __name__ == "__main__":
    video_file = "Destination periyar.mp4"
    output_folder = "extracted_images"
    # Target timestamps in seconds
    target_timestamps = [1.5, 5.0, 8.0, 13.5, 17.5, 24.0, 27.0, 30.0, 33.5, 39.0, 53.0]
    
    extract_frames(video_file, output_folder, target_timestamps)
