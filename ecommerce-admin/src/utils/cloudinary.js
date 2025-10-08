// src/utils/cloudinary.js
export async function uploadImage(file) {
  // ✅ 15MB size check
  const MAX_SIZE = 15 * 1024 * 1024; // 15MB in bytes
  if (file.size > MAX_SIZE) {
    throw new Error(`File "${file.name}" exceeds the 15MB limit`);
  }

  // detect type: video or image
  const resourceType = file.type.startsWith("video/") ? "video" : "image";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ecommerce_upload"); // your unsigned preset

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dwdu05lbb/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.secure_url; // hosted file URL (image or video)
}
